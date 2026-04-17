import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../db";
import { sdk } from "./sdk";
import { getOrCreateGuestUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = await getOrCreateGuestUser().catch((err) => {
      console.warn("[Auth] Falling back to guest user failed:", err);
      return null;
    });
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
