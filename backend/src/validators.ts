import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(120),
  password: z.string().min(1, "Password is required").max(72),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email").max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  departmentId: z.string().min(1).optional(),
});

export const createBookingSchema = z.object({
  projectName: z.string().min(3, "Project name is too short").max(120),
  projectDescription: z.string().min(10, "Describe your project in at least 10 characters").max(2000),
  additionalRequirements: z.string().max(1000).optional(),
  equipmentId: z.string().min(1, "Select equipment"),
  departmentId: z.string().min(1, "Select a department"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  projectDeadline: z.coerce.date(),
});

export const bookingQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"])
    .optional(),
  equipmentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const rejectSchema = z.object({
  reason: z.string().min(5, "Provide a reason of at least 5 characters").max(500),
});

export const aiRecommendSchema = z.object({
  description: z
    .string()
    .min(10, "Describe your project in at least 10 characters")
    .max(2000),
});

export const resolveConflictsSchema = z.object({
  equipmentId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
});

export const equipmentQuerySchema = z.object({
  q: z.string().max(120).optional(),
  department: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
  available: z.enum(["true", "false"]).optional(),
  sort: z.enum(["name", "newest", "category", "department"]).optional(),
});

export const equipmentStatusSchema = z.enum(["AVAILABLE", "MAINTENANCE", "RETIRED"]);

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  category: z.string().min(2).max(80),
  location: z.string().min(2).max(120),
  departmentId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(100),
  tags: z.array(z.string().min(1).max(40)).max(25).default([]),
  specs: z.record(z.string().max(80), z.string().max(200)).default({}),
  status: equipmentStatusSchema.optional(),
});

export const updateEquipmentSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.string().min(2).max(80).optional(),
  location: z.string().min(2).max(120).optional(),
  departmentId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).max(100).optional(),
  tags: z.array(z.string().min(1).max(40)).max(25).optional(),
  specs: z.record(z.string().max(80), z.string().max(200)).optional(),
  status: equipmentStatusSchema.optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10),
  description: z.string().max(300).optional(),
});

export const userQuerySchema = z.object({
  role: z.enum(["STUDENT", "FACULTY", "ADMIN"]).optional(),
});
