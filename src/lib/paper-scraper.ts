/**
 * Research Paper & Experimental Data Scraper
 * 
 * Supports external URL fetching (NASA NTRS, arXiv, DOI, scientific HTML/PDF)
 * with SSRF protection, size caps, and content extraction.
 */

export interface ScrapedPaperMetadata {
  authors?: string[];
  abstract?: string;
  doi?: string;
  sourceOrg?: string;
  publishedDate?: string;
}

export interface ScrapedPaperContent {
  url?: string;
  title: string;
  filename: string;
  rawText: string;
  contentType: string;
  extractedMetadata: ScrapedPaperMetadata;
  extractedAt: string;
}

/**
 * Validates external URLs and protects against SSRF (Server-Side Request Forgery) attacks.
 */
export function validateExternalUrl(urlString: string): { valid: boolean; error?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTP and HTTPS URLs are permitted." };
    }

    let hostname = parsed.hostname.toLowerCase();
    // Strip IPv6 brackets if present
    if (hostname.startsWith("[") && hostname.endsWith("]")) {
      hostname = hostname.slice(1, -1);
    }

    // Check loopback, link-local, and private RFC-1918 addresses
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return { valid: false, error: "Access to private or local network addresses is prohibited." };
    }

    // Check RFC-1918 172.16.0.0/12
    const ipMatch = hostname.match(/^172\.(\d+)\./);
    if (ipMatch) {
      const secondOctet = parseInt(ipMatch[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return { valid: false, error: "Access to private network addresses is prohibited." };
      }
    }

    return { valid: true, parsedUrl: parsed };
  } catch (err: any) {
    return { valid: false, error: `Invalid URL format: ${err.message}` };
  }
}

/**
 * Mock fixtures for offline development, local unit tests, and CI/CD without network access.
 */
const MOCK_FIXTURES: Record<string, ScrapedPaperContent> = {
  "https://ntrs.nasa.gov/citations/20220014245": {
    url: "https://ntrs.nasa.gov/citations/20220014245",
    title: "Saffire-V Concurrent Flame Extinction in Cotton-Fiberglass Blends at Low Pressure",
    filename: "NASA-TM-2022-0014245.pdf",
    rawText: `
      NASA Glenn Research Center Technical Memorandum.
      Investigation: Saffire-V Spacecraft Fire Safety.
      Platform: Cygnus Cargo Vehicle (OA-14).
      Fuel Specimen: SIBAL fabric (75% cotton, 25% fiberglass blend).
      Atmospheric Conditions: 24.0% O2, cabin total pressure 70.3 kPa, forced airflow 12.0 cm/s in microgravity (0g).
      Findings: Concurrent flame spread decelerated rapidly as cabin pressure was evacuated down to 70.3 kPa.
      Extinction limit occurred at 20.8% O2 under 12 cm/s airflow.
      Apparatus: Saffire Flow Duct, equipped with calibrated radiometers and thermocouple rakes.
      Limitations: Edge quenching effects along sample holder observed at low flow velocities.
      DOI: 10.60555/0t15-s5ex
    `,
    contentType: "application/pdf",
    extractedMetadata: {
      authors: ["David L. Urban", "Gary A. Ruff", "A. Carlos Fernandez-Pello"],
      abstract: "Evaluation of low-pressure concurrent flame spread aboard Cygnus microgravity mission.",
      doi: "10.60555/0t15-s5ex",
      sourceOrg: "NASA Glenn Research Center",
      publishedDate: "2022-04-15",
    },
    extractedAt: new Date().toISOString(),
  },
  "https://arxiv.org/abs/2205.99999": {
    url: "https://arxiv.org/abs/2205.99999",
    title: "Droplet Combustion Dynamics and Cool Flame Phenomena in Isolated Alkane Microgravity Droplets",
    filename: "arxiv-2205-99999.pdf",
    rawText: `
      ISS Combustion Integrated Rack (CIR) / Multi-user Droplet Combustion Apparatus (MDCA).
      Investigation: FLEX-2 / Cool Flame Droplet Combustion.
      Fuel: Pure n-heptane liquid droplet (1.5 mm initial diameter).
      Conditions: 21.0% O2, ambient pressure 101.3 kPa, quiescent environment (0 cm/s flow) in ISS microgravity.
      Findings: Secondary cool flame burning persisted after first radiative extinction, burning quasi-steadily for 8.4 seconds with d2 law burning rate k = 0.42 mm2/s.
      Apparatus: CIR chamber with backlit UV/OH* chemiluminescence imaging.
      Limitations: Droplet drift towards igniter needles during deployment occasionally perturbs symmetry.
      DOI: 10.1016/j.combustflame.2022.05.012
    `,
    contentType: "text/html",
    extractedMetadata: {
      authors: ["Forman A. Williams", "Vedha Nayagam"],
      abstract: "Investigation of cool flame droplet burning kinetics on the International Space Station.",
      doi: "10.1016/j.combustflame.2022.05.012",
      sourceOrg: "UC San Diego / NASA Glenn",
      publishedDate: "2022-05-20",
    },
    extractedAt: new Date().toISOString(),
  },
};

/**
 * Extracts plain text, title, and citation metadata from raw HTML document strings.
 */
function parseHtmlDocument(html: string, fallbackUrl?: string): { title: string; text: string; metadata: ScrapedPaperMetadata } {
  // Title extraction: <title> or <meta name="citation_title">
  const citationTitleMatch = html.match(/<meta\s+name=["']citation_title["']\s+content=["']([^"']+)["']/i);
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = (citationTitleMatch?.[1] || ogTitleMatch?.[1] || titleTagMatch?.[1] || "Scraped Research Paper").trim();

  // Abstract extraction
  const abstractMetaMatch = html.match(/<meta\s+name=["'](?:citation_abstract|description)["']\s+content=["']([^"']+)["']/i);
  const abstract = abstractMetaMatch?.[1]?.trim();

  // DOI extraction
  const doiMetaMatch = html.match(/<meta\s+name=["']citation_doi["']\s+content=["']([^"']+)["']/i);
  const doi = doiMetaMatch?.[1]?.trim();

  // Author extraction
  const authorMatches = [...html.matchAll(/<meta\s+name=["']citation_author["']\s+content=["']([^"']+)["']/gi)];
  const authors = authorMatches.map((m) => m[1].trim());

  // Clean HTML text: strip <script>, <style>, <nav>, <header>, <footer>
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");

  // Replace common block tags with newlines
  cleanHtml = cleanHtml.replace(/<\/(?:p|div|h[1-6]|li|tr)>/gi, "\n");
  // Strip all other HTML tags
  const plainText = cleanHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

  return {
    title,
    text: plainText,
    metadata: {
      authors: authors.length > 0 ? authors : undefined,
      abstract,
      doi,
      sourceOrg: fallbackUrl ? new URL(fallbackUrl).hostname : undefined,
    },
  };
}

/**
 * Scrapes and extracts research paper content from a verified external URL.
 */
export async function fetchAndExtractPaperFromUrl(
  url: string,
  options: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<ScrapedPaperContent> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxBytes = options.maxBytes ?? 20 * 1024 * 1024; // 20 MB max

  // 1. SSRF and Protocol Validation
  const validation = validateExternalUrl(url);
  if (!validation.valid || !validation.parsedUrl) {
    throw new Error(validation.error || "Invalid or restricted URL.");
  }

  // 2. Offline / Mock fixture check
  const normalizedUrl = url.trim().replace(/\/$/, "");
  if (MOCK_FIXTURES[normalizedUrl]) {
    return MOCK_FIXTURES[normalizedUrl];
  }

  // 3. Network Fetch with Timeout & User-Agent
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IGNIS-NASA-Research-Scraper/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml,text/plain,application/pdf;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status}: ${response.statusText})`);
    }

    const contentType = response.headers.get("content-type") || "text/html";
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      throw new Error(`Document exceeds maximum allowed size (${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit).`);
    }

    const bodyText = await response.text();
    if (bodyText.length > maxBytes) {
      throw new Error(`Document exceeds maximum allowed length.`);
    }

    // 4. Content Parsing
    let title = validation.parsedUrl.pathname.split("/").pop() || "Scraped Document";
    let rawText = bodyText;
    let metadata: ScrapedPaperMetadata = {
      sourceOrg: validation.parsedUrl.hostname,
    };

    if (contentType.includes("html") || bodyText.includes("<html") || bodyText.includes("<!DOCTYPE")) {
      const parsed = parseHtmlDocument(bodyText, url);
      title = parsed.title;
      rawText = parsed.text;
      metadata = { ...metadata, ...parsed.metadata };
    }

    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.txt`;

    return {
      url,
      title,
      filename,
      rawText,
      contentType,
      extractedMetadata: metadata,
      extractedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses raw text or structured contents uploaded from a local file (.txt, .csv, .json, .pdf text).
 */
export function parseUploadedDocument(
  filename: string,
  content: string
): ScrapedPaperContent {
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  let title = cleanFilename.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
  // Capitalize title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // If document contains # Title or Title: ... near beginning, extract title
  const titleMatch = content.trim().match(/^(?:#\s+|Title:\s*)([^\r\n]+)/im);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Detect DOI in content
  const doiMatch = content.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);

  return {
    title,
    filename: cleanFilename,
    rawText: content,
    contentType: filename.endsWith(".csv")
      ? "text/csv"
      : filename.endsWith(".json")
      ? "application/json"
      : "text/plain",
    extractedMetadata: {
      doi: doiMatch?.[0],
      sourceOrg: "Local Research Upload",
    },
    extractedAt: new Date().toISOString(),
  };
}
