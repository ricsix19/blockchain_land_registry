declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after a valid Bearer JWT */
      user?: { id: number; role: "admin" | "user" };
    }
  }
}

export {};
