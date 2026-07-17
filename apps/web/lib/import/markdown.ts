/**
 * Markdown / Obsidian-vault import parsing (client-safe, zero dependencies).
 *
 * Each .md file becomes one ImportEntry:
 * - Optional YAML frontmatter is hand-parsed (leading `---` block of
 *   `key: value` lines). Supported keys: `title`, `date`, `created`, `tags`
 *   (inline `[a, b]`, comma/space separated, or `- item` list form).
 * - Entry date = frontmatter date/created, or a YYYY-MM-DD in the filename
 *   (Obsidian daily-notes pattern), or undefined.
 * - Title = frontmatter title, or the filename without its extension. The
 *   title is used as the entry's question, so it reads "Q: <note title>".
 * - Body = content minus frontmatter, kept verbatim except that
 *   [[wikilinks]] are unwrapped to their inner text (verbatim preservation
 *   is a product principle — nothing else is rewritten).
 * - Category = the first tag that matches a known category slug or name.
 */

import { toLocalDateKey } from "@/lib/utils/dates";

export interface ImportEntry {
  question?: string;
  response: string;
  date?: string;
  category?: string; // category slug
}

export interface MarkdownImportFile {
  name: string;
  content: string;
}

export interface CategoryMatchOption {
  slug: string;
  name: string;
}

const YMD_RE = /(\d{4}-\d{2}-\d{2})/;

export function isMarkdownFileName(name: string): boolean {
  return /\.(md|markdown)$/i.test(name);
}

/** "vault/daily/2024-01-15.md" -> "2024-01-15" */
function fileBaseName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  return base.replace(/\.(md|markdown)$/i, "");
}

export function parseMarkdownEntries(
  files: MarkdownImportFile[],
  categories: CategoryMatchOption[] = []
): ImportEntry[] {
  const categoryLookup = buildCategoryLookup(categories);
  const entries: ImportEntry[] = [];

  for (const file of files) {
    if (!isMarkdownFileName(file.name)) continue;
    const entry = parseMarkdownFile(file, categoryLookup);
    if (entry) entries.push(entry);
  }

  return entries;
}

function parseMarkdownFile(
  file: MarkdownImportFile,
  categoryLookup: Map<string, string>
): ImportEntry | null {
  // Strip a UTF-8 BOM if present so frontmatter detection works.
  const content = file.content.replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/);

  const frontmatter = parseFrontmatter(lines);
  const bodyLines = frontmatter
    ? lines.slice(frontmatter.endLineIndex + 1)
    : lines;

  const body = unwrapWikilinks(bodyLines.join("\n")).trim();
  if (!body) return null;

  const baseName = fileBaseName(file.name);
  const title = frontmatter?.values.title || baseName;

  const date =
    extractDate(frontmatter?.values.date) ??
    extractDate(frontmatter?.values.created) ??
    extractYmd(baseName);

  const category = matchCategory(frontmatter?.tags ?? [], categoryLookup);

  return {
    question: title,
    response: body,
    date,
    category,
  };
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

interface ParsedFrontmatter {
  values: Record<string, string>;
  tags: string[];
  /** Index (into the file's lines) of the closing `---` line. */
  endLineIndex: number;
}

function parseFrontmatter(lines: string[]): ParsedFrontmatter | null {
  if (lines.length === 0 || lines[0].trim() !== "---") return null;

  let endLineIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "---" || trimmed === "...") {
      endLineIndex = i;
      break;
    }
  }
  if (endLineIndex === -1) return null;

  const values: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  let currentListKey: string | null = null;

  for (let i = 1; i < endLineIndex; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // `- item` lines belong to the preceding `key:` line.
    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentListKey) {
      const item = stripQuotes(listMatch[1].trim());
      if (item) {
        (lists[currentListKey] ??= []).push(item);
      }
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1].toLowerCase();
    const rawValue = kvMatch[2].trim();

    if (rawValue === "") {
      // A bare `key:` line opens a `- item` list.
      currentListKey = key;
      continue;
    }

    currentListKey = null;
    values[key] = stripQuotes(rawValue);
  }

  const tags = collectTags(values.tags, lists.tags);

  return { values, tags, endLineIndex };
}

function collectTags(
  inlineValue: string | undefined,
  listItems: string[] | undefined
): string[] {
  const raw: string[] = [];

  if (inlineValue) {
    // Handles `[a, b]`, `a, b`, and space-separated Obsidian tags.
    const stripped = inlineValue.replace(/^\[/, "").replace(/\]$/, "");
    raw.push(...stripped.split(/[,\s]+/));
  }
  if (listItems) {
    raw.push(...listItems);
  }

  return raw
    .map((tag) => stripQuotes(tag.trim()).replace(/^#/, ""))
    .filter(Boolean);
}

function stripQuotes(value: string): string {
  const match = value.match(/^"(.*)"$/) ?? value.match(/^'(.*)'$/);
  return match ? match[1] : value;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

function extractYmd(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(YMD_RE);
  return match ? match[1] : undefined;
}

function extractDate(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Prefer a literal YYYY-MM-DD — parsing date-only strings through
  // `new Date()` treats them as UTC midnight and can shift the day.
  const ymd = extractYmd(value);
  if (ymd) return ymd;

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return undefined;
  return toLocalDateKey(parsed);
}

// ---------------------------------------------------------------------------
// Body cleaning
// ---------------------------------------------------------------------------

/**
 * Unwrap Obsidian wikilinks, keeping the display text:
 * `[[Note]]` -> `Note`, `[[Note|alias]]` -> `alias`, `![[embed]]` -> `embed`.
 * Everything else in the body is preserved verbatim.
 */
function unwrapWikilinks(text: string): string {
  return text.replace(/!?\[\[([^[\]]+)\]\]/g, (_match, inner: string) => {
    const parts = inner.split("|");
    return (parts[parts.length - 1] || inner).trim();
  });
}

// ---------------------------------------------------------------------------
// Category matching
// ---------------------------------------------------------------------------

function buildCategoryLookup(
  categories: CategoryMatchOption[]
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const category of categories) {
    const slugKey = normalizeToken(category.slug);
    const nameKey = normalizeToken(category.name);
    if (slugKey && !lookup.has(slugKey)) lookup.set(slugKey, category.slug);
    if (nameKey && !lookup.has(nameKey)) lookup.set(nameKey, category.slug);
  }
  return lookup;
}

function matchCategory(
  tags: string[],
  lookup: Map<string, string>
): string | undefined {
  for (const tag of tags) {
    const slug = lookup.get(normalizeToken(tag));
    if (slug) return slug;
  }
  return undefined;
}

/** "Life Lessons", "life-lessons", and "life_lessons" all normalize alike. */
function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
