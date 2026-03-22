/**
 * CVSS 3.1 and 4.0 scoring logic.
 * All operations run client-side — no API routes, no external calls.
 *
 * CVSS 3.1: Direct formula implementation per FIRST specification.
 * CVSS 4.0: MacroVector lookup + interpolation per FIRST specification.
 */

// ── Types ──────────────────────────────────────────────────────────

export type CvssVersion = "3.1" | "4.0";

export type Severity = "None" | "Low" | "Medium" | "High" | "Critical";

export interface CvssResult {
  version: CvssVersion;
  vector: string;
  baseScore: number;
  severity: Severity;
  /** CVSS 3.1 only */
  impactScore?: number;
  exploitabilityScore?: number;
  temporalScore?: number;
  environmentalScore?: number;
}

// ── CVSS 3.1 ───────────────────────────────────────────────────────

export interface Cvss31Metrics {
  // Base - Exploitability
  AV: "N" | "A" | "L" | "P";
  AC: "L" | "H";
  PR: "N" | "L" | "H";
  UI: "N" | "R";
  S: "U" | "C";
  // Base - Impact
  C: "N" | "L" | "H";
  I: "N" | "L" | "H";
  A: "N" | "L" | "H";
  // Temporal
  E?: "X" | "U" | "P" | "F" | "H";
  RL?: "X" | "O" | "T" | "W" | "U";
  RC?: "X" | "U" | "R" | "C";
  // Environmental
  CR?: "X" | "L" | "M" | "H";
  IR?: "X" | "L" | "M" | "H";
  AR?: "X" | "L" | "M" | "H";
  MAV?: "X" | "N" | "A" | "L" | "P";
  MAC?: "X" | "L" | "H";
  MPR?: "X" | "N" | "L" | "H";
  MUI?: "X" | "N" | "R";
  MS?: "X" | "U" | "C";
  MC?: "X" | "N" | "L" | "H";
  MI?: "X" | "N" | "L" | "H";
  MA?: "X" | "N" | "L" | "H";
}

// Metric weights for CVSS 3.1
const AV_WEIGHTS: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.20 };
const AC_WEIGHTS: Record<string, number> = { L: 0.77, H: 0.44 };
const PR_WEIGHTS_UNCHANGED: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
const PR_WEIGHTS_CHANGED: Record<string, number> = { N: 0.85, L: 0.68, H: 0.50 };
const UI_WEIGHTS: Record<string, number> = { N: 0.85, R: 0.62 };
const CIA_WEIGHTS: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

// Temporal metric weights
const E_WEIGHTS: Record<string, number> = { X: 1, U: 0.91, P: 0.94, F: 0.97, H: 1 };
const RL_WEIGHTS: Record<string, number> = { X: 1, O: 0.95, T: 0.96, W: 0.97, U: 1 };
const RC_WEIGHTS: Record<string, number> = { X: 1, U: 0.92, R: 0.96, C: 1 };

// Environmental requirement weights
const REQ_WEIGHTS: Record<string, number> = { X: 1, L: 0.5, M: 1, H: 1.5 };

/** Roundup per CVSS 3.1 spec: smallest number with 1 decimal place >= input */
function roundUp(n: number): number {
  const int_input = Math.round(n * 100000);
  if (int_input % 10000 === 0) {
    return int_input / 100000;
  }
  return (Math.floor(int_input / 10000) + 1) / 10;
}

export function calculateCvss31(metrics: Cvss31Metrics): CvssResult {
  const prWeights = metrics.S === "C" ? PR_WEIGHTS_CHANGED : PR_WEIGHTS_UNCHANGED;

  // ISS (Impact Sub Score)
  const iss = 1 - ((1 - CIA_WEIGHTS[metrics.C]) * (1 - CIA_WEIGHTS[metrics.I]) * (1 - CIA_WEIGHTS[metrics.A]));

  // Impact
  let impact: number;
  if (metrics.S === "U") {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  // Exploitability
  const exploitability = 8.22 * AV_WEIGHTS[metrics.AV] * AC_WEIGHTS[metrics.AC] * prWeights[metrics.PR] * UI_WEIGHTS[metrics.UI];

  // Base Score
  let baseScore: number;
  if (impact <= 0) {
    baseScore = 0;
  } else if (metrics.S === "U") {
    baseScore = roundUp(Math.min(impact + exploitability, 10));
  } else {
    baseScore = roundUp(Math.min(1.08 * (impact + exploitability), 10));
  }

  // Temporal Score
  const e = metrics.E || "X";
  const rl = metrics.RL || "X";
  const rc = metrics.RC || "X";
  const temporalScore = roundUp(baseScore * E_WEIGHTS[e] * RL_WEIGHTS[rl] * RC_WEIGHTS[rc]);

  // Environmental Score
  let environmentalScore: number | undefined;
  const hasEnv = metrics.CR || metrics.IR || metrics.AR || metrics.MAV || metrics.MAC || metrics.MPR || metrics.MUI || metrics.MS || metrics.MC || metrics.MI || metrics.MA;

  if (hasEnv) {
    // Modified metrics (fall back to base)
    const mAV = (metrics.MAV && metrics.MAV !== "X") ? metrics.MAV : metrics.AV;
    const mAC = (metrics.MAC && metrics.MAC !== "X") ? metrics.MAC : metrics.AC;
    const mPR = (metrics.MPR && metrics.MPR !== "X") ? metrics.MPR : metrics.PR;
    const mUI = (metrics.MUI && metrics.MUI !== "X") ? metrics.MUI : metrics.UI;
    const mS = (metrics.MS && metrics.MS !== "X") ? metrics.MS : metrics.S;
    const mC = (metrics.MC && metrics.MC !== "X") ? metrics.MC : metrics.C;
    const mI = (metrics.MI && metrics.MI !== "X") ? metrics.MI : metrics.I;
    const mA = (metrics.MA && metrics.MA !== "X") ? metrics.MA : metrics.A;

    const cr = REQ_WEIGHTS[metrics.CR || "X"];
    const ir = REQ_WEIGHTS[metrics.IR || "X"];
    const ar = REQ_WEIGHTS[metrics.AR || "X"];

    const mPRWeights = mS === "C" ? PR_WEIGHTS_CHANGED : PR_WEIGHTS_UNCHANGED;

    const miss = Math.min(1 - ((1 - CIA_WEIGHTS[mC] * cr) * (1 - CIA_WEIGHTS[mI] * ir) * (1 - CIA_WEIGHTS[mA] * ar)), 0.915);

    let mImpact: number;
    if (mS === "U") {
      mImpact = 6.42 * miss;
    } else {
      mImpact = 7.52 * (miss - 0.029) - 3.25 * Math.pow(miss * 0.9731 - 0.02, 13);
    }

    const mExploitability = 8.22 * AV_WEIGHTS[mAV] * AC_WEIGHTS[mAC] * mPRWeights[mPR] * UI_WEIGHTS[mUI];

    if (mImpact <= 0) {
      environmentalScore = 0;
    } else if (mS === "U") {
      environmentalScore = roundUp(roundUp(Math.min(mImpact + mExploitability, 10)) * E_WEIGHTS[e] * RL_WEIGHTS[rl] * RC_WEIGHTS[rc]);
    } else {
      environmentalScore = roundUp(roundUp(Math.min(1.08 * (mImpact + mExploitability), 10)) * E_WEIGHTS[e] * RL_WEIGHTS[rl] * RC_WEIGHTS[rc]);
    }
  }

  const vector = buildCvss31Vector(metrics);
  const finalScore = environmentalScore !== undefined ? environmentalScore : (hasTemporal(metrics) ? temporalScore : baseScore);

  return {
    version: "3.1",
    vector,
    baseScore,
    severity: scoreSeverity(finalScore),
    impactScore: Math.max(0, parseFloat(impact.toFixed(1))),
    exploitabilityScore: parseFloat(exploitability.toFixed(1)),
    temporalScore: hasTemporal(metrics) ? temporalScore : undefined,
    environmentalScore,
  };
}

function hasTemporal(m: Cvss31Metrics): boolean {
  return !!((m.E && m.E !== "X") || (m.RL && m.RL !== "X") || (m.RC && m.RC !== "X"));
}

function buildCvss31Vector(m: Cvss31Metrics): string {
  let v = `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${m.S}/C:${m.C}/I:${m.I}/A:${m.A}`;
  if (m.E && m.E !== "X") v += `/E:${m.E}`;
  if (m.RL && m.RL !== "X") v += `/RL:${m.RL}`;
  if (m.RC && m.RC !== "X") v += `/RC:${m.RC}`;
  if (m.CR && m.CR !== "X") v += `/CR:${m.CR}`;
  if (m.IR && m.IR !== "X") v += `/IR:${m.IR}`;
  if (m.AR && m.AR !== "X") v += `/AR:${m.AR}`;
  if (m.MAV && m.MAV !== "X") v += `/MAV:${m.MAV}`;
  if (m.MAC && m.MAC !== "X") v += `/MAC:${m.MAC}`;
  if (m.MPR && m.MPR !== "X") v += `/MPR:${m.MPR}`;
  if (m.MUI && m.MUI !== "X") v += `/MUI:${m.MUI}`;
  if (m.MS && m.MS !== "X") v += `/MS:${m.MS}`;
  if (m.MC && m.MC !== "X") v += `/MC:${m.MC}`;
  if (m.MI && m.MI !== "X") v += `/MI:${m.MI}`;
  if (m.MA && m.MA !== "X") v += `/MA:${m.MA}`;
  return v;
}

export function parseCvss31Vector(vector: string): Cvss31Metrics | null {
  if (!vector.startsWith("CVSS:3.1/") && !vector.startsWith("CVSS:3.0/")) return null;
  const parts = vector.split("/").slice(1);
  const map: Record<string, string> = {};
  for (const part of parts) {
    const [key, val] = part.split(":");
    if (key && val) map[key] = val;
  }
  if (!map.AV || !map.AC || !map.PR || !map.UI || !map.S || !map.C || !map.I || !map.A) return null;
  return {
    AV: map.AV as Cvss31Metrics["AV"],
    AC: map.AC as Cvss31Metrics["AC"],
    PR: map.PR as Cvss31Metrics["PR"],
    UI: map.UI as Cvss31Metrics["UI"],
    S: map.S as Cvss31Metrics["S"],
    C: map.C as Cvss31Metrics["C"],
    I: map.I as Cvss31Metrics["I"],
    A: map.A as Cvss31Metrics["A"],
    E: (map.E as Cvss31Metrics["E"]) || undefined,
    RL: (map.RL as Cvss31Metrics["RL"]) || undefined,
    RC: (map.RC as Cvss31Metrics["RC"]) || undefined,
    CR: (map.CR as Cvss31Metrics["CR"]) || undefined,
    IR: (map.IR as Cvss31Metrics["IR"]) || undefined,
    AR: (map.AR as Cvss31Metrics["AR"]) || undefined,
    MAV: (map.MAV as Cvss31Metrics["MAV"]) || undefined,
    MAC: (map.MAC as Cvss31Metrics["MAC"]) || undefined,
    MPR: (map.MPR as Cvss31Metrics["MPR"]) || undefined,
    MUI: (map.MUI as Cvss31Metrics["MUI"]) || undefined,
    MS: (map.MS as Cvss31Metrics["MS"]) || undefined,
    MC: (map.MC as Cvss31Metrics["MC"]) || undefined,
    MI: (map.MI as Cvss31Metrics["MI"]) || undefined,
    MA: (map.MA as Cvss31Metrics["MA"]) || undefined,
  };
}

// ── CVSS 4.0 ───────────────────────────────────────────────────────

export interface Cvss40Metrics {
  // Base - Exploitability
  AV: "N" | "A" | "L" | "P";
  AC: "L" | "H";
  AT: "N" | "P";
  PR: "N" | "L" | "H";
  UI: "N" | "P" | "A";
  // Base - Vulnerable System Impact
  VC: "H" | "L" | "N";
  VI: "H" | "L" | "N";
  VA: "H" | "L" | "N";
  // Base - Subsequent System Impact
  SC: "H" | "L" | "N";
  SI: "H" | "L" | "N";
  SA: "H" | "L" | "N";
  // Threat
  E?: "X" | "A" | "P" | "U";
  // Environmental - Security Requirements
  CR?: "X" | "H" | "M" | "L";
  IR?: "X" | "H" | "M" | "L";
  AR?: "X" | "H" | "M" | "L";
  // Environmental - Modified Base
  MAV?: "X" | "N" | "A" | "L" | "P";
  MAC?: "X" | "L" | "H";
  MAT?: "X" | "N" | "P";
  MPR?: "X" | "N" | "L" | "H";
  MUI?: "X" | "N" | "P" | "A";
  MVC?: "X" | "H" | "L" | "N";
  MVI?: "X" | "H" | "L" | "N";
  MVA?: "X" | "H" | "L" | "N";
  MSC?: "X" | "H" | "L" | "N";
  MSI?: "X" | "S" | "H" | "L" | "N";
  MSA?: "X" | "S" | "H" | "L" | "N";
}

// CVSS 4.0 MacroVector lookup table (per FIRST specification)
const CVSS40_LOOKUP: Record<string, number> = {
  "000000": 10, "000001": 9.9, "000010": 9.8, "000011": 9.5,
  "000020": 9.5, "000021": 9.2, "000100": 10, "000101": 9.6,
  "000110": 9.3, "000111": 8.7, "000120": 9.1, "000121": 8.1,
  "000200": 9.3, "000201": 9, "000210": 8.9, "000211": 8,
  "000220": 8.1, "000221": 6.8, "001000": 9.8, "001001": 9.5,
  "001010": 9.5, "001011": 9.2, "001020": 9, "001021": 8.4,
  "001100": 9.3, "001101": 9.2, "001110": 8.9, "001111": 8.1,
  "001120": 8.1, "001121": 6.5, "001200": 8.8, "001201": 8,
  "001210": 7.8, "001211": 7, "001220": 6.9, "001221": 4.8,
  "002001": 9.2, "002011": 8.2, "002021": 7.2, "002101": 7.9,
  "002111": 6.9, "002121": 5, "002201": 6.9, "002211": 5.5,
  "002221": 2.7, "010000": 9.9, "010001": 9.7, "010010": 9.5,
  "010011": 9.2, "010020": 9.2, "010021": 8.5, "010100": 9.5,
  "010101": 9.1, "010110": 9, "010111": 8.3, "010120": 8.4,
  "010121": 7.1, "010200": 9.2, "010201": 8.1, "010210": 8.2,
  "010211": 7.1, "010220": 7.2, "010221": 5.3, "011000": 9.5,
  "011001": 9.3, "011010": 9.2, "011011": 8.5, "011020": 8.5,
  "011021": 7.3, "011100": 9.2, "011101": 8.2, "011110": 8,
  "011111": 7.2, "011120": 7, "011121": 5.9, "011200": 8.4,
  "011201": 7, "011210": 7.1, "011211": 5.2, "011220": 5,
  "011221": 3, "012001": 8.6, "012011": 7.5, "012021": 5.2,
  "012101": 7.1, "012111": 5.2, "012121": 2.9, "012201": 6.3,
  "012211": 2.9, "012221": 1.7, "100000": 9.8, "100001": 9.5,
  "100010": 9.4, "100011": 8.7, "100020": 9.1, "100021": 8.1,
  "100100": 9.4, "100101": 8.9, "100110": 8.6, "100111": 7.4,
  "100120": 7.7, "100121": 6.4, "100200": 8.7, "100201": 7.5,
  "100210": 7.4, "100211": 6.3, "100220": 5.8, "100221": 5.9,
  "101000": 9.4, "101001": 8.9, "101010": 8.8, "101011": 7.7,
  "101020": 7.6, "101021": 6.7, "101100": 8.6, "101101": 7.6,
  "101110": 7.4, "101111": 5.8, "101120": 5.9, "101121": 5,
  "101200": 7.2, "101201": 5.7, "101210": 5.7, "101211": 5.2,
  "101220": 5.2, "101221": 2.5, "102001": 8.3, "102011": 7,
  "102021": 5.4, "102101": 6.5, "102111": 5.8, "102121": 2.6,
  "102201": 5.3, "102211": 2.1, "102221": 1.3, "110000": 9.5,
  "110001": 9, "110010": 8.8, "110011": 7.6, "110020": 7.6,
  "110021": 7, "110100": 9, "110101": 7.7, "110110": 7.5,
  "110111": 6.2, "110120": 6.1, "110121": 5.3, "110200": 7.7,
  "110201": 6.6, "110210": 6.8, "110211": 5.9, "110220": 5.2,
  "110221": 3, "111000": 8.9, "111001": 7.8, "111010": 7.6,
  "111011": 6.7, "111020": 6.2, "111021": 5.8, "111100": 7.4,
  "111101": 5.9, "111110": 5.7, "111111": 5.7, "111120": 4.7,
  "111121": 2.3, "111200": 6.1, "111201": 5.2, "111210": 5.7,
  "111211": 2.9, "111220": 2.4, "111221": 1.6, "112001": 7.1,
  "112011": 5.9, "112021": 3, "112101": 5.8, "112111": 2.6,
  "112121": 1.5, "112201": 2.3, "112211": 1.3, "112221": 0.6,
  "200000": 9.3, "200001": 8.7, "200010": 8.6, "200011": 7.2,
  "200020": 7.5, "200021": 5.8, "200100": 8.6, "200101": 7.4,
  "200110": 7.4, "200111": 6.1, "200120": 5.6, "200121": 3.4,
  "200200": 7, "200201": 5.4, "200210": 5.2, "200211": 4,
  "200220": 4, "200221": 2.2, "201000": 8.5, "201001": 7.5,
  "201010": 7.4, "201011": 5.5, "201020": 6.2, "201021": 5.1,
  "201100": 7.2, "201101": 5.7, "201110": 5.5, "201111": 4.1,
  "201120": 4.6, "201121": 1.9, "201200": 5.3, "201201": 3.6,
  "201210": 3.4, "201211": 1.9, "201220": 1.9, "201221": 0.8,
  "202001": 6.4, "202011": 5.1, "202021": 2, "202101": 4.7,
  "202111": 2.1, "202121": 1.1, "202201": 2.4, "202211": 0.9,
  "202221": 0.4, "210000": 8.8, "210001": 7.5, "210010": 7.3,
  "210011": 5.3, "210020": 6, "210021": 5, "210100": 7.3,
  "210101": 5.5, "210110": 5.9, "210111": 4, "210120": 4,
  "210121": 2.2, "210200": 5, "210201": 3.3, "210210": 4.1,
  "210211": 2.8, "210220": 2.5, "210221": 1.3, "211000": 7.5,
  "211001": 5.5, "211010": 5.5, "211011": 4.4, "211020": 4.6,
  "211021": 2.1, "211100": 5.3, "211101": 4, "211110": 4,
  "211111": 2.5, "211120": 2, "211121": 1.1, "211200": 4,
  "211201": 2.7, "211210": 1.9, "211211": 0.8, "211220": 0.7,
  "211221": 0.2, "212001": 5.3, "212011": 2.4, "212021": 1.4,
  "212101": 2.4, "212111": 1.2, "212121": 0.5, "212201": 1,
  "212211": 0.3, "212221": 0.1,
};

// Metric severity levels (for distance calculation)
const CVSS40_METRIC_LEVELS: Record<string, Record<string, number>> = {
  AV: { N: 0, A: 1, L: 2, P: 3 },
  AC: { L: 0, H: 1 },
  AT: { N: 0, P: 1 },
  PR: { N: 0, L: 1, H: 2 },
  UI: { N: 0, P: 1, A: 2 },
  VC: { H: 0, L: 1, N: 2 },
  VI: { H: 0, L: 1, N: 2 },
  VA: { H: 0, L: 1, N: 2 },
  SC: { H: 0, L: 1, N: 2 },
  SI: { S: 0, H: 0, L: 1, N: 2 },
  SA: { S: 0, H: 0, L: 1, N: 2 },
  E: { A: 0, P: 1, U: 2 },
  CR: { H: 0, M: 1, L: 2 },
  IR: { H: 0, M: 1, L: 2 },
  AR: { H: 0, M: 1, L: 2 },
};

// Maximum composed vectors per equivalence class level
const MAX_COMPOSED: Record<string, [string, string][][]> = {
  "eq1": [
    [["AV", "N"], ["PR", "N"], ["UI", "N"]],
    [["AV", "A"], ["PR", "N"], ["UI", "N"]],
    [["AV", "L"], ["PR", "N"], ["UI", "N"]],
  ],
  "eq2": [
    [["AC", "L"], ["AT", "N"]],
    [["AC", "H"], ["AT", "N"]],
  ],
  "eq3": [
    [["VC", "H"], ["VI", "H"]],
    [["VC", "H"], ["VI", "L"]],
    [["VC", "L"], ["VI", "L"]],
  ],
  "eq4": [
    [["SC", "H"], ["SI", "H"], ["SA", "H"]],
    [["SC", "H"], ["SI", "H"], ["SA", "L"]],
    [["SC", "L"], ["SI", "L"], ["SA", "L"]],
  ],
  "eq5": [
    [["E", "A"]],
    [["E", "P"]],
    [["E", "U"]],
  ],
  "eq6": [
    [["CR", "H"], ["VC", "H"]],
    [["CR", "H"], ["VC", "L"]],
  ],
};

function getEffective40(m: Cvss40Metrics, metric: string): string {
  // Modified metrics override base metrics if set and not "X"
  const modMap: Record<string, string> = {
    AV: "MAV", AC: "MAC", AT: "MAT", PR: "MPR", UI: "MUI",
    VC: "MVC", VI: "MVI", VA: "MVA", SC: "MSC", SI: "MSI", SA: "MSA",
  };

  const modKey = modMap[metric];
  if (modKey) {
    const modVal = (m as unknown as Record<string, string | undefined>)[modKey];
    if (modVal && modVal !== "X") return modVal;
  }

  const baseVal = (m as unknown as Record<string, string | undefined>)[metric];
  if (baseVal && baseVal !== "X") return baseVal;

  // Defaults for optional metrics
  if (metric === "E") return "A";
  if (metric === "CR" || metric === "IR" || metric === "AR") return "H";
  return "X";
}

function computeEQ(m: Cvss40Metrics): string {
  const av = getEffective40(m, "AV");
  const pr = getEffective40(m, "PR");
  const ui = getEffective40(m, "UI");
  const ac = getEffective40(m, "AC");
  const at = getEffective40(m, "AT");
  const vc = getEffective40(m, "VC");
  const vi = getEffective40(m, "VI");
  const va = getEffective40(m, "VA");
  const sc = getEffective40(m, "SC");
  const si = getEffective40(m, "SI");
  const sa = getEffective40(m, "SA");
  const e = getEffective40(m, "E");
  const cr = getEffective40(m, "CR");
  const ir = getEffective40(m, "IR");
  const ar = getEffective40(m, "AR");

  // EQ1: AV + PR + UI
  let eq1: number;
  if (av === "N" && pr === "N" && ui === "N") eq1 = 0;
  else if ((av === "N" || pr === "N" || ui === "N") && !(av === "N" && pr === "N" && ui === "N") && ui !== "A") eq1 = 1;
  else eq1 = 2;

  // EQ2: AC + AT
  let eq2: number;
  if (ac === "L" && at === "N") eq2 = 0;
  else eq2 = 1;

  // EQ3: VC + VI
  let eq3: number;
  if (vc === "H" && vi === "H") eq3 = 0;
  else if (vc === "H" || vi === "H" || va === "H") eq3 = 1;
  else eq3 = 2;

  // EQ4: SC + SI + SA (with MSI/MSA Safety)
  let eq4: number;
  if (si === "S" || sa === "S") eq4 = 0;
  else if (sc === "H" || si === "H" || sa === "H") eq4 = 1;
  else eq4 = 2;

  // EQ5: E (Exploit Maturity)
  let eq5: number;
  if (e === "A") eq5 = 0;
  else if (e === "P") eq5 = 1;
  else eq5 = 2;

  // EQ6: CR/IR/AR + VC/VI/VA interaction
  let eq6: number;
  if ((cr === "H" && vc === "H") || (ir === "H" && vi === "H") || (ar === "H" && va === "H")) eq6 = 0;
  else eq6 = 1;

  return `${eq1}${eq2}${eq3}${eq4}${eq5}${eq6}`;
}

function getMaxSeverityVectors(eq: string): Record<string, string>[] {
  const eqDigits = eq.split("").map(Number);
  const results: Record<string, string>[] = [];

  // Get the max-composed vectors for each EQ level
  const eq1Vectors = MAX_COMPOSED["eq1"][eqDigits[0]] || [];
  const eq2Vectors = MAX_COMPOSED["eq2"][eqDigits[1]] || [];
  const eq3Vectors = MAX_COMPOSED["eq3"][eqDigits[2]] || [];
  const eq4Vectors = MAX_COMPOSED["eq4"][eqDigits[3]] || [];
  const eq5Vectors = MAX_COMPOSED["eq5"][eqDigits[4]] || [];
  const eq6Vectors = MAX_COMPOSED["eq6"]?.[eqDigits[5]] || [];

  // Compose into a single max vector
  const maxVector: Record<string, string> = {};
  for (const [k, v] of eq1Vectors) maxVector[k] = v;
  for (const [k, v] of eq2Vectors) maxVector[k] = v;
  for (const [k, v] of eq3Vectors) maxVector[k] = v;
  for (const [k, v] of eq4Vectors) maxVector[k] = v;
  for (const [k, v] of eq5Vectors) maxVector[k] = v;
  for (const [k, v] of eq6Vectors) maxVector[k] = v;

  results.push(maxVector);
  return results;
}

export function calculateCvss40(metrics: Cvss40Metrics): CvssResult {
  // Check if all impact metrics are None
  const vc = getEffective40(metrics, "VC");
  const vi = getEffective40(metrics, "VI");
  const va = getEffective40(metrics, "VA");
  const sc = getEffective40(metrics, "SC");
  const si = getEffective40(metrics, "SI");
  const sa = getEffective40(metrics, "SA");

  if (vc === "N" && vi === "N" && va === "N" && sc === "N" && si === "N" && sa === "N") {
    return {
      version: "4.0",
      vector: buildCvss40Vector(metrics),
      baseScore: 0,
      severity: "None",
    };
  }

  const eq = computeEQ(metrics);

  // Step 1: Lookup base score
  const macroScore = CVSS40_LOOKUP[eq];
  if (macroScore === undefined) {
    // Fallback if MacroVector not found
    return {
      version: "4.0",
      vector: buildCvss40Vector(metrics),
      baseScore: 0,
      severity: "None",
    };
  }

  // Step 2: Calculate severity distances for interpolation
  const maxVectors = getMaxSeverityVectors(eq);
  if (maxVectors.length === 0) {
    return {
      version: "4.0",
      vector: buildCvss40Vector(metrics),
      baseScore: macroScore,
      severity: scoreSeverity(macroScore),
    };
  }

  let totalDistance = 0;
  let distanceCount = 0;

  // For each EQ, compute severity distance
  const eqDigits = eq.split("").map(Number);
  for (let eqi = 0; eqi < 6; eqi++) {
    const nextEq = [...eqDigits];
    nextEq[eqi] = eqDigits[eqi] + 1;
    const nextKey = nextEq.join("");
    const nextScore = CVSS40_LOOKUP[nextKey];

    if (nextScore === undefined) continue;

    const availableDistance = macroScore - nextScore;
    if (availableDistance <= 0) continue;

    // Compute metric-level distance within this EQ
    const eqKey = `eq${eqi + 1}`;
    const maxComposed = MAX_COMPOSED[eqKey]?.[eqDigits[eqi]];
    if (!maxComposed) continue;

    let currentDist = 0;
    let maxDist = 0;

    for (const [metric] of maxComposed) {
      const levels = CVSS40_METRIC_LEVELS[metric];
      if (!levels) continue;

      const effectiveVal = getEffective40(metrics, metric);
      const maxVal = maxVectors[0][metric] || Object.keys(levels)[0];

      const effectiveLevel = levels[effectiveVal] ?? 0;
      const maxLevel = levels[maxVal] ?? 0;

      currentDist += effectiveLevel - maxLevel;

      // Max possible distance is the range of this metric's levels
      const levelValues = Object.values(levels);
      maxDist += Math.max(...levelValues) - maxLevel;
    }

    if (maxDist > 0) {
      const normalizedDist = availableDistance * (currentDist / maxDist);
      totalDistance += normalizedDist;
      distanceCount++;
    }
  }

  const meanDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;
  let score = macroScore - meanDistance;

  // Clamp and round
  score = Math.max(0, Math.min(10, score));
  score = Math.round(score * 10) / 10;

  return {
    version: "4.0",
    vector: buildCvss40Vector(metrics),
    baseScore: score,
    severity: scoreSeverity(score),
  };
}

function buildCvss40Vector(m: Cvss40Metrics): string {
  let v = `CVSS:4.0/AV:${m.AV}/AC:${m.AC}/AT:${m.AT}/PR:${m.PR}/UI:${m.UI}/VC:${m.VC}/VI:${m.VI}/VA:${m.VA}/SC:${m.SC}/SI:${m.SI}/SA:${m.SA}`;
  if (m.E && m.E !== "X") v += `/E:${m.E}`;
  if (m.CR && m.CR !== "X") v += `/CR:${m.CR}`;
  if (m.IR && m.IR !== "X") v += `/IR:${m.IR}`;
  if (m.AR && m.AR !== "X") v += `/AR:${m.AR}`;
  if (m.MAV && m.MAV !== "X") v += `/MAV:${m.MAV}`;
  if (m.MAC && m.MAC !== "X") v += `/MAC:${m.MAC}`;
  if (m.MAT && m.MAT !== "X") v += `/MAT:${m.MAT}`;
  if (m.MPR && m.MPR !== "X") v += `/MPR:${m.MPR}`;
  if (m.MUI && m.MUI !== "X") v += `/MUI:${m.MUI}`;
  if (m.MVC && m.MVC !== "X") v += `/MVC:${m.MVC}`;
  if (m.MVI && m.MVI !== "X") v += `/MVI:${m.MVI}`;
  if (m.MVA && m.MVA !== "X") v += `/MVA:${m.MVA}`;
  if (m.MSC && m.MSC !== "X") v += `/MSC:${m.MSC}`;
  if (m.MSI && m.MSI !== "X") v += `/MSI:${m.MSI}`;
  if (m.MSA && m.MSA !== "X") v += `/MSA:${m.MSA}`;
  return v;
}

export function parseCvss40Vector(vector: string): Cvss40Metrics | null {
  if (!vector.startsWith("CVSS:4.0/")) return null;
  const parts = vector.split("/").slice(1);
  const map: Record<string, string> = {};
  for (const part of parts) {
    const [key, val] = part.split(":");
    if (key && val) map[key] = val;
  }
  if (!map.AV || !map.AC || !map.AT || !map.PR || !map.UI || !map.VC || !map.VI || !map.VA || !map.SC || !map.SI || !map.SA) return null;
  return {
    AV: map.AV as Cvss40Metrics["AV"],
    AC: map.AC as Cvss40Metrics["AC"],
    AT: map.AT as Cvss40Metrics["AT"],
    PR: map.PR as Cvss40Metrics["PR"],
    UI: map.UI as Cvss40Metrics["UI"],
    VC: map.VC as Cvss40Metrics["VC"],
    VI: map.VI as Cvss40Metrics["VI"],
    VA: map.VA as Cvss40Metrics["VA"],
    SC: map.SC as Cvss40Metrics["SC"],
    SI: map.SI as Cvss40Metrics["SI"],
    SA: map.SA as Cvss40Metrics["SA"],
    E: (map.E as Cvss40Metrics["E"]) || undefined,
    CR: (map.CR as Cvss40Metrics["CR"]) || undefined,
    IR: (map.IR as Cvss40Metrics["IR"]) || undefined,
    AR: (map.AR as Cvss40Metrics["AR"]) || undefined,
    MAV: (map.MAV as Cvss40Metrics["MAV"]) || undefined,
    MAC: (map.MAC as Cvss40Metrics["MAC"]) || undefined,
    MAT: (map.MAT as Cvss40Metrics["MAT"]) || undefined,
    MPR: (map.MPR as Cvss40Metrics["MPR"]) || undefined,
    MUI: (map.MUI as Cvss40Metrics["MUI"]) || undefined,
    MVC: (map.MVC as Cvss40Metrics["MVC"]) || undefined,
    MVI: (map.MVI as Cvss40Metrics["MVI"]) || undefined,
    MVA: (map.MVA as Cvss40Metrics["MVA"]) || undefined,
    MSC: (map.MSC as Cvss40Metrics["MSC"]) || undefined,
    MSI: (map.MSI as Cvss40Metrics["MSI"]) || undefined,
    MSA: (map.MSA as Cvss40Metrics["MSA"]) || undefined,
  };
}

// ── Shared Utilities ───────────────────────────────────────────────

export function scoreSeverity(score: number): Severity {
  if (score === 0) return "None";
  if (score <= 3.9) return "Low";
  if (score <= 6.9) return "Medium";
  if (score <= 8.9) return "High";
  return "Critical";
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  None: "text-dracula-comment",
  Low: "text-dracula-green",
  Medium: "text-dracula-yellow",
  High: "text-dracula-orange",
  Critical: "text-dracula-red",
};

export const SEVERITY_BG: Record<Severity, string> = {
  None: "bg-dracula-comment/20 border-dracula-comment/30",
  Low: "bg-dracula-green/10 border-dracula-green/30",
  Medium: "bg-dracula-yellow/10 border-dracula-yellow/30",
  High: "bg-dracula-orange/10 border-dracula-orange/30",
  Critical: "bg-dracula-red/10 border-dracula-red/30",
};

// ── Metric Definitions (for UI) ────────────────────────────────────

export interface MetricOption {
  value: string;
  label: string;
  abbrev: string;
  description: string;
}

export interface MetricDefinition {
  key: string;
  name: string;
  description: string;
  options: MetricOption[];
}

export interface MetricGroup {
  name: string;
  description: string;
  metrics: MetricDefinition[];
  expandable?: boolean;
}

export const CVSS31_METRIC_GROUPS: MetricGroup[] = [
  {
    name: "Base — Exploitability",
    description: "How the vulnerability can be exploited",
    metrics: [
      {
        key: "AV", name: "Attack Vector",
        description: "The context by which vulnerability exploitation is possible",
        options: [
          { value: "N", label: "Network", abbrev: "N", description: "The vulnerability is exploitable over the network (remotely)" },
          { value: "A", label: "Adjacent", abbrev: "A", description: "The attacker must be on the same physical or logical network" },
          { value: "L", label: "Local", abbrev: "L", description: "The attacker must have local access (e.g., local account or physical)" },
          { value: "P", label: "Physical", abbrev: "P", description: "The attacker requires physical access to the device" },
        ],
      },
      {
        key: "AC", name: "Attack Complexity",
        description: "Conditions beyond the attacker's control required for exploitation",
        options: [
          { value: "L", label: "Low", abbrev: "L", description: "No specialized conditions required" },
          { value: "H", label: "High", abbrev: "H", description: "Successful exploitation requires specific conditions (e.g., race condition, MITM)" },
        ],
      },
      {
        key: "PR", name: "Privileges Required",
        description: "The level of privileges an attacker must possess before exploitation",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No prior authentication or privileges needed" },
          { value: "L", label: "Low", abbrev: "L", description: "Basic user-level privileges (e.g., authenticated user)" },
          { value: "H", label: "High", abbrev: "H", description: "Administrative or significant privileges needed" },
        ],
      },
      {
        key: "UI", name: "User Interaction",
        description: "Whether user interaction is required for exploitation",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No user interaction required" },
          { value: "R", label: "Required", abbrev: "R", description: "A user must take an action (e.g., click a link, open a file)" },
        ],
      },
      {
        key: "S", name: "Scope",
        description: "Whether exploitation impacts resources beyond the vulnerable component",
        options: [
          { value: "U", label: "Unchanged", abbrev: "U", description: "Impact is limited to the vulnerable component" },
          { value: "C", label: "Changed", abbrev: "C", description: "Impact extends beyond the vulnerable component (e.g., sandbox escape)" },
        ],
      },
    ],
  },
  {
    name: "Base — Impact",
    description: "The direct consequence of a successful exploit",
    metrics: [
      {
        key: "C", name: "Confidentiality",
        description: "Impact to the confidentiality of information",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No loss of confidentiality" },
          { value: "L", label: "Low", abbrev: "L", description: "Some restricted information is disclosed" },
          { value: "H", label: "High", abbrev: "H", description: "Total information disclosure (e.g., all data in the system)" },
        ],
      },
      {
        key: "I", name: "Integrity",
        description: "Impact to the integrity of information",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No loss of integrity" },
          { value: "L", label: "Low", abbrev: "L", description: "Some data can be modified, limited impact" },
          { value: "H", label: "High", abbrev: "H", description: "Total compromise of system integrity" },
        ],
      },
      {
        key: "A", name: "Availability",
        description: "Impact to the availability of the system",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No impact on availability" },
          { value: "L", label: "Low", abbrev: "L", description: "Reduced performance or partial interruption" },
          { value: "H", label: "High", abbrev: "H", description: "Total loss of availability (complete denial of service)" },
        ],
      },
    ],
  },
  {
    name: "Temporal",
    description: "Characteristics that change over time (optional)",
    expandable: true,
    metrics: [
      {
        key: "E", name: "Exploit Code Maturity",
        description: "The current state of exploit techniques or code",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume worst case (same as High)" },
          { value: "U", label: "Unproven", abbrev: "U", description: "No exploit code available, or exploitation is theoretical" },
          { value: "P", label: "Proof-of-Concept", abbrev: "P", description: "Proof-of-concept exploit code available" },
          { value: "F", label: "Functional", abbrev: "F", description: "Functional exploit code is available and works in most situations" },
          { value: "H", label: "High", abbrev: "H", description: "Reliable autonomous exploitation, no manual effort needed" },
        ],
      },
      {
        key: "RL", name: "Remediation Level",
        description: "The existence of fixes or workarounds",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume worst case (same as Unavailable)" },
          { value: "O", label: "Official Fix", abbrev: "O", description: "Complete vendor solution available (patch, upgrade)" },
          { value: "T", label: "Temporary Fix", abbrev: "T", description: "Official but temporary fix (workaround)" },
          { value: "W", label: "Workaround", abbrev: "W", description: "Unofficial, non-vendor workaround available" },
          { value: "U", label: "Unavailable", abbrev: "U", description: "No fix or workaround available" },
        ],
      },
      {
        key: "RC", name: "Report Confidence",
        description: "The degree of confidence in the vulnerability's existence",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume worst case (same as Confirmed)" },
          { value: "U", label: "Unknown", abbrev: "U", description: "Unconfirmed reports or multiple conflicting sources" },
          { value: "R", label: "Reasonable", abbrev: "R", description: "Reasonable confidence from multiple sources" },
          { value: "C", label: "Confirmed", abbrev: "C", description: "Confirmed by the vendor or through direct exploitation" },
        ],
      },
    ],
  },
  {
    name: "Environmental",
    description: "Customize for your environment (optional)",
    expandable: true,
    metrics: [
      {
        key: "CR", name: "Confidentiality Requirement",
        description: "Importance of confidentiality to your organization",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume Medium" },
          { value: "L", label: "Low", abbrev: "L", description: "Confidentiality loss has limited impact" },
          { value: "M", label: "Medium", abbrev: "M", description: "Confidentiality loss has moderate impact" },
          { value: "H", label: "High", abbrev: "H", description: "Confidentiality is critical to the system" },
        ],
      },
      {
        key: "IR", name: "Integrity Requirement",
        description: "Importance of integrity to your organization",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume Medium" },
          { value: "L", label: "Low", abbrev: "L", description: "Integrity loss has limited impact" },
          { value: "M", label: "Medium", abbrev: "M", description: "Integrity loss has moderate impact" },
          { value: "H", label: "High", abbrev: "H", description: "Integrity is critical to the system" },
        ],
      },
      {
        key: "AR", name: "Availability Requirement",
        description: "Importance of availability to your organization",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume Medium" },
          { value: "L", label: "Low", abbrev: "L", description: "Availability loss has limited impact" },
          { value: "M", label: "Medium", abbrev: "M", description: "Availability loss has moderate impact" },
          { value: "H", label: "High", abbrev: "H", description: "Availability is critical to the system" },
        ],
      },
      {
        key: "MAV", name: "Modified Attack Vector",
        description: "Override base Attack Vector for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "N", label: "Network", abbrev: "N", description: "Network" },
          { value: "A", label: "Adjacent", abbrev: "A", description: "Adjacent" },
          { value: "L", label: "Local", abbrev: "L", description: "Local" },
          { value: "P", label: "Physical", abbrev: "P", description: "Physical" },
        ],
      },
      {
        key: "MAC", name: "Modified Attack Complexity",
        description: "Override base Attack Complexity for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "L", label: "Low", abbrev: "L", description: "Low" },
          { value: "H", label: "High", abbrev: "H", description: "High" },
        ],
      },
      {
        key: "MPR", name: "Modified Privileges Required",
        description: "Override base Privileges Required for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "N", label: "None", abbrev: "N", description: "None" },
          { value: "L", label: "Low", abbrev: "L", description: "Low" },
          { value: "H", label: "High", abbrev: "H", description: "High" },
        ],
      },
      {
        key: "MUI", name: "Modified User Interaction",
        description: "Override base User Interaction for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "N", label: "None", abbrev: "N", description: "None" },
          { value: "R", label: "Required", abbrev: "R", description: "Required" },
        ],
      },
      {
        key: "MS", name: "Modified Scope",
        description: "Override base Scope for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "U", label: "Unchanged", abbrev: "U", description: "Unchanged" },
          { value: "C", label: "Changed", abbrev: "C", description: "Changed" },
        ],
      },
      {
        key: "MC", name: "Modified Confidentiality",
        description: "Override base Confidentiality impact for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "N", label: "None", abbrev: "N", description: "None" },
          { value: "L", label: "Low", abbrev: "L", description: "Low" },
          { value: "H", label: "High", abbrev: "H", description: "High" },
        ],
      },
      {
        key: "MI", name: "Modified Integrity",
        description: "Override base Integrity impact for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "N", label: "None", abbrev: "N", description: "None" },
          { value: "L", label: "Low", abbrev: "L", description: "Low" },
          { value: "H", label: "High", abbrev: "H", description: "High" },
        ],
      },
      {
        key: "MA", name: "Modified Availability",
        description: "Override base Availability impact for your environment",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Use base metric value" },
          { value: "N", label: "None", abbrev: "N", description: "None" },
          { value: "L", label: "Low", abbrev: "L", description: "Low" },
          { value: "H", label: "High", abbrev: "H", description: "High" },
        ],
      },
    ],
  },
];

export const CVSS40_METRIC_GROUPS: MetricGroup[] = [
  {
    name: "Base — Exploitability",
    description: "How the vulnerability can be exploited",
    metrics: [
      {
        key: "AV", name: "Attack Vector",
        description: "The context by which vulnerability exploitation is possible",
        options: [
          { value: "N", label: "Network", abbrev: "N", description: "Remotely exploitable over the network" },
          { value: "A", label: "Adjacent", abbrev: "A", description: "Requires same physical or logical network" },
          { value: "L", label: "Local", abbrev: "L", description: "Requires local system access" },
          { value: "P", label: "Physical", abbrev: "P", description: "Requires physical device access" },
        ],
      },
      {
        key: "AC", name: "Attack Complexity",
        description: "Conditions beyond attacker control needed for exploitation",
        options: [
          { value: "L", label: "Low", abbrev: "L", description: "No specialized conditions required" },
          { value: "H", label: "High", abbrev: "H", description: "Requires specific preparation or conditions" },
        ],
      },
      {
        key: "AT", name: "Attack Requirements",
        description: "Prerequisite deployment and execution conditions",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No specific deployment or execution conditions needed" },
          { value: "P", label: "Present", abbrev: "P", description: "Specific conditions must exist (e.g., a race condition)" },
        ],
      },
      {
        key: "PR", name: "Privileges Required",
        description: "Level of privileges the attacker must possess",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No authentication needed" },
          { value: "L", label: "Low", abbrev: "L", description: "Basic user privileges needed" },
          { value: "H", label: "High", abbrev: "H", description: "Administrative privileges needed" },
        ],
      },
      {
        key: "UI", name: "User Interaction",
        description: "Whether a user other than the attacker must participate",
        options: [
          { value: "N", label: "None", abbrev: "N", description: "No user interaction needed" },
          { value: "P", label: "Passive", abbrev: "P", description: "Minimal user interaction (e.g., visiting a page)" },
          { value: "A", label: "Active", abbrev: "A", description: "Specific user action required (e.g., accepting a prompt)" },
        ],
      },
    ],
  },
  {
    name: "Base — Vulnerable System Impact",
    description: "Impact on the vulnerable component itself",
    metrics: [
      {
        key: "VC", name: "Confidentiality (Vulnerable)",
        description: "Impact on confidentiality of the vulnerable system",
        options: [
          { value: "H", label: "High", abbrev: "H", description: "Total information disclosure" },
          { value: "L", label: "Low", abbrev: "L", description: "Some information disclosed" },
          { value: "N", label: "None", abbrev: "N", description: "No confidentiality impact" },
        ],
      },
      {
        key: "VI", name: "Integrity (Vulnerable)",
        description: "Impact on integrity of the vulnerable system",
        options: [
          { value: "H", label: "High", abbrev: "H", description: "Total integrity compromise" },
          { value: "L", label: "Low", abbrev: "L", description: "Some data can be modified" },
          { value: "N", label: "None", abbrev: "N", description: "No integrity impact" },
        ],
      },
      {
        key: "VA", name: "Availability (Vulnerable)",
        description: "Impact on availability of the vulnerable system",
        options: [
          { value: "H", label: "High", abbrev: "H", description: "Total denial of service" },
          { value: "L", label: "Low", abbrev: "L", description: "Reduced performance" },
          { value: "N", label: "None", abbrev: "N", description: "No availability impact" },
        ],
      },
    ],
  },
  {
    name: "Base — Subsequent System Impact",
    description: "Impact on systems beyond the vulnerable component",
    metrics: [
      {
        key: "SC", name: "Confidentiality (Subsequent)",
        description: "Impact on confidentiality of subsequent systems",
        options: [
          { value: "H", label: "High", abbrev: "H", description: "Total information disclosure on downstream systems" },
          { value: "L", label: "Low", abbrev: "L", description: "Some information disclosed on downstream systems" },
          { value: "N", label: "None", abbrev: "N", description: "No downstream confidentiality impact" },
        ],
      },
      {
        key: "SI", name: "Integrity (Subsequent)",
        description: "Impact on integrity of subsequent systems",
        options: [
          { value: "H", label: "High", abbrev: "H", description: "Total integrity compromise of downstream systems" },
          { value: "L", label: "Low", abbrev: "L", description: "Some modification possible on downstream systems" },
          { value: "N", label: "None", abbrev: "N", description: "No downstream integrity impact" },
        ],
      },
      {
        key: "SA", name: "Availability (Subsequent)",
        description: "Impact on availability of subsequent systems",
        options: [
          { value: "H", label: "High", abbrev: "H", description: "Total denial of service on downstream systems" },
          { value: "L", label: "Low", abbrev: "L", description: "Reduced performance on downstream systems" },
          { value: "N", label: "None", abbrev: "N", description: "No downstream availability impact" },
        ],
      },
    ],
  },
  {
    name: "Threat",
    description: "Current threat landscape (optional)",
    expandable: true,
    metrics: [
      {
        key: "E", name: "Exploit Maturity",
        description: "The current state of exploitation",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume worst case (Attacked)" },
          { value: "A", label: "Attacked", abbrev: "A", description: "Active exploitation reported" },
          { value: "P", label: "POC", abbrev: "P", description: "Proof-of-concept exists" },
          { value: "U", label: "Unreported", abbrev: "U", description: "No reports of exploitation" },
        ],
      },
    ],
  },
  {
    name: "Environmental",
    description: "Customize for your environment (optional)",
    expandable: true,
    metrics: [
      {
        key: "CR", name: "Confidentiality Requirement",
        description: "Importance of confidentiality to your organization",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume High" },
          { value: "H", label: "High", abbrev: "H", description: "Critical to operations" },
          { value: "M", label: "Medium", abbrev: "M", description: "Moderate importance" },
          { value: "L", label: "Low", abbrev: "L", description: "Limited importance" },
        ],
      },
      {
        key: "IR", name: "Integrity Requirement",
        description: "Importance of integrity to your organization",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume High" },
          { value: "H", label: "High", abbrev: "H", description: "Critical to operations" },
          { value: "M", label: "Medium", abbrev: "M", description: "Moderate importance" },
          { value: "L", label: "Low", abbrev: "L", description: "Limited importance" },
        ],
      },
      {
        key: "AR", name: "Availability Requirement",
        description: "Importance of availability to your organization",
        options: [
          { value: "X", label: "Not Defined", abbrev: "X", description: "Assume High" },
          { value: "H", label: "High", abbrev: "H", description: "Critical to operations" },
          { value: "M", label: "Medium", abbrev: "M", description: "Moderate importance" },
          { value: "L", label: "Low", abbrev: "L", description: "Limited importance" },
        ],
      },
    ],
  },
];

// ── Common Vulnerability Presets ───────────────────────────────────

export interface VulnPreset {
  label: string;
  description: string;
  cvss31Vector: string;
  cvss40Vector: string;
}

export const VULN_PRESETS: VulnPreset[] = [
  {
    label: "Remote Code Execution (RCE)",
    description: "Unauthenticated remote code execution via network",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
  },
  {
    label: "SQL Injection",
    description: "Unauthenticated SQL injection via web input",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N",
  },
  {
    label: "Stored XSS",
    description: "Persistent cross-site scripting stored in database",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:P/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N",
  },
  {
    label: "Reflected XSS",
    description: "Non-persistent cross-site scripting requiring user click",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:A/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N",
  },
  {
    label: "SSRF (Server-Side Request Forgery)",
    description: "Unauthenticated SSRF accessing internal resources",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:H/SI:N/SA:N",
  },
  {
    label: "IDOR (Insecure Direct Object Reference)",
    description: "Authenticated user accessing other users' data",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N",
  },
  {
    label: "Local Privilege Escalation",
    description: "Authenticated local user escalating to root/admin",
    cvss31Vector: "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
    cvss40Vector: "CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
  },
  {
    label: "Denial of Service (DoS)",
    description: "Remote unauthenticated denial of service",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:H/SC:N/SI:N/SA:N",
  },
  {
    label: "Information Disclosure",
    description: "Unauthenticated access to sensitive information",
    cvss31Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
    cvss40Vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N",
  },
];

// ── Severity reference table ───────────────────────────────────────

export const SEVERITY_TABLE = [
  { rating: "None", range: "0.0", color: "text-dracula-comment" },
  { rating: "Low", range: "0.1 - 3.9", color: "text-dracula-green" },
  { rating: "Medium", range: "4.0 - 6.9", color: "text-dracula-yellow" },
  { rating: "High", range: "7.0 - 8.9", color: "text-dracula-orange" },
  { rating: "Critical", range: "9.0 - 10.0", color: "text-dracula-red" },
];
