import type { Role } from "../generated/prisma/enums.js";

export interface UserPayload {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
