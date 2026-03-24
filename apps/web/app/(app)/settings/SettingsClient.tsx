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
  Shield,
  Plus,
  UserCheck,
  XCircle,
  Heart,
  Crown,
  Mail,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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

  // Access grants
  const [grants, setGrants] = useState<{ given: any[]; received: any[] }>({
    given: [],
    received: [],
  });
  const [grantsLoaded, setGrantsLoaded] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantLevel, setGrantLevel] = useState<"query" | "read">("query");
  const [grantMessage, setGrantMessage] = useState("");
  const [grantSaving, setGrantSaving] = useState(false);

  // Legacy contacts
  const [legacyContacts, setLegacyContacts] = useState<any[]>([]);
  const [legacyLoaded, setLegacyLoaded] = useState(false);
  const [legacyEmail, setLegacyEmail] = useState("");
  const [legacyName, setLegacyName] = useState("");
  const [legacyRelationship, setLegacyRelationship] = useState("spouse");
  const [legacyMessage, setLegacyMessage] = useState("");
  const [legacyPrimary, setLegacyPrimary] = useState(false);
  const [legacySaving, setLegacySaving] = useState(false);
  const [legacyError, setLegacyError] = useState<string | null>(null);
  const [removingLegacy, setRemovingLegacy] = useState<string | null>(null);

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

  // Access grants
  async function loadGrants() {
    if (grantsLoaded) return;
    try {
      const res = await fetch("/api/access-grants");
      if (res.ok) {
        const data = await res.json();
        setGrants(data);
      }
    } catch {
      // ignore
    }
    setGrantsLoaded(true);
  }

  async function createGrant() {
    if (!grantEmail.trim()) return;
    setGrantSaving(true);
    try {
      const res = await fetch("/api/access-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantee_email: grantEmail.trim(),
          access_level: grantLevel,
          personal_message: grantMessage.trim() || null,
        }),
      });
      if (res.ok) {
        setGrantEmail("");
        setGrantMessage("");
        setGrantsLoaded(false);
        loadGrants();
      }
    } catch {
      // ignore
    } finally {
      setGrantSaving(false);
    }
  }

  async function revokeGrant(id: string) {
    try {
      await fetch(`/api/access-grants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      setGrants((prev) => ({
        ...prev,
        given: prev.given.filter((g) => g.id !== id),
        received: prev.received.filter((g) => g.id !== id),
      }));
    } catch {
      // ignore
    }
  }

  async function acceptGrant(id: string) {
    try {
      await fetch(`/api/access-grants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      setGrants((prev) => ({
        ...prev,
        received: prev.received.map((g) =>
          g.id === id ? { ...g, status: "active" } : g
        ),
      }));
    } catch {
      // ignore
    }
  }

  // Legacy contacts
  async function loadLegacyContacts() {
    if (legacyLoaded) return;
    try {
      const res = await fetch("/api/legacy");
      if (res.ok) {
        const data = await res.json();
        setLegacyContacts(data.contacts || []);
      }
    } catch {
      // ignore
    }
    setLegacyLoaded(true);
  }

  async function addLegacyContact() {
    if (!legacyEmail.trim() || !legacyName.trim()) return;
    setLegacySaving(true);
    setLegacyError(null);
    try {
      const res = await fetch("/api/legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: legacyName.trim(),
          contact_email: legacyEmail.trim(),
          relationship: legacyRelationship,
          message: legacyMessage.trim() || null,
          is_primary: legacyPrimary,
        }),
      });
      if (res.ok) {
        setLegacyEmail("");
        setLegacyName("");
        setLegacyMessage("");
        setLegacyPrimary(false);
        setLegacyRelationship("spouse");
        setLegacyLoaded(false);
        loadLegacyContacts();
      } else {
        const data = await res.json();
        setLegacyError(data.error || "Failed to add contact");
      }
    } catch {
      setLegacyError("Failed to add contact. Please try again.");
    } finally {
      setLegacySaving(false);
    }
  }

  async function removeLegacyContact(id: string) {
    setRemovingLegacy(id);
    try {
      await fetch(`/api/legacy/${id}`, { method: "DELETE" });
      setLegacyContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    } finally {
      setRemovingLegacy(null);
    }
  }

  async function toggleLegacyPrimaryHeir(id: string, currentPrimary: boolean) {
    try {
      await fetch(`/api/legacy/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: !currentPrimary }),
      });
      setLegacyLoaded(false);
      loadLegacyContacts();
    } catch {
      // ignore
    }
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

      {/* Access Grants */}
      <h3 className="text-lg font-bold text-twilight mb-3">Access Grants</h3>
      <Card padding="md" className="mb-8">
        <p className="text-sm text-charcoal/60 mb-4">
          Grant others permission to query your wisdom or read your journal entries.
          They will receive an email invitation.
        </p>

        {/* Grant form */}
        <div className="space-y-3 mb-4 p-4 bg-soft-gray/30 rounded-xl">
          <Input
            variant="light"
            label="Recipient email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="friend@example.com"
          />
          <div className="flex items-center gap-4">
            <label className="text-sm text-charcoal/70">Access level:</label>
            <select
              value={grantLevel}
              onChange={(e) => setGrantLevel(e.target.value as "query" | "read")}
              className="text-sm border border-soft-gray rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="query">Query (ask questions)</option>
              <option value="read">Read (see responses)</option>
            </select>
          </div>
          <Input
            variant="light"
            label="Personal message (optional)"
            value={grantMessage}
            onChange={(e) => setGrantMessage(e.target.value)}
            placeholder="I'd like to share my wisdom with you..."
          />
          <Button
            variant="primary"
            size="sm"
            onClick={createGrant}
            disabled={!grantEmail.trim() || grantSaving}
          >
            {grantSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Send Invitation
          </Button>
        </div>

        {/* Load and display existing grants */}
        {!grantsLoaded ? (
          <button
            onClick={loadGrants}
            className="text-sm text-deep-sky hover:text-deep-sky/80 transition-colors"
          >
            <Shield className="w-4 h-4 inline mr-1" />
            Load existing grants
          </button>
        ) : (
          <div className="space-y-4">
            {grants.given.length > 0 && (
              <div>
                <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wide mb-2">
                  Grants You&apos;ve Given
                </p>
                <div className="space-y-2">
                  {grants.given.map((g: any) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3 bg-soft-gray/30 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {g.grantee?.full_name || g.grantee_email || "Unknown"}
                        </p>
                        <p className="text-xs text-charcoal/50">
                          {g.access_level} access ·{" "}
                          <span
                            className={
                              g.status === "active"
                                ? "text-green-600"
                                : "text-golden-hour"
                            }
                          >
                            {g.status}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => revokeGrant(g.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        title="Revoke access"
                      >
                        <XCircle className="w-4 h-4 text-charcoal/30 hover:text-error" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {grants.received.length > 0 && (
              <div>
                <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wide mb-2">
                  Access Granted to You
                </p>
                <div className="space-y-2">
                  {grants.received.map((g: any) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3 bg-soft-gray/30 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {g.grantor?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-charcoal/50">
                          {g.access_level} access ·{" "}
                          <span
                            className={
                              g.status === "active"
                                ? "text-green-600"
                                : "text-golden-hour"
                            }
                          >
                            {g.status}
                          </span>
                        </p>
                      </div>
                      {g.status === "pending" && (
                        <button
                          onClick={() => acceptGrant(g.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-deep-sky/10 text-deep-sky hover:bg-deep-sky/20 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {grants.given.length === 0 && grants.received.length === 0 && (
              <p className="text-sm text-charcoal/40 text-center py-2">
                No access grants yet
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Legacy & Inheritance */}
      <h3 className="text-lg font-bold text-twilight mb-3">Legacy &amp; Inheritance</h3>
      <Card padding="md" className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <Heart className="w-5 h-5 text-deep-sky flex-shrink-0 mt-0.5" />
          <p className="text-sm text-charcoal/60">
            Choose who will inherit access to your wisdom journal. They&apos;ll be
            able to read your entries and ask questions of your captured wisdom.
          </p>
        </div>

        {/* Add Legacy Contact form */}
        <div className="space-y-3 mb-4 p-4 bg-soft-gray/30 rounded-xl">
          <Input
            variant="light"
            label="Contact name"
            value={legacyName}
            onChange={(e) => setLegacyName(e.target.value)}
            placeholder="Jane Doe"
          />
          <Input
            variant="light"
            label="Contact email"
            value={legacyEmail}
            onChange={(e) => setLegacyEmail(e.target.value)}
            placeholder="jane@example.com"
          />
          <div className="flex items-center gap-4">
            <label className="text-sm text-charcoal/70">Relationship:</label>
            <select
              value={legacyRelationship}
              onChange={(e) => setLegacyRelationship(e.target.value)}
              className="text-sm border border-soft-gray rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            variant="light"
            label="Personal message (optional)"
            value={legacyMessage}
            onChange={(e) => setLegacyMessage(e.target.value)}
            placeholder="A message for when they receive access..."
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={legacyPrimary}
              onChange={(e) => setLegacyPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-soft-gray text-deep-sky focus:ring-deep-sky"
            />
            <span className="text-sm text-charcoal/70">
              Designate as primary heir
            </span>
            <Crown className="w-3.5 h-3.5 text-golden-hour" />
          </label>

          {legacyError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {legacyError}
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={addLegacyContact}
            disabled={!legacyEmail.trim() || !legacyName.trim() || legacySaving}
          >
            {legacySaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Legacy Contact
          </Button>
        </div>

        {/* Existing legacy contacts */}
        {!legacyLoaded ? (
          <button
            onClick={loadLegacyContacts}
            className="text-sm text-deep-sky hover:text-deep-sky/80 transition-colors"
          >
            <Heart className="w-4 h-4 inline mr-1" />
            Load your legacy contacts
          </button>
        ) : legacyContacts.length === 0 ? (
          <p className="text-sm text-charcoal/40 text-center py-2">
            No legacy contacts yet
          </p>
        ) : (
          <div>
            <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wide mb-2">
              Your Legacy Contacts
            </p>
            <div className="space-y-2">
              {legacyContacts.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-soft-gray/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-deep-sky/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-deep-sky" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-charcoal flex items-center gap-1.5">
                        {c.contact_name}
                        {c.is_primary && (
                          <Crown className="w-3.5 h-3.5 text-golden-hour" />
                        )}
                      </p>
                      <p className="text-xs text-charcoal/50">
                        {c.contact_email} &middot;{" "}
                        <span className="capitalize">{c.relationship || "other"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLegacyPrimaryHeir(c.id, c.is_primary)}
                      className={`p-1.5 rounded transition-colors ${
                        c.is_primary
                          ? "bg-golden-hour/10 text-golden-hour"
                          : "text-charcoal/30 hover:text-golden-hour hover:bg-golden-hour/10"
                      }`}
                      title={c.is_primary ? "Remove primary heir" : "Set as primary heir"}
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${c.contact_name} as a legacy contact?`)) {
                          removeLegacyContact(c.id);
                        }
                      }}
                      disabled={removingLegacy === c.id}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove contact"
                    >
                      {removingLegacy === c.id ? (
                        <Loader2 className="w-4 h-4 text-charcoal/30 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 text-charcoal/30 hover:text-error" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
