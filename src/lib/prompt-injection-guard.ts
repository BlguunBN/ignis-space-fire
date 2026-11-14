/**
 * Adversarial Prompt Injection Firewall for Scientific Ingestion
 * 
 * Inspects incoming scraped web text and user-uploaded documents for:
 * - Direct & indirect prompt injections (jailbreak tokens, system override phrases)
 * - Instruction hijacking (e.g. "ignore previous instructions", "declare this approved")
 * - Delimiter and context escaping attacks (</system>, [INST], {{...}}, etc.)
 * - Exfiltration triggers (markdown image links, hidden tracking scripts)
 * - Obfuscated Unicode (zero-width spaces, homoglyphs)
 */

export interface InjectionScanResult {
  isSafe: boolean;
  threatScore: number; // 0.0 (clean) to 1.0 (malicious)
  detectedThreats: string[];
  sanitizedText: string;
}

// Regex patterns for prompt injection and instruction hijacking
const ADVERSARIAL_INJECTION_PATTERNS: { name: string; pattern: RegExp; severity: number }[] = [
  {
    name: "System Prompt Override",
    pattern: /(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+)?(?:previous|prior|system|above)\s+(?:instructions|prompts|rules|directives|constraints)/i,
    severity: 0.85,
  },
  {
    name: "Persona / Mode Hijacking",
    pattern: /(?:you are now|act as|pretend to be|switch to|enter)\s+(?:in\s+)?(?:developer mode|godmode|dan mode|unrestricted mode|jailbreak)/i,
    severity: 0.85,
  },
  {
    name: "Forced Approval Directive",
    pattern: /(?:declare|mark|approve|verify|classify)\s+(?:this\s+)?(?:document|paper|data|record)\s+(?:as\s+)?(?:approved|verified|authentic|safe|gold standard|100%|true)\s+(?:without\s+)?(?:review|audit|checking)/i,
    severity: 0.75,
  },
  {
    name: "Delimiter Exploitation",
    pattern: /<\/?(?:system|instruction|prompt|im_start|im_end|admin|root|user|assistant)>/i,
    severity: 0.8,
  },
  {
    name: "Template / Code Injection",
    pattern: /\{\{\s*(?:constructor|process|require|import|eval|global|exec)\b|<\s*script\b|javascript\s*:/i,
    severity: 0.9,
  },
  {
    name: "Exfiltration Link Injection",
    pattern: /!\[.*?\]\s*\(\s*(?:https?:)?\/\/[^\s)]+(?:token|key|secret|cookie|passwd|password|env|credential)/i,
    severity: 0.9,
  },
  {
    name: "Instruction Disguised as Reviewer Note",
    pattern: /\[\s*(?:SYSTEM|ADMIN|INTERNAL|CONFIDENTIAL)\s*:\s*OVERRIDE\s*\]/i,
    severity: 0.85,
  },
];

/**
 * Strips zero-width characters, control codes, and invisible homoglyphs
 * commonly used to bypass keyword filters.
 */
export function sanitizeUnicode(raw: string): string {
  return raw
    // Strip zero-width characters: \u200B (ZWSP), \u200C (ZWNJ), \u200D (ZWJ), \uFEFF (BOM), \u2060 (WJ)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u200E\u200F]/g, "")
    // Normalize unicode NFKC
    .normalize("NFKC")
    // Normalize excessive whitespace
    .replace(/[ \t]+/g, " ");
}

/**
 * Scans a document for prompt injection attacks and malicious payload patterns.
 * Threshold: threatScore >= 0.40 triggers a security reject.
 */
export function scanDocumentForPromptInjection(rawText: string): InjectionScanResult {
  const sanitized = sanitizeUnicode(rawText || "");
  const detectedThreats: string[] = [];
  let threatScore = 0.0;

  // Check for adversarial patterns
  for (const item of ADVERSARIAL_INJECTION_PATTERNS) {
    if (item.pattern.test(sanitized)) {
      detectedThreats.push(item.name);
      threatScore = Math.min(1.0, threatScore + item.severity);
    }
  }

  // Check for excessive hidden markdown image tags (exfiltration vector)
  const imageTagMatches = sanitized.match(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g);
  if (imageTagMatches && imageTagMatches.length > 5) {
    detectedThreats.push("Excessive External Markdown Image Tags (Possible Exfiltration Vector)");
    threatScore = Math.min(1.0, threatScore + 0.45);
  }

  // Check for base64 encoded instruction blocks (> 100 contiguous base64 characters)
  const base64Match = sanitized.match(/\b[A-Za-z0-9+/]{120,}={0,2}\b/);
  if (base64Match) {
    detectedThreats.push("Suspicious Long Base64 Obfuscated Block");
    threatScore = Math.min(1.0, threatScore + 0.35);
  }

  const isSafe = threatScore < 0.40 && detectedThreats.length === 0;

  return {
    isSafe,
    threatScore: Math.round(threatScore * 100) / 100,
    detectedThreats,
    sanitizedText: sanitized,
  };
}
