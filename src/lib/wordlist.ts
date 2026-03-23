/**
 * Wordlist / Password Mutation Generator logic.
 * All operations run client-side on the main thread.
 */

// ── Leet speak mappings ─────────────────────────────────────────────

export interface LeetMapping {
  char: string;
  replacements: string[];
}

export const LEET_MAPPINGS: LeetMapping[] = [
  { char: "a", replacements: ["@", "4"] },
  { char: "b", replacements: ["8"] },
  { char: "e", replacements: ["3"] },
  { char: "g", replacements: ["9", "6"] },
  { char: "i", replacements: ["1", "!"] },
  { char: "l", replacements: ["1"] },
  { char: "o", replacements: ["0"] },
  { char: "s", replacements: ["$", "5"] },
  { char: "t", replacements: ["7"] },
];

// ── Configuration ───────────────────────────────────────────────────

export interface WordlistConfig {
  baseWords: string[];
  enableLeet: boolean;
  leetMappings: string[]; // char values that are enabled (e.g., ["a", "e", "o"])
  enableCaseVariations: boolean;
  caseVariations: string[]; // "lower" | "upper" | "capitalize" | "toggle" | "original"
  enableNumbers: boolean;
  numberRanges: string[]; // "0-9" | "00-99" | "years"
  customYearStart: number;
  customYearEnd: number;
  enableSymbols: boolean;
  symbols: string[];
  enableSuffixes: boolean;
  suffixes: string[];
  enableCombine: boolean;
  separators: string[];
  maxResults: number;
}

export const DEFAULT_CONFIG: WordlistConfig = {
  baseWords: [],
  enableLeet: false,
  leetMappings: ["a", "e", "i", "o", "s"],
  enableCaseVariations: true,
  caseVariations: ["original", "lower", "upper", "capitalize"],
  enableNumbers: false,
  numberRanges: ["0-9"],
  customYearStart: 2020,
  customYearEnd: 2026,
  enableSymbols: false,
  symbols: ["!", "@", "#", "$"],
  enableSuffixes: true,
  suffixes: ["123", "1234", "!", "1", "01"],
  enableCombine: false,
  separators: [""],
  maxResults: 100000,
};

export const ALL_SYMBOLS = ["!", "@", "#", "$", "%", "^", "&", "*"];
export const ALL_SUFFIXES = ["1", "01", "12", "123", "1234", "!", "!!", "69", "007"];

// ── Mutation engine ─────────────────────────────────────────────────

function applyCaseVariations(word: string, variations: string[]): string[] {
  const results: string[] = [];
  for (const v of variations) {
    switch (v) {
      case "original":
        results.push(word);
        break;
      case "lower":
        results.push(word.toLowerCase());
        break;
      case "upper":
        results.push(word.toUpperCase());
        break;
      case "capitalize":
        results.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        break;
      case "toggle":
        results.push(
          word
            .split("")
            .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
            .join("")
        );
        break;
    }
  }
  // Deduplicate
  return [...new Set(results)];
}

function applyLeetSpeak(
  words: string[],
  mappings: string[]
): string[] {
  if (mappings.length === 0) return [];

  const activeMappings = LEET_MAPPINGS.filter((m) =>
    mappings.includes(m.char)
  );

  if (activeMappings.length === 0) return [];

  const results: string[] = [];

  for (const word of words) {
    // Generate all leet combinations for this word
    // For each character position that matches a mapping, branch
    const leetVariants = generateLeetVariants(word, activeMappings);
    for (const variant of leetVariants) {
      if (variant !== word) {
        results.push(variant);
      }
    }
  }

  return results;
}

function generateLeetVariants(
  word: string,
  mappings: LeetMapping[]
): string[] {
  // Build a list of positions that can be substituted
  const chars = word.toLowerCase().split("");
  const positions: { index: number; replacements: string[] }[] = [];

  for (let i = 0; i < chars.length; i++) {
    const mapping = mappings.find((m) => m.char === chars[i]);
    if (mapping) {
      positions.push({ index: i, replacements: mapping.replacements });
    }
  }

  if (positions.length === 0) return [];

  // Limit combinatorial explosion: if too many positions, only do individual substitutions
  if (positions.length > 8) {
    const results: string[] = [];
    for (const pos of positions) {
      for (const rep of pos.replacements) {
        const arr = word.split("");
        arr[pos.index] = rep;
        results.push(arr.join(""));
      }
    }
    return results;
  }

  // Generate all subsets of positions (skip empty set)
  const results: string[] = [];
  const totalSubsets = 1 << positions.length;
  // Cap at 256 subsets to prevent explosion
  const maxSubsets = Math.min(totalSubsets, 256);

  for (let mask = 1; mask < maxSubsets; mask++) {
    // For each subset, generate all replacement combinations
    const activePositions: { index: number; replacements: string[] }[] = [];
    for (let j = 0; j < positions.length; j++) {
      if (mask & (1 << j)) {
        activePositions.push(positions[j]);
      }
    }

    // Generate cartesian product of replacements for active positions
    const combos = cartesianProduct(
      activePositions.map((p) => p.replacements)
    );

    for (const combo of combos) {
      const arr = word.split("");
      for (let k = 0; k < activePositions.length; k++) {
        arr[activePositions[k].index] = combo[k];
      }
      results.push(arr.join(""));
    }
  }

  return results;
}

function cartesianProduct(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];

  let result: string[][] = [[]];
  for (const arr of arrays) {
    const next: string[][] = [];
    for (const existing of result) {
      for (const item of arr) {
        next.push([...existing, item]);
      }
    }
    result = next;
    // Safety cap
    if (result.length > 1000) break;
  }
  return result;
}

function generateNumbers(ranges: string[], yearStart: number, yearEnd: number): string[] {
  const numbers: string[] = [];

  for (const range of ranges) {
    switch (range) {
      case "0-9":
        for (let i = 0; i <= 9; i++) numbers.push(String(i));
        break;
      case "00-99":
        for (let i = 0; i <= 99; i++) numbers.push(String(i).padStart(2, "0"));
        break;
      case "years":
        for (let y = yearStart; y <= yearEnd; y++) numbers.push(String(y));
        break;
    }
  }

  return [...new Set(numbers)];
}

// ── Main generation function ────────────────────────────────────────

export function generateWordlist(config: WordlistConfig): string[] {
  const { baseWords, maxResults } = config;

  if (baseWords.length === 0) return [];

  // Filter out empty strings
  const words = baseWords.filter((w) => w.trim().length > 0).map((w) => w.trim());
  if (words.length === 0) return [];

  const resultSet = new Set<string>();

  // Step 1: Start with base words
  let currentWords = [...words];

  // Step 2: Apply case variations
  if (config.enableCaseVariations && config.caseVariations.length > 0) {
    const cased: string[] = [];
    for (const word of currentWords) {
      cased.push(...applyCaseVariations(word, config.caseVariations));
    }
    currentWords = [...new Set(cased)];
  }

  // Step 3: Apply leet speak to get additional variants
  let allVariants = [...currentWords];
  if (config.enableLeet && config.leetMappings.length > 0) {
    const leetResults = applyLeetSpeak(currentWords, config.leetMappings);
    allVariants = [...new Set([...currentWords, ...leetResults])];
  }

  // Step 4: Add bare variants to result
  for (const v of allVariants) {
    resultSet.add(v);
    if (resultSet.size >= maxResults) break;
  }

  // Step 5: Append numbers
  if (config.enableNumbers && config.numberRanges.length > 0) {
    const numbers = generateNumbers(
      config.numberRanges,
      config.customYearStart,
      config.customYearEnd
    );
    for (const v of allVariants) {
      for (const n of numbers) {
        resultSet.add(v + n);
        if (resultSet.size >= maxResults) break;
      }
      if (resultSet.size >= maxResults) break;
    }
  }

  // Step 6: Append symbols
  if (config.enableSymbols && config.symbols.length > 0) {
    for (const v of allVariants) {
      for (const s of config.symbols) {
        resultSet.add(v + s);
        if (resultSet.size >= maxResults) break;
      }
      if (resultSet.size >= maxResults) break;
    }
  }

  // Step 7: Append common suffixes
  if (config.enableSuffixes && config.suffixes.length > 0) {
    for (const v of allVariants) {
      for (const s of config.suffixes) {
        resultSet.add(v + s);
        if (resultSet.size >= maxResults) break;
      }
      if (resultSet.size >= maxResults) break;
    }
  }

  // Step 8: Combine base words with separators
  if (config.enableCombine && words.length > 1 && config.separators.length > 0) {
    for (let i = 0; i < words.length && resultSet.size < maxResults; i++) {
      for (let j = 0; j < words.length && resultSet.size < maxResults; j++) {
        if (i === j) continue;
        for (const sep of config.separators) {
          const w1 = words[i];
          const w2 = words[j];
          resultSet.add(w1 + sep + w2);
          // Also capitalize variants
          resultSet.add(
            w1.charAt(0).toUpperCase() +
              w1.slice(1).toLowerCase() +
              sep +
              w2.charAt(0).toUpperCase() +
              w2.slice(1).toLowerCase()
          );
          if (resultSet.size >= maxResults) break;
        }
      }
    }
  }

  return Array.from(resultSet).slice(0, maxResults);
}

// ── URL hash encoding ───────────────────────────────────────────────

export function encodeConfigToHash(config: WordlistConfig): string {
  const data = {
    w: config.baseWords,
    l: config.enableLeet ? 1 : 0,
    lm: config.leetMappings,
    c: config.enableCaseVariations ? 1 : 0,
    cv: config.caseVariations,
    n: config.enableNumbers ? 1 : 0,
    nr: config.numberRanges,
    ys: config.customYearStart,
    ye: config.customYearEnd,
    sy: config.enableSymbols ? 1 : 0,
    sl: config.symbols,
    sf: config.enableSuffixes ? 1 : 0,
    sfl: config.suffixes,
    cb: config.enableCombine ? 1 : 0,
    sp: config.separators,
  };
  return btoa(JSON.stringify(data));
}

export function decodeConfigFromHash(hash: string): Partial<WordlistConfig> | null {
  try {
    const data = JSON.parse(atob(hash));
    return {
      baseWords: data.w || [],
      enableLeet: data.l === 1,
      leetMappings: data.lm || DEFAULT_CONFIG.leetMappings,
      enableCaseVariations: data.c === 1,
      caseVariations: data.cv || DEFAULT_CONFIG.caseVariations,
      enableNumbers: data.n === 1,
      numberRanges: data.nr || DEFAULT_CONFIG.numberRanges,
      customYearStart: data.ys || DEFAULT_CONFIG.customYearStart,
      customYearEnd: data.ye || DEFAULT_CONFIG.customYearEnd,
      enableSymbols: data.sy === 1,
      symbols: data.sl || DEFAULT_CONFIG.symbols,
      enableSuffixes: data.sf === 1,
      suffixes: data.sfl || DEFAULT_CONFIG.suffixes,
      enableCombine: data.cb === 1,
      separators: data.sp || DEFAULT_CONFIG.separators,
    };
  } catch {
    return null;
  }
}
