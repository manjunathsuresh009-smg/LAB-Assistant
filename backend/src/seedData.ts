import { BookingStatus, EquipmentStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

interface DemoDepartment {
  name: string;
  code: string;
  description: string;
}

interface DemoEquipment {
  name: string;
  description: string;
  category: string;
  location: string;
  department: string;
  quantity: number;
  tags: string[];
  specs: Record<string, string>;
  status?: EquipmentStatus;
}

interface DemoUser {
  name: string;
  email: string;
  role: Role;
  department?: string;
  password: string;
}

const DEMO_DEPARTMENTS: DemoDepartment[] = [
  { name: "Electronics & Communication Engineering", code: "ECE", description: "Embedded systems, VLSI and communication labs." },
  { name: "Computer Science & Engineering", code: "CSE", description: "AI, edge computing and software engineering labs." },
  { name: "Mechanical Engineering", code: "MECH", description: "Fabrication, robotics and CAD laboratories." },
  { name: "Electrical & Electronics Engineering", code: "EEE", description: "Power systems and measurement laboratories." },
  { name: "Biotechnology", code: "BIO", description: "AgriTech, sensors and life-science instrumentation." },
];

const DEMO_EQUIPMENT: DemoEquipment[] = [
  {
    name: "Arduino Uno",
    description: "Industry-standard 8-bit microcontroller board for embedded prototyping, sensor integration and coursework.",
    category: "Microcontrollers",
    location: "ECE Lab A - Rack 2",
    department: "ECE",
    quantity: 8,
    tags: ["arduino", "microcontroller", "embedded", "iot", "sensors", "prototyping"],
    specs: { Microcontroller: "ATmega328P", Clock: "16 MHz", "Digital I/O": "14", "Analog Inputs": "6", "Operating Voltage": "5V" },
  },
  {
    name: "Raspberry Pi 5",
    description: "Quad-core single board computer for Linux-based projects, edge gateways and lightweight inference.",
    category: "Single Board Computers",
    location: "CSE Innovation Lab - Shelf 1",
    department: "CSE",
    quantity: 4,
    tags: ["raspberry pi", "linux", "edge", "python", "gateway", "computing"],
    specs: { Processor: "ARM Cortex-A76 Quad Core", RAM: "8 GB", Connectivity: "Wi-Fi 6, Bluetooth 5.0", GPIO: "40-pin" },
  },
  {
    name: "NVIDIA Jetson Nano",
    description: "Compact edge AI computer for computer-vision experiments and low-power deep learning deployment.",
    category: "Edge AI",
    location: "AI Lab - Workbench 3",
    department: "CSE",
    quantity: 2,
    tags: ["ai", "machine learning", "computer vision", "edge", "gpu", "deep learning", "inference"],
    specs: { GPU: "128-core Maxwell", CPU: "Quad-core ARM A57", RAM: "4 GB", "AI Performance": "472 GFLOPS" },
  },
  {
    name: "FPGA Development Board",
    description: "Artix-7 FPGA board for digital design, HDL coursework and high-speed custom logic experiments.",
    category: "FPGA",
    location: "ECE VLSI Lab - Cabinet B",
    department: "ECE",
    quantity: 3,
    tags: ["fpga", "verilog", "vhdl", "digital design", "vlsi", "signal processing"],
    specs: { Family: "Xilinx Artix-7", "Logic Cells": "33,280", I_O: "106", Toolchain: "Vivado" },
  },
  {
    name: "3D Printer",
    description: "FDM 3D printer for rapid prototyping, enclosures and mechanical design validation.",
    category: "Fabrication",
    location: "MECH Fabrication Bay",
    department: "MECH",
    quantity: 2,
    tags: ["3d printing", "rapid prototyping", "mechanical", "fabrication", "cad", "prototype"],
    specs: { Technology: "FDM", "Build Volume": "220 x 220 x 250 mm", Materials: "PLA, PETG, ABS", "Layer Resolution": "0.1 mm" },
  },
  {
    name: "IoT Development Kit",
    description: "Complete IoT development kit with ESP32, environmental sensors and cloud connectivity modules.",
    category: "IoT",
    location: "ECE Lab B - Rack 1",
    department: "ECE",
    quantity: 5,
    tags: ["iot", "sensors", "wifi", "cloud", "esp32", "smarthome", "telemetry"],
    specs: { Controller: "ESP32", Sensors: "Temp, Humidity, Motion, Light", Cloud: "MQTT / HTTP", Power: "USB-C" },
  },
  {
    name: "Robotics Kit",
    description: "Four-wheel differential drive robotics kit with motor drivers, IMU and ranging sensors.",
    category: "Robotics",
    location: "Robotics Arena - Bay 2",
    department: "MECH",
    quantity: 3,
    tags: ["robotics", "motors", "autonomous", "rover", "control", "mechanical", "navigation"],
    specs: { Motors: "4x DC Geared", Controller: "Arduino Mega", Sensors: "Ultrasonic, IR, IMU", Chassis: "Aluminium 4WD" },
  },
  {
    name: "GPU Workstation",
    description: "High-end workstation for deep learning training, GPU rendering and large-scale simulation.",
    category: "High Performance Computing",
    location: "AI Lab - Station 1",
    department: "CSE",
    quantity: 1,
    tags: ["gpu", "deep learning", "training", "cuda", "ai", "rendering", "simulation"],
    specs: { GPU: "NVIDIA RTX 4090", CPU: "Intel Core i9", RAM: "64 GB", Storage: "2 TB NVMe" },
  },
  {
    name: "Oscilloscope",
    description: "Four-channel digital oscilloscope for signal integrity, waveform capture and circuit debugging.",
    category: "Test & Measurement",
    location: "ECE Test Bench 4",
    department: "ECE",
    quantity: 4,
    tags: ["oscilloscope", "signal", "measurement", "electronics", "debugging", "waveform"],
    specs: { Bandwidth: "100 MHz", Channels: "4", "Sample Rate": "1 GSa/s", Display: "7 inch" },
    status: EquipmentStatus.MAINTENANCE,
  },
  {
    name: "Embedded Systems Workstation",
    description: "Debug-equipped workstation for ARM firmware development, RTOS coursework and hardware bring-up.",
    category: "Embedded",
    location: "ECE Embedded Lab - Desk 6",
    department: "ECE",
    quantity: 6,
    tags: ["embedded", "arm", "microcontroller", "firmware", "rtos", "electronics"],
    specs: { Debugger: "JTAG / SWD", Boards: "STM32, ESP32", IDE: "STM32CubeIDE", Interfaces: "UART, SPI, I2C" },
  },
  {
    name: "Soil Moisture Sensor",
    description: "Capacitive soil moisture probe for precision agriculture, irrigation control and environmental monitoring.",
    category: "Sensors",
    location: "BIO AgriTech Lab - Drawer 3",
    department: "BIO",
    quantity: 12,
    tags: ["soil", "moisture", "agriculture", "sensor", "farming", "iot", "environment", "irrigation"],
    specs: { Type: "Capacitive", Output: "Analog", Voltage: "3.3-5V", Probe: "Corrosion resistant" },
  },
  {
    name: "Digital Multimeter",
    description: "True-RMS digital multimeter for electrical measurements, fault finding and lab coursework.",
    category: "Test & Measurement",
    location: "EEE Measurements Lab - Bench 8",
    department: "EEE",
    quantity: 10,
    tags: ["multimeter", "measurement", "voltage", "current", "electronics", "testing"],
    specs: { Display: "6000 Count", Voltage: "1000 V DC", Current: "10 A", Features: "True RMS" },
  },
  {
    name: "ESP32 Development Board",
    description: "Dual-core Wi-Fi and Bluetooth development board for connected prototypes and home automation.",
    category: "Microcontrollers",
    location: "ECE Lab A - Rack 4",
    department: "ECE",
    quantity: 10,
    tags: ["esp32", "wifi", "bluetooth", "iot", "microcontroller", "embedded", "smarthome"],
    specs: { Core: "Dual-core Xtensa LX6", Connectivity: "Wi-Fi + BLE", GPIO: "34", Power: "3.3V" },
  },
  {
    name: "STM32 Discovery Board",
    description: "ARM Cortex-M development board for firmware engineering, RTOS labs and peripheral experiments.",
    category: "Microcontrollers",
    location: "ECE Embedded Lab - Cabinet A",
    department: "ECE",
    quantity: 8,
    tags: ["stm32", "arm", "microcontroller", "firmware", "rtos", "embedded"],
    specs: { Core: "ARM Cortex-M4", Flash: "1 MB", Debugger: "On-board ST-LINK", Interfaces: "SPI, I2C, UART, CAN" },
  },
  {
    name: "AI Training Workstation",
    description: "Secondary GPU node for model training and inference workloads when the primary workstation is booked.",
    category: "High Performance Computing",
    location: "AI Lab - Station 2",
    department: "CSE",
    quantity: 1,
    tags: ["gpu", "training", "ai", "machine learning", "cuda", "computing"],
    specs: { GPU: "NVIDIA RTX A6000", CPU: "AMD Ryzen 9", RAM: "128 GB", Storage: "4 TB NVMe" },
  },
  {
    name: "Logic Analyzer",
    description: "16-channel logic analyzer for digital protocol debugging of SPI, I2C, UART and custom buses.",
    category: "Test & Measurement",
    location: "ECE Test Bench 2",
    department: "ECE",
    quantity: 3,
    tags: ["logic analyzer", "digital", "protocol", "debugging", "spi", "i2c", "embedded"],
    specs: { Channels: "16", "Sample Rate": "100 MSa/s", Protocols: "SPI, I2C, UART", Interface: "USB" },
  },
];

const DEMO_USERS: DemoUser[] = [
  { name: "Platform Admin", email: "admin@campuslab.ai", role: Role.ADMIN, password: "Admin@123" },
  { name: "Dr. Kavya Rao", email: "faculty.ece@campuslab.ai", role: Role.FACULTY, department: "ECE", password: "Faculty@123" },
  { name: "Dr. Arjun Mehta", email: "faculty.cse@campuslab.ai", role: Role.FACULTY, department: "CSE", password: "Faculty@123" },
  { name: "Asha Verma", email: "student.asha@campuslab.ai", role: Role.STUDENT, department: "BIO", password: "Student@123" },
  { name: "Ravi Kumar", email: "student.ravi@campuslab.ai", role: Role.STUDENT, department: "ECE", password: "Student@123" },
  { name: "Meera Iyer", email: "student.meera@campuslab.ai", role: Role.STUDENT, department: "CSE", password: "Student@123" },
  { name: "Sam Fernandes", email: "student.sam@campuslab.ai", role: Role.STUDENT, department: "MECH", password: "Student@123" },
  { name: "Neha Gupta", email: "student.neha@campuslab.ai", role: Role.STUDENT, department: "EEE", password: "Student@123" },
  { name: "Karan Singh", email: "student.karan@campuslab.ai", role: Role.STUDENT, department: "CSE", password: "Student@123" },
  { name: "Priya Nair", email: "student.priya@campuslab.ai", role: Role.STUDENT, department: "MECH", password: "Student@123" },
  { name: "Vivek Patel", email: "student.vivek@campuslab.ai", role: Role.STUDENT, department: "ECE", password: "Student@123" },
];

const PROJECT_NAMES = [
  "Smart Campus Prototype",
  "Autonomous Rover Control",
  "Low-Power Sensor Node",
  "Rapid Prototype Sprint",
  "AI Vision Benchmark",
  "Signal Integrity Study",
  "Embedded Firmware Lab",
  "IoT Telemetry Build",
  "Precision Agriculture Node",
  "Digital Design Validation",
];

function dayAt(base: Date, offsetDays: number, hour: number): Date {
  const date = new Date(base.getTime());
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

export interface SeedResult {
  seeded: boolean;
  counts?: { departments: number; users: number; equipment: number; bookings: number };
}

export async function seedDatabase(
  prisma: PrismaClient,
  options: { force?: boolean } = {}
): Promise<SeedResult> {
  const existing = await prisma.department.count();
  if (existing > 0 && !options.force) {
    return { seeded: false };
  }

  if (existing > 0 && options.force) {
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.department.deleteMany();
  }

  const now = new Date();

  const departments = new Map<string, { id: string }>();
  for (const department of DEMO_DEPARTMENTS) {
    const created = await prisma.department.create({ data: department });
    departments.set(department.code, created);
  }

  const passwordHashes = new Map<string, string>();
  for (const password of new Set(DEMO_USERS.map((user) => user.password))) {
    passwordHashes.set(password, await bcrypt.hash(password, 10));
  }

  const users = new Map<string, { id: string; role: Role }>();
  for (const user of DEMO_USERS) {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: passwordHashes.get(user.password)!,
        departmentId: user.department ? departments.get(user.department)!.id : null,
      },
    });
    users.set(user.email, created);
  }

  const equipmentRecords: Array<{ id: string; data: DemoEquipment }> = [];
  for (const [index, item] of DEMO_EQUIPMENT.entries()) {
    const created = await prisma.equipment.create({
      data: {
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        description: item.description,
        category: item.category,
        location: item.location,
        departmentId: departments.get(item.department)!.id,
        quantity: item.quantity,
        status: item.status ?? EquipmentStatus.AVAILABLE,
        tags: item.tags.join(","),
        specs: JSON.stringify(item.specs),
        createdAt: new Date(now.getTime() - (index + 2) * 86_400_000),
      },
    });
    equipmentRecords.push({ id: created.id, data: item });
  }

  const students = DEMO_USERS.filter((user) => user.role === Role.STUDENT).map(
    (user) => users.get(user.email)!.id
  );

  const bookingRows: Array<Record<string, unknown>> = [];
  const offsets = [-3, -2, -1, 1, 2, 3];

  for (const [equipmentIndex, equipment] of equipmentRecords.entries()) {
    const units = Math.min(equipment.data.quantity, 6);
    const durationHours = 3 + (equipmentIndex % 3);

    for (const offset of offsets) {
      for (let unit = 0; unit < units; unit += 1) {
        const startsAt = dayAt(now, offset, 9);
        const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);
        const projectName = PROJECT_NAMES[(equipmentIndex + unit + offset + 12) % PROJECT_NAMES.length];
        const status = endsAt.getTime() < now.getTime() ? BookingStatus.COMPLETED : BookingStatus.APPROVED;
        const studentId = students[(equipmentIndex * 3 + unit + offset + 20) % students.length];
        bookingRows.push({
          projectName,
          projectDescription: `${projectName}: supervised use of ${equipment.data.name} for coursework and prototype validation in the ${equipment.data.department} department.`,
          additionalRequirements: unit % 2 === 0 ? "Please keep a lab technician available for the first 30 minutes." : null,
          startsAt,
          endsAt,
          projectDeadline: new Date(endsAt.getTime() + ((equipmentIndex % 4) + 2) * 86_400_000),
          status,
          userId: studentId,
          equipmentId: equipment.id,
          departmentId: departments.get(equipment.data.department)!.id,
          reviewedById: users.get("faculty.ece@campuslab.ai")!.id,
          reviewedAt: new Date(startsAt.getTime() - 2 * 86_400_000),
          createdAt: new Date(startsAt.getTime() - 4 * 86_400_000),
        });
      }
    }

    // Older history so month-over-month charts stay populated.
    for (let monthOffset = 1; monthOffset <= 5; monthOffset += 1) {
      const startsAt = new Date(now.getTime());
      startsAt.setUTCMonth(startsAt.getUTCMonth() - monthOffset);
      startsAt.setUTCDate(8 + (equipmentIndex % 10));
      startsAt.setUTCHours(10, 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + 3 * 3_600_000);
      bookingRows.push({
        projectName: PROJECT_NAMES[(equipmentIndex + monthOffset) % PROJECT_NAMES.length],
        projectDescription: `Archived lab session using ${equipment.data.name} for semester coursework.`,
        startsAt,
        endsAt,
        projectDeadline: new Date(endsAt.getTime() + 5 * 86_400_000),
        status: BookingStatus.COMPLETED,
        userId: students[(equipmentIndex + monthOffset) % students.length],
        equipmentId: equipment.id,
        departmentId: departments.get(equipment.data.department)!.id,
        reviewedById: users.get("faculty.cse@campuslab.ai")!.id,
        reviewedAt: new Date(startsAt.getTime() - 86_400_000),
        createdAt: new Date(startsAt.getTime() - 3 * 86_400_000),
      });
    }
  }

  // Approved bookings that are happening right now, so the dashboard has live activity.
  for (const equipmentIndex of [0, 5, 7]) {
    const equipment = equipmentRecords[equipmentIndex];
    const startsAt = new Date(now.getTime() - 60 * 60_000);
    const endsAt = new Date(now.getTime() + 2 * 60 * 60_000);
    bookingRows.push({
      projectName: `${equipment.data.category} Showcase`,
      projectDescription: `Live demonstration currently using ${equipment.data.name}.`,
      startsAt,
      endsAt,
      projectDeadline: new Date(endsAt.getTime() + 2 * 86_400_000),
      status: BookingStatus.APPROVED,
      userId: students[equipmentIndex % students.length],
      equipmentId: equipment.id,
      departmentId: equipment.data.department ? departments.get(equipment.data.department)!.id : departments.get("ECE")!.id,
      reviewedById: users.get("faculty.ece@campuslab.ai")!.id,
      reviewedAt: new Date(now.getTime() - 86_400_000),
    });
  }

  await prisma.booking.createMany({ data: bookingRows as never });

  const equipmentBySlug = (slug: string) => equipmentRecords.find((item) => item.data.name === slug)!;
  const studentByEmail = (email: string) => users.get(email)!.id;

  const pendingRequests = [
    {
      projectName: "Smart Agriculture Monitoring",
      projectDescription:
        "IoT-based smart agriculture monitoring system that reads soil moisture, schedules irrigation and publishes telemetry to a dashboard.",
      additionalRequirements: "Need jumper wires and a 5V power supply.",
      startsAt: dayAt(now, 1, 14),
      endsAt: dayAt(now, 1, 17),
      projectDeadline: dayAt(now, 1, 18),
      equipmentId: equipmentBySlug("Arduino Uno").id,
      departmentId: departments.get("BIO")!.id,
      userId: studentByEmail("student.asha@campuslab.ai"),
    },
    {
      projectName: "Home Automation Hub",
      projectDescription:
        "A home automation controller that connects lights and fans over MQTT and monitors energy usage in real time.",
      startsAt: dayAt(now, 2, 14),
      endsAt: dayAt(now, 2, 17),
      projectDeadline: dayAt(now, 6, 18),
      equipmentId: equipmentBySlug("IoT Development Kit").id,
      departmentId: departments.get("ECE")!.id,
      userId: studentByEmail("student.ravi@campuslab.ai"),
    },
    {
      projectName: "Edge Vision Defect Detection",
      projectDescription:
        "Train a compact computer-vision model to detect manufacturing defects and deploy it on an edge accelerator for low-latency inspection.",
      startsAt: dayAt(now, 2, 14),
      endsAt: dayAt(now, 2, 18),
      projectDeadline: dayAt(now, 2, 20),
      equipmentId: equipmentBySlug("GPU Workstation").id,
      departmentId: departments.get("CSE")!.id,
      userId: studentByEmail("student.meera@campuslab.ai"),
    },
    {
      projectName: "Render Farm Batch",
      projectDescription:
        "Batch render of a mechanical assembly animation and CUDA-accelerated simulation for the design review deadline.",
      startsAt: dayAt(now, 2, 14),
      endsAt: dayAt(now, 2, 18),
      projectDeadline: dayAt(now, 6, 18),
      equipmentId: equipmentBySlug("GPU Workstation").id,
      departmentId: departments.get("MECH")!.id,
      userId: studentByEmail("student.sam@campuslab.ai"),
    },
  ];

  for (const request of pendingRequests) {
    await prisma.booking.create({ data: { ...request, status: BookingStatus.PENDING } });
  }

  const rejected = await prisma.booking.create({
    data: {
      projectName: "Unregistered FPGA Study",
      projectDescription: "Request for FPGA board without a completed safety briefing.",
      startsAt: dayAt(now, 4, 10),
      endsAt: dayAt(now, 4, 13),
      projectDeadline: dayAt(now, 8, 17),
      status: BookingStatus.REJECTED,
      rejectionReason: "Safety briefing for the VLSI lab has not been completed.",
      userId: studentByEmail("student.karan@campuslab.ai"),
      equipmentId: equipmentBySlug("FPGA Development Board").id,
      departmentId: departments.get("ECE")!.id,
      reviewedById: users.get("faculty.cse@campuslab.ai")!.id,
      reviewedAt: now,
    },
  });

  await prisma.booking.create({
    data: {
      projectName: "Linux Gateway Trial",
      projectDescription: "Short trial of a Linux gateway; cancelled after switching to the IoT kit.",
      startsAt: dayAt(now, 3, 15),
      endsAt: dayAt(now, 3, 18),
      projectDeadline: dayAt(now, 7, 17),
      status: BookingStatus.CANCELLED,
      userId: studentByEmail("student.meera@campuslab.ai"),
      equipmentId: equipmentBySlug("Raspberry Pi 5").id,
      departmentId: departments.get("CSE")!.id,
    },
  });

  void rejected;

  return {
    seeded: true,
    counts: {
      departments: departments.size,
      users: users.size,
      equipment: equipmentRecords.length,
      bookings: bookingRows.length + pendingRequests.length + 2,
    },
  };
}
