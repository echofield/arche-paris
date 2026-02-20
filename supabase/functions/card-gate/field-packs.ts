/**
 * ARCHÉ — Server-side field pack registry (Echo Extraction).
 * PAR-13 only. No PostGIS, coords, history, or logs.
 * Canonical store: backend only. world.field in snapshot is the source of truth.
 *
 * Guardrail: packs are validated (max 140 chars per string, no newlines) so the
 * layer stays signal-sized and does not drift into essays when scaling to 20 zones.
 */

export type FieldPack = {
  zoneId: string;
  version?: string;
  source?: "bundle" | "remote";
  coreTension: string;
  temperature: string;
  whispers: string[];
  nodes: Array<{
    id: string;
    designation: string;
    echo: string;
    fieldSentence: string;
    activation?: string;
  }>;
};

const PACKS: Record<string, FieldPack> = {
  "PAR-13": {
    zoneId: "PAR-13",
    version: "v0.1",
    source: "bundle",
    coreTension: "Hyper-structured control vs. organic flows.",
    temperature: "Fractured; dense compression and transitional emptiness.",
    nodes: [
      {
        id: "PAR-13-001",
        designation: "Authority / Rupture",
        echo: "The false ground sustains an isolated ecosystem. The concrete enforces separation, but the population subverts the grid.",
        fieldSentence: "I elevate the body to hide the machine.",
        activation: "Climb the concrete stairs. Stand on the eight-meter esplanade. Feel the absence of the natural earth beneath the feet.",
      },
      {
        id: "PAR-13-002",
        designation: "Witness / Void",
        echo: "The wind crosses the wooden deck. The knowledge is buried beneath the feet of the wanderer.",
        fieldSentence: "I isolate the mind by exposing the body.",
        activation: "Walk the perimeter of the central sunken forest. Observe the untouchable trees through the glass.",
      },
      {
        id: "PAR-13-003",
        designation: "Transition / Display",
        echo: "The physical trains are gone. The concrete vault now funnels the invisible velocity of data.",
        fieldSentence: "I preserve the industrial shell to legitimize the invisible.",
        activation: "Look down the 310-meter central nave. Follow the vanishing point to the end of the hall.",
      },
      {
        id: "PAR-13-004",
        designation: "Authority / Refuge",
        echo: "The walls that once confined the marginalized now house the machinery that maps human consciousness.",
        fieldSentence: "I draw a boundary around the body to observe the mind.",
        activation: "Stand at the main gates on Boulevard de l'Hôpital. Look at the boundary between the clinical city and the public street.",
      },
      {
        id: "PAR-13-005",
        designation: "Refuge / Resistance",
        echo: "The hill bends the street. The grid shatters against the topography.",
        fieldSentence: "I curve the path to break the machine.",
        activation: "Walk without a destination. Let the incline dictate the turn. Observe how the sightline ends at a curved wall.",
      },
      {
        id: "PAR-13-006",
        designation: "Memory / Authority",
        echo: "The hands move exactly as they did three centuries ago. The stone protects the slowness.",
        fieldSentence: "I stop time to preserve the motion of the hand.",
        activation: "Stand outside the stone facade. Listen for the absence of modern machinery. Observe the masonry that blocks the velocity.",
      },
      {
        id: "PAR-13-007",
        designation: "Axis / Transition",
        echo: "The asphalt circle processes the city. The body is compelled to keep moving.",
        fieldSentence: "I gather the lines to expel the wanderer.",
        activation: "Stand on the edge of the roundabout. Track a vehicle until it disappears. Feel the hum of the trains below.",
      },
    ],
    whispers: [
      "The concrete holds the cold of the absent trains.",
      "The false ground hides the tires of the delivery trucks.",
      "The grid fractures at the base of the cobblestone hill.",
      "The wooden esplanade demands an audience with the wind.",
      "The hospital walls map the street while the doctors map the brain.",
      "The books are buried so the glass can reflect the sky.",
      "The traffic circle spins the body away from the center.",
    ],
  },
};

const MAX_FIELD_STRING_LENGTH = 140;

function checkSignalString(s: string, label: string): string | null {
  if (s.length > MAX_FIELD_STRING_LENGTH) return `${label}: length ${s.length} > ${MAX_FIELD_STRING_LENGTH}`;
  if (s.includes("\n")) return `${label}: contains newline`;
  if (s.includes("\n\n")) return `${label}: contains double paragraph`;
  return null;
}

/** Validates pack stays signal-sized (no journalism creep). Returns null if valid, else reason. */
function validateFieldPack(pack: FieldPack): string | null {
  let err = checkSignalString(pack.coreTension, "coreTension");
  if (err) return err;
  err = checkSignalString(pack.temperature, "temperature");
  if (err) return err;
  for (let i = 0; i < pack.nodes.length; i++) {
    const n = pack.nodes[i];
    const prefix = `nodes[${i}].${n.id}`;
    for (const [key, val] of Object.entries(n)) {
      if (typeof val === "string") {
        err = checkSignalString(val, `${prefix}.${key}`);
        if (err) return err;
      }
    }
  }
  for (let i = 0; i < pack.whispers.length; i++) {
    err = checkSignalString(pack.whispers[i], `whispers[${i}]`);
    if (err) return err;
  }
  return null;
}

function normalizeZoneId(input: string): string {
  const trimmed = input.trim();
  const par = trimmed.match(/^PAR-(\d{1,2})$/i);
  const paris = trimmed.match(/^paris-(\d{1,2})$/i);
  if (par) {
    const n = parseInt(par[1], 10);
    if (n >= 1 && n <= 20) return `PAR-${String(n).padStart(2, "0")}`;
  }
  if (paris) {
    const n = parseInt(paris[1], 10);
    if (n >= 1 && n <= 20) return `PAR-${String(n).padStart(2, "0")}`;
  }
  const numPart = trimmed.replace(/^par-?/i, "").replace(/^0+/, "") || "0";
  const n = parseInt(numPart, 10);
  if (n >= 1 && n <= 20) return `PAR-${String(n).padStart(2, "0")}`;
  return trimmed;
}

export function getFieldPack(zoneId: string): FieldPack | null {
  const key = normalizeZoneId(zoneId);
  if (!/^PAR-\d{2}$/.test(key)) return null;
  const pack = PACKS[key] ?? null;
  if (!pack) return null;
  const invalid = validateFieldPack(pack);
  if (invalid) {
    if (typeof Deno !== "undefined" && Deno.env.get("DENO_ENV") === "development") {
      throw new Error(`[field-packs] invalid pack ${key}: ${invalid}`);
    }
    return null;
  }
  return pack;
}
