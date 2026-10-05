export type { LoginRequest, User } from "@/shared/types.ts";
import type { User } from "@/shared/types.ts";
export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: User;
}
