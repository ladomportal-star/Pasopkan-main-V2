import "express";

/** The authenticated principal attached by the auth middleware. */
export interface AuthUser {
  uid: string;
  email?: string;
  /** True for Supabase guest (anonymous sign-in) sessions. */
  isAnonymous?: boolean;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
