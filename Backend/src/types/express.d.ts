import "express";

/** The authenticated principal attached by the auth middleware. */
export interface AuthUser {
  uid: string;
  email?: string;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
