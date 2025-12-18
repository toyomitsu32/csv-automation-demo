import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getAllCsvData, replaceCsvData, seedSampleCsvData, getUserPurchases, createUserWithPassword, verifyUserPassword } from "./db";
import { stripeRouter } from "./stripe";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Register new user with username/password
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(64),
        password: z.string().min(6).max(128),
        name: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await createUserWithPassword(
            input.username,
            input.password,
            input.name,
            input.email
          );
          
          if (!user) {
            throw new Error("Failed to create user");
          }

          // Create session token and set cookie
          const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "" });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

          return { success: true, user: { id: user.id, username: user.username, name: user.name } };
        } catch (error) {
          if (error instanceof Error && error.message === "Username already exists") {
            throw new Error("このユーザー名は既に使用されています");
          }
          throw error;
        }
      }),

    // Login with username/password
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await verifyUserPassword(input.username, input.password);
        
        if (!user) {
          throw new Error("ユーザー名またはパスワードが正しくありません");
        }

        // Create session token and set cookie
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true, user: { id: user.id, username: user.username, name: user.name } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  csv: router({
    // Get all CSV data
    getData: protectedProcedure.query(async () => {
      await seedSampleCsvData();
      return await getAllCsvData();
    }),

    // Download CSV as string
    download: protectedProcedure.query(async () => {
      await seedSampleCsvData();
      const data = await getAllCsvData();
      
      const headers = ["Product", "Quantity", "Price"];
      const rows = data.map(row => [row.product, row.quantity.toString(), row.price.toString()]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");
      
      return { csv: csvContent, filename: "data.csv" };
    }),

    // Upload and replace CSV data
    upload: protectedProcedure
      .input(z.object({
        csvContent: z.string(),
      }))
      .mutation(async ({ input }) => {
        const lines = input.csvContent.trim().split("\n");
        if (lines.length < 2) {
          throw new Error("CSV must have at least a header and one data row");
        }

        const header = lines[0].split(",").map(h => h.trim().toLowerCase());
        const productIdx = header.indexOf("product");
        const quantityIdx = header.indexOf("quantity");
        const priceIdx = header.indexOf("price");

        if (productIdx === -1 || quantityIdx === -1 || priceIdx === -1) {
          throw new Error("CSV must have Product, Quantity, and Price columns");
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          if (values.length < 3) continue;

          const product = values[productIdx];
          const quantity = parseInt(values[quantityIdx], 10);
          const price = parseFloat(values[priceIdx]);

          if (!product || isNaN(quantity) || isNaN(price)) continue;

          data.push({
            product,
            quantity,
            price: price.toFixed(2),
          });
        }

        if (data.length === 0) {
          throw new Error("No valid data rows found in CSV");
        }

        await replaceCsvData(data);
        return { success: true, rowsImported: data.length };
      }),
  }),

  purchases: router({
    // Get user's purchase history
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPurchases(ctx.user.id);
    }),
  }),

  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
