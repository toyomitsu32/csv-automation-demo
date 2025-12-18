import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    stripeCustomerId: null,
    subscriptionStatus: "none",
    subscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("csv.getData", () => {
  it("returns CSV data for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.csv.getData();

    expect(Array.isArray(result)).toBe(true);
  });

  it("throws error for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.csv.getData()).rejects.toThrow();
  });
});

describe("csv.download", () => {
  it("returns CSV content with filename for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.csv.download();

    expect(result).toHaveProperty("csv");
    expect(result).toHaveProperty("filename");
    expect(typeof result.csv).toBe("string");
    expect(result.filename).toBe("data.csv");
  });

  it("throws error for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.csv.download()).rejects.toThrow();
  });
});

describe("csv.upload", () => {
  it("successfully uploads valid CSV data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const csvContent = `Product,Quantity,Price
TestProduct1,10,1000
TestProduct2,20,2000`;

    const result = await caller.csv.upload({ csvContent });

    expect(result.success).toBe(true);
    expect(result.rowsImported).toBe(2);
  });

  it("throws error for CSV without required columns", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const csvContent = `Name,Value
Test,100`;

    await expect(caller.csv.upload({ csvContent })).rejects.toThrow(
      "CSV must have Product, Quantity, and Price columns"
    );
  });

  it("throws error for empty CSV", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const csvContent = `Product,Quantity,Price`;

    await expect(caller.csv.upload({ csvContent })).rejects.toThrow(
      "CSV must have at least a header and one data row"
    );
  });

  it("throws error for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const csvContent = `Product,Quantity,Price
TestProduct,10,1000`;

    await expect(caller.csv.upload({ csvContent })).rejects.toThrow();
  });
});
