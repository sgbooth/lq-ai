import { apiRequest } from "@/shared/api.ts";
import type { Project } from "@/shared/types.ts";
export const ensureSandbox = () =>
  apiRequest<Project>("/projects/sandbox/ensure", { method: "POST" });
