"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DigitalExecutor from "@/components/app/DigitalExecutor";

interface SettingsClientProps {
  profile: any;
}

interface ImportEntry {
  question?: string;
  response: string;
  date?: string;
  category?: string;
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter();

  // Privacy
  const [isDiscoverable, setIsDiscoverable] = useState(
    profile?.is_discoverable ?? true
  );
  const [privacySaving, setPrivacySaving] = useState(false);

  // Export
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Import
  const [importEntries, setImportEntries] = useState<ImportEntry[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    total: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Privacy toggle
  async function toggleDiscoverable() {
    const newVal = !isDiscoverable;
    setIsDiscoverable(newVal);
    setPrivacySaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_discoverable: newVal }),
      });
    } catch {
      setIsDiscoverable(!newVal);
    } finally {
      setPrivacySaving(false);
    }
  }

  // Export
  async function handleExport(format: "json" | "csv") {
    setExportingFormat(format);
    setExportSuccess(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `wisdom-journal-export-${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(format.toUpperCase());
      setTimeout(() => setExportSuccess(null), 3000);
    } catch {
      // Could show error toast
    } finally {
      setExportingFormat(null);
    }
  }

  // Import file handling
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      setImportResult(null);
      setImportFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;

        try {
          if (file.name.endsWith(".json")) {
            const parsed = JSON.parse(text);
            const entries = Array.isArray(parsed) ? parsed : [parsed];
            setImportEntries(
              entries.map((e: any) => ({
                question: e.question || "",
                response: e.response || e.response_text || "",
                date: e.date || e.created_at || "",
                category: e.category || e.categories || "",
              }))
            );
          } else if (file.name.endsWith(".csv")) {
            const lines = text.split("\n").filter((l) => l.trim());
            if (lines.length < 2) {
              setImportError("CSV file must have a header row and at least one data row.");
              return;
            }

            const headers = parseCSVLine(lines[0]).map((h) =>
              h.toLowerCase().trim()
            );
            const responseIdx = headers.indexOf("response");
            const questionIdx = headers.indexOf("question");
            const dateIdx = headers.indexOf("date");
            const categoryIdx = headers.indexOf("category");

            if (responseIdx === -1 && questionIdx === -1) {
              setImportError(
                'CSV must have at least a "response" or "question" column.'
              );
              return;
            }

            const entries: ImportEntry[] = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = parseCSVLine(lines[i]);
              const response = responseIdx >= 0 ? cols[responseIdx] || "" : "";
              if (!response.trim()) continue;

              entries.push({
                question: questionIdx >= 0 ? cols[questionIdx] || "" : "",
                response,
                date: dateIdx >= 0 ? cols[dateIdx] || "" : "",
                category: categoryIdx >= 0 ? cols[categoryIdx] || "" : "",
              });
            }
            setImportEntries(entries);
          } else {
            setImportError("Unsupported file type. Please use .json or .csv files.");
          }
        } catch {
          setImportError("Failed to parse file. Please check the format.");
        }
      };
      reader.readAsText(file);

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  // Simple CSV line parser handling quoted fields
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

  async function handleImport() {
    if (importEntries.length === 0) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const source = importFileName?.endsWith(".csv") ? "csv" : "json";
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: importEntries, source }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error || "Import failed");
        return;
      }

      setImportResult({
        imported: data.imported,
        failed: data.failed,
        total: data.total,
      });
      setImportEntries([]);
      setImportFileName(null);
    } catch {
      setImportError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function clearImport() {
    setImportEntries([]);
    setImportFileName(null);
    setImportError(null);
    setImportResult(null);
  }

  // Account deletion
  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE MY ACCOUNT") return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirm }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account");
        return;
      }

      // Redirect to landing page
      router.push("/");
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-deep-sky hover:text-sky-blue transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>
        <h2 className="text-2xl font-bold text-twilight mb-2">Settings</h2>
        <p className="text-charcoal/60">
          Manage your privacy, data, and account.
        </p>
      </div>

      {/* Privacy */}
      <h3 className="text-lg font-bold text-twilight mb-3">Privacy</h3>
      <Card padding="md" className="mb-8">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            {isDiscoverable ? (
              <Eye className="w-5 h-5 text-deep-sky" />
            ) : (
              <EyeOff className="w-5 h-5 text-charcoal/40" />
            )}
            <div>
              <p className="text-sm font-medium text-charcoal">
                Discoverable Profile
              </p>
              <p className="text-xs text-charcoal/50">
                Allow others to find you and send friend or group invites
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={isDiscoverable}
              onChange={toggleDiscoverable}
              disabled={privacySaving}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-soft-gray rounded-full peer-checked:bg-deep-sky transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
          </div>
        </label>
      </Card>

      {/* Legacy & executor */}
      <h3 className="text-lg font-bold text-twilight mb-3">Legacy</h3>
      <div className="mb-8 space-y-3">
        <DigitalExecutor />
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/memorial"
            className="block p-4 rounded-card bg-white border border-soft-gray hover:border-deep-sky/40 hover:shadow-card transition-all"
          >
            <p className="text-sm font-medium text-twilight">Memorial book</p>
            <p className="text-xs text-charcoal/55 mt-0.5">
              Printable PDF of your entries, organized by category.
            </p>
          </Link>
          <Link
            href="/review"
            className="block p-4 rounded-card bg-white border border-soft-gray hover:border-deep-sky/40 hover:shadow-card transition-all"
          >
            <p className="text-sm font-medium text-twilight">Year in review</p>
            <p className="text-xs text-charcoal/55 mt-0.5">
              The shape of your wisdom this year — stats, people, moments.
            </p>
          </Link>
        </div>
      </div>

      {/* Data Export */}
      <h3 className="text-lg font-bold text-twilight mb-3">Data Export</h3>
      <Card padding="md" className="mb-8">
        <p className="text-sm text-charcoal/60 mb-4">
          Download all your journal entries, including questions, responses,
          categories, and metadata.
        </p>

        {exportSuccess && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            {exportSuccess} export downloaded successfully!
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-charcoal/20 text-charcoal/70 hover:text-charcoal hover:border-charcoal/40"
            onClick={() => handleExport("json")}
            disabled={exportingFormat !== null}
          >
            {exportingFormat === "json" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4 mr-2" />
            )}
            Export as JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-charcoal/20 text-charcoal/70 hover:text-charcoal hover:border-charcoal/40"
            onClick={() => handleExport("csv")}
            disabled={exportingFormat !== null}
          >
            {exportingFormat === "csv" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export as CSV
          </Button>
        </div>
      </Card>

      {/* Import Wisdom */}
      <h3 className="text-lg font-bold text-twilight mb-3">Import Wisdom</h3>
      <Card padding="md" className="mb-8">
        <p className="text-sm text-charcoal/60 mb-4">
          Import journal entries from a JSON or CSV file. Each entry should have
          at least a <code className="text-xs bg-soft-gray px-1 py-0.5 rounded">response</code> field.
          Optional fields: <code className="text-xs bg-soft-gray px-1 py-0.5 rounded">question</code>,{" "}
          <code className="text-xs bg-soft-gray px-1 py-0.5 rounded">date</code>,{" "}
          <code className="text-xs bg-soft-gray px-1 py-0.5 rounded">category</code> (slug).
        </p>

        {importError && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {importError}
          </div>
        )}

        {importResult && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Imported {importResult.imported} of {importResult.total} entries.
            {importResult.failed > 0 && (
              <span className="text-red-600 ml-1">
                {importResult.failed} failed.
              </span>
            )}
          </div>
        )}

        {importEntries.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-soft-gray rounded-xl p-8 text-center cursor-pointer hover:border-deep-sky/40 hover:bg-deep-sky/5 transition-all"
          >
            <Upload className="w-8 h-8 text-charcoal/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-charcoal/60 mb-1">
              Click to select a file
            </p>
            <p className="text-xs text-charcoal/40">
              Accepts .json and .csv files
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-deep-sky" />
                <span className="text-sm font-medium text-charcoal">
                  {importFileName}
                </span>
                <span className="text-xs text-charcoal/50">
                  ({importEntries.length}{" "}
                  {importEntries.length === 1 ? "entry" : "entries"})
                </span>
              </div>
              <button
                onClick={clearImport}
                className="text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="border border-soft-gray rounded-xl overflow-hidden mb-4 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-soft-gray/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-charcoal/60 font-medium">
                      #
                    </th>
                    <th className="text-left px-3 py-2 text-charcoal/60 font-medium">
                      Response
                    </th>
                    <th className="text-left px-3 py-2 text-charcoal/60 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importEntries.slice(0, 10).map((entry, i) => (
                    <tr
                      key={i}
                      className="border-t border-soft-gray/50"
                    >
                      <td className="px-3 py-2 text-charcoal/40">{i + 1}</td>
                      <td className="px-3 py-2 text-charcoal truncate max-w-[300px]">
                        {entry.response.slice(0, 80)}
                        {entry.response.length > 80 ? "..." : ""}
                      </td>
                      <td className="px-3 py-2 text-charcoal/50 whitespace-nowrap">
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importEntries.length > 10 && (
                <p className="text-xs text-charcoal/40 text-center py-2 bg-soft-gray/30">
                  ...and {importEntries.length - 10} more
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import {importEntries.length}{" "}
              {importEntries.length === 1 ? "Entry" : "Entries"}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {/* Danger Zone */}
      <h3 className="text-lg font-bold text-error mb-3">Danger Zone</h3>
      <Card
        padding="md"
        className="mb-8 border-2 border-red-200"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-charcoal">
              Delete Your Account
            </p>
            <p className="text-xs text-charcoal/50 mt-1">
              This action will permanently delete your account and all
              associated data, including journal entries, groups, and settings.
              This cannot be undone.
            </p>
          </div>
        </div>

        {deleteError && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {deleteError}
          </div>
        )}

        <div className="space-y-3">
          <Input
            variant="light"
            label='Type "DELETE MY ACCOUNT" to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            className="font-mono"
          />

          <Button
            variant="ghost"
            size="sm"
            className="text-error hover:bg-error/10 hover:text-error border border-red-200 hover:border-error/40"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE MY ACCOUNT" || deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Permanently Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
