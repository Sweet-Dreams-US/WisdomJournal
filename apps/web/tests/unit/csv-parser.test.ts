import { describe, it, expect } from "vitest";

// CSV parser from SettingsClient
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

describe("parseCSVLine", () => {
  it("parses simple comma-separated values", () => {
    expect(parseCSVLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields with commas", () => {
    expect(parseCSVLine('"hello, world",foo,bar')).toEqual([
      "hello, world",
      "foo",
      "bar",
    ]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseCSVLine('"He said ""hello""",done')).toEqual([
      'He said "hello"',
      "done",
    ]);
  });

  it("handles empty fields", () => {
    expect(parseCSVLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("handles single field", () => {
    expect(parseCSVLine("hello")).toEqual(["hello"]);
  });

  it("handles empty string", () => {
    expect(parseCSVLine("")).toEqual([""]);
  });
});
