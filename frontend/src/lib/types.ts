export type Role = "STUDENT" | "FACULTY" | "ADMIN";

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export type EquipmentStatus = "AVAILABLE" | "MAINTENANCE" | "RETIRED";

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  department: Department | null;
  createdAt?: string;
}

export interface Equipment {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  status: EquipmentStatus;
  quantity: number;
  tags: string[];
  specs: Record<string, string>;
  departmentId: string;
  department: Department;
  createdAt: string;
  updatedAt?: string;
  availableUnitsNow?: number;
  busyNext24h?: number;
  upcomingApprovedSlots?: Array<{ startsAt: string; endsAt: string }>;
}

export interface PriorityFactor {
  score: number;
  weight: number;
  weighted: number;
  reason: string;
}

export interface PriorityBreakdown {
  deadlineUrgency: PriorityFactor;
  compatibility: PriorityFactor;
  availability: PriorityFactor;
  fairness: PriorityFactor;
}

export interface PriorityResult {
  score: number;
  breakdown: PriorityBreakdown;
  reasons: string[];
}

export interface Booking {
  id: string;
  projectName: string;
  projectDescription: string;
  additionalRequirements?: string | null;
  startsAt: string;
  endsAt: string;
  projectDeadline: string;
  status: BookingStatus;
  rejectionReason?: string | null;
  priorityScore?: number | null;
  priorityBreakdown?: PriorityBreakdown | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
  userId: string;
  equipmentId: string;
  departmentId: string;
  equipment?: Equipment;
  department?: Department;
  user?: Pick<User, "id" | "name" | "email" | "role"> & { department?: Department | null };
  reviewedBy?: { id: string; name: string } | null;
}

export interface ConflictCandidate {
  bookingId: string;
  projectName: string;
  projectDescription: string;
  startsAt: string;
  endsAt: string;
  projectDeadline: string;
  requestedDurationMinutes: number;
  student: { id: string; name: string; email: string; department: string | null };
  priority: PriorityResult;
  recommendation: "APPROVE" | "DEFER";
  explanation: string;
  alternativeSlots: Array<{ startsAt: string; endsAt: string }>;
  alternativeEquipment: Array<{
    id: string;
    name: string;
    category: string;
    location: string;
    department: string;
    freeUnits: number;
  }>;
}

export interface ConflictGroup {
  equipment: {
    id: string;
    name: string;
    category: string;
    location: string;
    quantity: number;
    department: Department;
  };
  conflictDetected: boolean;
  recommendedOrder: Array<{
    bookingId: string;
    student: string;
    priority: number;
    recommendation: "APPROVE" | "DEFER";
  }>;
  candidates: ConflictCandidate[];
  summary: string;
}

export interface ConflictResponse {
  engine: string;
  weights: {
    deadlineUrgency: number;
    compatibility: number;
    availability: number;
    fairness: number;
  };
  generatedAt: string;
  summary: string;
  groups: ConflictGroup[];
}

export interface AiRecommendation {
  equipment: Equipment;
  reason: string;
  confidence: number;
  matchedKeywords: string[];
}

export interface AiRecommendationResponse {
  source: "gemini" | "rule-based";
  summary: string;
  note: string;
  generatedAt: string;
  recommendations: AiRecommendation[];
}

export interface AnalyticsRecommendation {
  title: string;
  detail: string;
  tone: "opportunity" | "warning" | "info";
}

export interface DashboardAnalytics {
  counts: {
    equipment: number;
    availableEquipment: number;
    activeBookings: number;
    pendingRequests: number;
    departments: number;
    totalBookings: number;
    approvedBookings: number;
    users: number;
    students: number;
  };
  utilisationPercent: number;
  window: { start: string; end: string; days: number; operatingHoursPerDay: number };
  departmentDistribution: Array<{ name: string; code: string; equipmentCount: number; units: number }>;
  utilisationByEquipment: Array<{ name: string; percent: number }>;
  bookingActivity: Array<{ date: string; label: string; bookings: number }>;
  mostRequested: Array<{ id: string; name: string; department: string; count: number }>;
  recentActivity: Array<{
    id: string;
    projectName: string;
    status: BookingStatus;
    createdAt: string;
    startsAt: string;
    endsAt: string;
    student: string;
    equipment: string;
  }>;
  recommendations: AnalyticsRecommendation[];
  generatedAt: string;
}

export interface UtilisationAnalytics {
  utilisationPercent: number;
  window: { start: string; end: string; days: number; operatingHoursPerDay: number };
  byEquipment: Array<{
    id: string;
    name: string;
    category: string;
    department: string;
    quantity: number;
    bookedHours: number;
    utilisationPercent: number;
  }>;
  byDepartment: Array<{
    name: string;
    code: string;
    bookedHours: number;
    units: number;
    utilisationPercent: number;
  }>;
  underutilised: Array<{
    id: string;
    name: string;
    category: string;
    department: string;
    quantity: number;
    bookedHours: number;
    utilisationPercent: number;
  }>;
  mostRequested: Array<{ id: string; name: string; department: string; count: number }>;
  monthlyUsage: Array<{ month: string; label: string; hours: number }>;
  recommendations: AnalyticsRecommendation[];
  generatedAt: string;
}

export interface AdminDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  equipmentCount: number;
  userCount: number;
}
