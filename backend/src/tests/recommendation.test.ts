import { describe, expect, it } from "vitest";
import { rankEquipment, RecommendableEquipment } from "../services/recommendation";

const catalog: RecommendableEquipment[] = [
  {
    id: "arduino",
    name: "Arduino Uno",
    category: "Microcontrollers",
    description: "Embedded prototyping board",
    tags: "arduino, microcontroller, embedded, iot, sensors, prototyping",
  },
  {
    id: "soil",
    name: "Soil Moisture Sensor",
    category: "Sensors",
    description: "Capacitive probe for precision agriculture",
    tags: "soil, moisture, agriculture, sensor, farming, iot, irrigation",
  },
  {
    id: "iot",
    name: "IoT Development Kit",
    category: "IoT",
    description: "ESP32 kit with environmental sensors",
    tags: "iot, sensors, wifi, cloud, esp32, telemetry",
  },
  {
    id: "gpu",
    name: "GPU Workstation",
    category: "High Performance Computing",
    description: "Deep learning training workstation",
    tags: "gpu, deep learning, training, cuda, ai",
  },
  {
    id: "printer",
    name: "3D Printer",
    category: "Fabrication",
    description: "Rapid prototyping printer",
    tags: "3d printing, prototype, cad, fabrication",
  },
];

describe("rule-based recommendation engine", () => {
  it("recommends agriculture equipment for an agri-tech brief", () => {
    const results = rankEquipment(
      "I want to build an IoT-based smart agriculture monitoring system with soil sensors.",
      catalog,
      4
    );
    expect(results[0].equipmentId).toBe("soil");
    const ids = results.map((item) => item.equipmentId);
    expect(ids).toContain("arduino");
    expect(ids).toContain("iot");
  });

  it("recommends GPU resources for a deep learning brief", () => {
    const results = rankEquipment(
      "Train a deep learning computer vision model using CUDA and a GPU.",
      catalog,
      3
    );
    expect(results[0].equipmentId).toBe("gpu");
  });

  it("is deterministic and explainable", () => {
    const first = rankEquipment("Build an IoT soil monitoring system", catalog, 3);
    const second = rankEquipment("Build an IoT soil monitoring system", catalog, 3);
    expect(first).toEqual(second);
    expect(first[0].reason.length).toBeGreaterThan(0);
    expect(first[0].confidence).toBeGreaterThan(0);
  });
});
