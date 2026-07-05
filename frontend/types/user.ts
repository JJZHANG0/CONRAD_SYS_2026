export type UserRole = "student" | "teacher" | "operations";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  display_name: string;
  school?: string;
  grade?: string;
}
