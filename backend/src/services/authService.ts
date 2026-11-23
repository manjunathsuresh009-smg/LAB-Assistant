import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { AppError } from "../utils/errors";
import { signToken } from "../utils/jwt";
import { serializeUser } from "../utils/serializers";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  departmentId?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN");

  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw new AppError("Selected department does not exist", 400, "INVALID_DEPARTMENT");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  // Public registration can only create students. Faculty/admin are provisioned by an admin.
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: "STUDENT",
      departmentId: input.departmentId ?? null,
    },
    include: { department: true },
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: serializeUser(user) };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, include: { department: true } });
  if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: serializeUser(user) };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { department: true } });
  if (!user) throw new AppError("Account not found", 404, "NOT_FOUND");
  return serializeUser(user);
}
