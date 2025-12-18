import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUnauthContext(): { ctx: TrpcContext; setCookies: { name: string; value: string; options: any }[] } {
  const setCookies: { name: string; value: string; options: any }[] = [];

  return {
    ctx: {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
        cookie: (name: string, value: string, options: any) => {
          setCookies.push({ name, value, options });
        },
      } as unknown as TrpcContext["res"],
    },
    setCookies,
  };
}

describe("auth.register", () => {
  it("registers a new user with valid credentials", async () => {
    const { ctx, setCookies } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueUsername = `testuser_${Date.now()}`;
    const result = await caller.auth.register({
      username: uniqueUsername,
      password: "testpass123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.user.username).toBe(uniqueUsername);
    expect(setCookies.length).toBe(1);
    expect(setCookies[0].name).toBe("app_session_id");
  });

  it("throws error for short username", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        username: "ab",
        password: "testpass123",
      })
    ).rejects.toThrow();
  });

  it("throws error for short password", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        username: "validuser",
        password: "12345",
      })
    ).rejects.toThrow();
  });
});

describe("auth.login", () => {
  it("logs in with valid credentials", async () => {
    const { ctx: registerCtx } = createUnauthContext();
    const registerCaller = appRouter.createCaller(registerCtx);

    const uniqueUsername = `logintest_${Date.now()}`;
    await registerCaller.auth.register({
      username: uniqueUsername,
      password: "loginpass123",
    });

    const { ctx: loginCtx, setCookies } = createUnauthContext();
    const loginCaller = appRouter.createCaller(loginCtx);

    const result = await loginCaller.auth.login({
      username: uniqueUsername,
      password: "loginpass123",
    });

    expect(result.success).toBe(true);
    expect(result.user.username).toBe(uniqueUsername);
    expect(setCookies.length).toBe(1);
  });

  it("throws error for invalid password", async () => {
    const { ctx: registerCtx } = createUnauthContext();
    const registerCaller = appRouter.createCaller(registerCtx);

    const uniqueUsername = `wrongpass_${Date.now()}`;
    await registerCaller.auth.register({
      username: uniqueUsername,
      password: "correctpass123",
    });

    const { ctx: loginCtx } = createUnauthContext();
    const loginCaller = appRouter.createCaller(loginCtx);

    await expect(
      loginCaller.auth.login({
        username: uniqueUsername,
        password: "wrongpassword",
      })
    ).rejects.toThrow("ユーザー名またはパスワードが正しくありません");
  });

  it("throws error for non-existent user", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        username: "nonexistent_user_12345",
        password: "anypassword",
      })
    ).rejects.toThrow("ユーザー名またはパスワードが正しくありません");
  });
});
