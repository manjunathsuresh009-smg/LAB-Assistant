import { uniqueTokens } from "../utils/text";

export interface RecommendableEquipment {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string | string[];
}

export interface EquipmentRecommendation {
  equipmentId: string;
  name: string;
  category: string;
  reason: string;
  confidence: number;
  score: number;
  matchedKeywords: string[];
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  agriculture: ["agriculture", "agricultural", "soil", "moisture", "farming", "farm", "crop", "irrigation", "agritech", "greenhouse"],
  iot: ["iot", "sensor", "sensors", "wireless", "mqtt", "smart", "home", "automation", "monitoring", "telemetry"],
  ai: ["ai", "machine", "learning", "deep", "neural", "vision", "inference", "dataset", "model", "recognition", "classification"],
  robotics: ["robot", "robotics", "rover", "autonomous", "motor", "motors", "drone", "actuator", "navigation"],
  embedded: ["embedded", "microcontroller", "firmware", "rtos", "arm", "arduino", "stm32", "esp32", "gpio"],
  vlsi: ["fpga", "verilog", "vhdl", "vlsi", "digital", "logic", "circuit", "synthesis"],
  fabrication: ["printing", "printer", "prototype", "prototyping", "cad", "fabrication", "enclosure", "mechanical"],
  measurement: ["oscilloscope", "waveform", "signal", "measurement", "multimeter", "debugging", "testing", "voltage"],
  computing: ["gpu", "cuda", "training", "rendering", "workstation", "compute", "simulation"],
  environment: ["environment", "weather", "humidity", "temperature", "climate", "air", "quality", "water"],
};

function corpusOf(equipment: RecommendableEquipment): string {
  const tags = Array.isArray(equipment.tags) ? equipment.tags.join(" ") : equipment.tags;
  return `${equipment.name} ${equipment.category} ${equipment.description} ${tags}`.toLowerCase();
}

/**
 * Deterministic, explainable recommendation engine. It expands domain synonyms
 * from the project brief and scores each equipment by keyword overlap and
 * category relevance. This is not an LLM and results are labelled as rule-based.
 */
export function rankEquipment(
  projectDescription: string,
  equipmentList: RecommendableEquipment[],
  limit = 5
): EquipmentRecommendation[] {
  const description = projectDescription.toLowerCase();
  const baseTokens = uniqueTokens(projectDescription);
  const expanded = new Set(baseTokens);

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const triggered = description.includes(domain) || keywords.some((keyword) => description.includes(keyword));
    if (triggered) keywords.forEach((keyword) => expanded.add(keyword));
  }

  const ranked = equipmentList.map((equipment) => {
    const corpus = corpusOf(equipment);
    const corpusTokens = new Set(uniqueTokens(corpus));
    const matched = Array.from(expanded).filter((token) => corpusTokens.has(token));
    const nameMentioned = description.includes(equipment.name.toLowerCase());
    const categoryMentioned = description.includes(equipment.category.toLowerCase());

    let score = matched.length * 10;
    if (nameMentioned) score += 35;
    if (categoryMentioned) score += 12;

    const reasonParts: string[] = [];
    if (nameMentioned) reasonParts.push(`Your brief explicitly mentions ${equipment.name}`);
    if (matched.length) reasonParts.push(`matches on ${matched.slice(0, 4).join(", ")}`);
    const reason = reasonParts.length
      ? `${reasonParts.join(" and ")}.`
      : "General-purpose lab resource that can support prototyping work.";

    return {
      equipmentId: equipment.id,
      name: equipment.name,
      category: equipment.category,
      reason: reason.charAt(0).toUpperCase() + reason.slice(1),
      confidence: Math.min(98, 42 + score * 2),
      score,
      matchedKeywords: matched.slice(0, 6),
    };
  });

  return ranked
    .sort((a, b) => (b.score === a.score ? a.name.localeCompare(b.name) : b.score - a.score))
    .slice(0, limit);
}
