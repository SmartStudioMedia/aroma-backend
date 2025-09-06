import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "./db";
const JWT_SECRET = process.env.JWT_SECRET!;

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid credentials");
  const token = jwt.sign({ uid: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return { token, role: user.role };
}

export function verify(token: string) {
  return jwt.verify(token, JWT_SECRET) as { uid: string; role: "ADMIN" | "STAFF" };
}

