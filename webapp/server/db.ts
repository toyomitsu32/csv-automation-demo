import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, csvData, InsertCsvData, CsvData, purchases, InsertPurchase, Purchase, User } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Username/Password auth functions
export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(
  username: string,
  password: string,
  name?: string,
  email?: string
): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const openId = `local_${username}_${Date.now()}`;

  await db.insert(users).values({
    openId,
    username,
    password: hashedPassword,
    name: name || username,
    email,
    loginMethod: "password",
    lastSignedIn: new Date(),
  });

  return await getUserByUsername(username) || null;
}

export async function verifyUserPassword(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);
  if (!user || !user.password) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  // Update last signed in
  const db = await getDb();
  if (db) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  }

  return user;
}

// CSV Data functions
export async function getAllCsvData(): Promise<CsvData[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get CSV data: database not available");
    return [];
  }
  return await db.select().from(csvData);
}

export async function insertCsvData(data: InsertCsvData[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert CSV data: database not available");
    return;
  }
  if (data.length > 0) {
    await db.insert(csvData).values(data);
  }
}

export async function clearCsvData(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear CSV data: database not available");
    return;
  }
  await db.delete(csvData);
}

export async function replaceCsvData(data: InsertCsvData[]): Promise<void> {
  await clearCsvData();
  await insertCsvData(data);
}

// User Stripe functions
export async function updateUserStripeInfo(userId: number, stripeCustomerId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
}

export async function updateUserSubscription(
  userId: number, 
  subscriptionId: string, 
  subscriptionStatus: "none" | "active" | "canceled" | "past_due"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ subscriptionId, subscriptionStatus }).where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Purchase functions
export async function createPurchase(purchase: InsertPurchase): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(purchases).values(purchase);
}

export async function updatePurchaseStatus(
  stripePaymentIntentId: string, 
  status: "pending" | "succeeded" | "failed" | "refunded"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(purchases).set({ status }).where(eq(purchases.stripePaymentIntentId, stripePaymentIntentId));
}

export async function getUserPurchases(userId: number): Promise<Purchase[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchases).where(eq(purchases.userId, userId));
}

// Seed sample data
export async function seedSampleCsvData(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existingData = await getAllCsvData();
  if (existingData.length > 0) return;
  
  const sampleData: InsertCsvData[] = [
    { product: "Laptop", quantity: 10, price: "120000.00" },
    { product: "Mouse", quantity: 50, price: "2500.00" },
    { product: "Keyboard", quantity: 30, price: "7500.00" },
    { product: "Monitor", quantity: 15, price: "30000.00" },
    { product: "USB Cable", quantity: 100, price: "500.00" },
  ];
  
  await insertCsvData(sampleData);
}
