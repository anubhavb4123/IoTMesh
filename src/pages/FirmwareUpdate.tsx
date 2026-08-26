import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  CloudUpload,
  Cpu,
  ArrowUpCircle,
  History,
  Shield,
  AlertTriangle,
  Zap,
  Info,
  Github,
  ExternalLink,
} from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, set, push, get, remove } from "firebase/database";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

// ── Backend API URL (set VITE_BACKEND_URL in .env) ──
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// ── Supported board types ──
const BOARD_OPTIONS = ["ESP32", "ESP8266"] as const;
type BoardType = (typeof BOARD_OPTIONS)[number];

// ── Types ──
interface FirmwareRecord {
  id: string;
  fileName: string;
  fileSize: number;
  version: string;
  notes: string;
  board?: BoardType;
  uploadedAt: number;
  uploadedBy: string;
  status: "pending" | "deployed" | "failed" | "rolled_back";
  /** GitHub CDN direct download URL (new system) */
  firmwareUrl?: string;
}

/** Shape of the ota/latest Firebase node written by the backend */
interface OtaLatest {
  version: string;
  firmware_url: string;
  board: BoardType;
  release_notes: string;
  uploaded_at: number;
}

// ── Helpers ──
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ══════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════
export default function FirmwareUpdate() {
  const { role } = useAuth();

  // ── Form state ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion]           = useState("");
  const [notes, setNotes]               = useState("");
  const [board, setBoard]               = useState<BoardType>("ESP32");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload state ──
  const [uploading, setUploading]             = useState(false);
  const [uploadProgress, setUploadProgress]   = useState(0);
  const [uploadStep, setUploadStep]           = useState("");
  const [dragActive, setDragActive]           = useState(false);

  // ── Confirm dialog ──
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Firebase: firmware history ──
  const [firmwareHistory, setFirmwareHistory] = useState<FirmwareRecord[]>([]);

  // ── Firebase: ota/latest (new GitHub-backed node) ──
  const [otaLatest, setOtaLatest] = useState<OtaLatest | null>(null);

  // ── Firebase: ota/current (legacy trigger node — preserved for ESP compat) ──
  const [otaStatus, setOtaStatus] = useState<{
    active: boolean;
    version?: string;
    url?: string;
    timestamp?: number;
  } | null>(null);

  // ── Listen to firmware history ──
  useEffect(() => {
    const unsub = onValue(
      ref(database, "ota/history"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const list: FirmwareRecord[] = Object.keys(data)
            .map((id) => ({ id, ...data[id] }))
            .sort((a, b) => b.uploadedAt - a.uploadedAt);
          setFirmwareHistory(list);
        } else {
          setFirmwareHistory([]);
        }
      },
      (error) => {
        console.error("Failed to listen to ota/history:", error);
      }
    );
    return () => unsub();
  }, []);

  // ── Listen to ota/latest ──
  useEffect(() => {
    const unsub = onValue(
      ref(database, "ota/latest"),
      (snap) => setOtaLatest(snap.exists() ? (snap.val() as OtaLatest) : null),
      (error) => console.error("Failed to listen to ota/latest:", error)
    );
    return () => unsub();
  }, []);

  // ── Listen to ota/current (legacy) ──
  useEffect(() => {
    const unsub = onValue(
      ref(database, "ota/current"),
      (snap) => setOtaStatus(snap.exists() ? snap.val() : null),
      (error) => console.error("Failed to listen to ota/current:", error)
    );
    return () => unsub();
  }, []);

  // ── Drag & drop handlers ──
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) validateAndSetFile(files[0]);
  }, []);

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith(".bin")) {
      toast.error("Only .bin firmware files are accepted", {
        description: "Please select a valid firmware binary file.",
      });
      sounds.error();
      haptic.error();
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum firmware size is 16 MB.",
      });
      sounds.error();
      haptic.error();
      return;
    }
    setSelectedFile(file);
    sounds.click();
    haptic.light();
    toast.success(`Selected: ${file.name}`, {
      description: formatBytes(file.size),
      className: "toast-success",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  // ── Upload firmware via backend API ──
  const handleUpload = async () => {
    if (!selectedFile || !version.trim()) return;
    setConfirmOpen(false);
    setUploading(true);
    setUploadProgress(0);
    setUploadStep("Preparing upload...");

    const userName =
      JSON.parse(localStorage.getItem("mock_user") || "{}")?.name || "Unknown";

    try {
      // Step 1 — Build multipart FormData
      setUploadProgress(10);
      setUploadStep("Building request...");

      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
      formData.append("version", version.trim());
      formData.append("board", board);
      formData.append("notes", notes.trim());
      formData.append("uploadedBy", userName);

      // Step 2 — POST to backend
      setUploadProgress(25);
      setUploadStep("Uploading to server...");

      const response = await fetch(`${BACKEND_URL}/api/firmware/upload`, {
        method: "POST",
        body: formData,
        // Note: Do NOT set Content-Type header — browser sets it with boundary automatically
      });

      setUploadProgress(65);
      setUploadStep("Processing GitHub release...");

      // Step 3 — Parse response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setUploadProgress(100);
      setUploadStep("Complete!");

      // Step 5 — Success
      sounds.complete();
      haptic.complete();
      toast.success("Firmware uploaded & OTA triggered!", {
        description: `v${data.version} (${data.board}) published to GitHub & Firebase.`,
        className: "toast-success",
      });

      // Reset form
      setSelectedFile(null);
      setVersion("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Firmware upload failed:", error);
      sounds.error();
      haptic.error();
      toast.error("Upload failed", {
        description: error.message || "Check console for details.",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStep("");
    }
  };

  // ── Delete firmware record (metadata + history only; GitHub release stays) ──
  const handleDelete = async (record: FirmwareRecord) => {
    if (role !== "admin") return;
    if (
      !window.confirm(
        `Delete record for "${record.fileName}" (v${record.version})?\n\nNote: The GitHub Release will NOT be deleted.`
      )
    )
      return;

    try {
      // Remove from history
      await remove(ref(database, `ota/history/${record.id}`));

      // Also remove legacy base64 bin if it exists (old system cleanup)
      const binSnap = await get(ref(database, `ota/bins/${record.id}`));
      if (binSnap.exists()) {
        await remove(ref(database, `ota/bins/${record.id}`));
      }

      // If this was the current OTA trigger, clear it
      const currentSnap = await get(ref(database, "ota/current"));
      if (currentSnap.exists()) {
        const current = currentSnap.val();
        if (current.recordId === record.id || current.version === record.version) {
          await set(ref(database, "ota/current"), null);
        }
      }

      sounds.delete?.() ?? sounds.click();
      haptic.medium();
      toast.success("Firmware record deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      sounds.error();
      toast.error("Failed to delete firmware record");
    }
  };

  // ── Re-trigger OTA for an existing history record ──
  const handleRedeploy = async (fw: FirmwareRecord) => {
    try {
      // Use GitHub URL if available (new system), fallback to legacy RTDB URL
      const firmwareUrl = fw.firmwareUrl || "";

      // Update ota/latest (new system)
      if (firmwareUrl) {
        await set(ref(database, "ota/latest"), {
          version:       fw.version,
          firmware_url:  firmwareUrl,
          board:         fw.board || "ESP32",
          release_notes: fw.notes || "",
          uploaded_at:   Date.now(),
        });
      }

      // Update ota/current (legacy trigger — always written)
      await set(ref(database, "ota/current"), {
        active:    true,
        version:   fw.version,
        url:       firmwareUrl,
        recordId:  fw.id,
        fileName:  fw.fileName,
        fileSize:  fw.fileSize,
        timestamp: Date.now(),
        board:     fw.board || "ESP32",
      });

      sounds.success?.() ?? sounds.click();
      haptic.medium();
      toast.success(`Re-triggered OTA v${fw.version}`, { className: "toast-success" });
    } catch (error) {
      console.error("Redeploy failed:", error);
      sounds.error();
      toast.error("Failed to re-trigger OTA");
    }
  };

  // ── Cancel active OTA ──
  const handleCancelOta = async () => {
    if (!window.confirm("Cancel the active OTA update?")) return;
    await set(ref(database, "ota/current"), null);
    sounds.click();
    haptic.medium();
    toast.success("OTA update cancelled");
  };

  // ── Status badge ──
  const getStatusBadge = (status: FirmwareRecord["status"]) => {
    const map = {
      pending:     { label: "Pending",     class: "ota-badge-pending",  icon: Clock        },
      deployed:    { label: "Deployed",    class: "ota-badge-deployed", icon: CheckCircle2 },
      failed:      { label: "Failed",      class: "ota-badge-failed",   icon: XCircle      },
      rolled_back: { label: "Rolled Back", class: "ota-badge-rollback", icon: History      },
    };
    const cfg  = map[status] || map.pending;
    const Icon = cfg.icon;
    return (
      <Badge variant="outline" className={cfg.class}>
        <Icon className="h-3 w-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div
        className="space-y-6"
        style={{ animation: "otaFadeIn 0.4s ease both" }}
      >
        {/* ── Header ── */}
        <div style={{ animation: "otaFadeIn 0.4s ease both" }}>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
            <Cpu className="h-8 w-8 text-white" />
            Firmware Update
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload .bin firmware — published to GitHub Releases &amp; deployed via OTA
          </p>
        </div>

        {/* ── Admin Warning Banner ── */}
        <div
          className="ota-warning-banner"
          style={{ animation: "otaFadeIn 0.4s ease both", animationDelay: "0.05s" }}
        >
          <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              <strong>Admin access required.</strong> Uploading firmware publishes a{" "}
              <strong>GitHub Release</strong> and triggers OTA on all connected IoTMesh
              devices. Ensure the binary is tested before deploying.
            </p>
          </div>
        </div>

        {/* ── Latest Deployed Firmware (ota/latest) ── */}
        {otaLatest && (
          <Card
            className="ota-latest-card"
            style={{ animation: "otaFadeIn 0.4s ease both", animationDelay: "0.07s" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 p-5">
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 text-white" />
                <div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    Latest Deployed Firmware
                    <Badge variant="outline" className="ota-badge-deployed text-xs">
                      v{otaLatest.version}
                    </Badge>
                    <Badge variant="outline" className="ota-badge-board text-xs">
                      {otaLatest.board}
                    </Badge>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">
                    {otaLatest.release_notes && (
                      <span className="mr-2">{otaLatest.release_notes}</span>
                    )}
                    {otaLatest.uploaded_at &&
                      `Deployed ${formatDate(otaLatest.uploaded_at)}`}
                  </p>
                </div>
              </div>
              {otaLatest.firmware_url && (
                <a
                  href={otaLatest.firmware_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ota-btn-github"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  GitHub Release
                </a>
              )}
            </div>
          </Card>
        )}

        {/* ── Active OTA Status (ota/current) ── */}
        {otaStatus?.active && (
          <Card
            className="ota-active-card"
            style={{ animation: "otaFadeIn 0.4s ease both", animationDelay: "0.08s" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="ota-pulse-dot" />
                <div>
                  <p className="text-white font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    OTA Update Active
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    Version{" "}
                    <span className="text-primary font-mono">{otaStatus.version}</span>
                    {otaStatus.timestamp &&
                      ` • Triggered ${formatDate(otaStatus.timestamp)}`}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ota-btn-cancel"
                onClick={handleCancelOta}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel OTA
              </Button>
            </div>
          </Card>
        )}

        {/* ── Upload Section ── */}
        <Card
          className="ota-upload-card"
          style={{ animation: "otaFadeIn 0.4s ease both", animationDelay: "0.1s" }}
        >
          <div className="p-6 space-y-5">
            {/* Section Title */}
            <div className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Upload Firmware</h2>
              <Badge variant="outline" className="ota-badge-github ml-auto text-xs">
                <Github className="h-3 w-3 mr-1" />
                Published to GitHub Releases
              </Badge>
            </div>

            {/* Drop Zone */}
            <div
              className={`ota-dropzone ${dragActive ? "ota-dropzone-active" : ""} ${selectedFile ? "ota-dropzone-selected" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".bin"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileCode2 className="h-10 w-10 text-emerald-400" />
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/40 text-xs">{formatBytes(selectedFile.size)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/50 hover:text-white mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload
                    className={`h-10 w-10 ${dragActive ? "text-primary" : "text-white/30"} transition-colors`}
                  />
                  <p className="text-white/60 text-sm">
                    Drag &amp; drop your{" "}
                    <span className="text-primary font-mono">.bin</span> file here
                  </p>
                  <p className="text-white/30 text-xs">
                    or click to browse • Max 16 MB
                  </p>
                </div>
              )}
            </div>

            {/* Version, Board & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Firmware Version */}
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">
                  Firmware Version *
                </Label>
                <Input
                  placeholder="e.g. 2.1.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="ota-input"
                />
              </div>

              {/* Target Board */}
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">
                  Target Board *
                </Label>
                <div className="flex gap-2">
                  {BOARD_OPTIONS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBoard(b)}
                      className={`ota-board-btn ${board === b ? "ota-board-btn-active" : ""}`}
                    >
                      <Cpu className="h-3.5 w-3.5 mr-1.5" />
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Release Notes */}
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-medium">
                  Release Notes
                </Label>
                <Input
                  placeholder="e.g. Fixed sensor drift, added BLE"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="ota-input"
                />
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2" style={{ animation: "otaSlideUp 0.3s ease both" }}>
                <div className="flex justify-between text-xs text-white/50">
                  <span>{uploadStep}</span>
                  <span className="font-mono text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="ota-progress" />
                <div className="text-xs text-white/30 text-center">
                  Uploading to GitHub Releases → updating Firebase...
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!selectedFile || !version.trim() || uploading}
              className="w-full ota-btn-upload"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="ota-btn-spinner" />
                  {uploadStep || "Uploading..."}
                </span>
              ) : (
                <>
                  <ArrowUpCircle className="h-5 w-5 mr-2" />
                  Upload &amp; Deploy OTA
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* ── Firmware History ── */}
        <Card
          className="ota-history-card"
          style={{ animation: "otaFadeIn 0.4s ease both", animationDelay: "0.17s" }}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              Firmware History
              <Badge variant="outline" className="ml-2 text-white/40 border-white/10">
                {firmwareHistory.length}
              </Badge>
            </h2>

            {firmwareHistory.length === 0 ? (
              <div className="ota-empty-state">
                <FileCode2 className="h-12 w-12 text-white/10" />
                <p className="text-white/30 text-sm mt-3">No firmware uploads yet</p>
                <p className="text-white/15 text-xs mt-1">
                  Upload your first .bin file above to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-white/40">Version</TableHead>
                      <TableHead className="text-white/40">File</TableHead>
                      <TableHead className="text-white/40">Board</TableHead>
                      <TableHead className="text-white/40">Size</TableHead>
                      <TableHead className="text-white/40">Status</TableHead>
                      <TableHead className="text-white/40">Uploaded By</TableHead>
                      <TableHead className="text-white/40">Date</TableHead>
                      <TableHead className="text-white/40 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firmwareHistory.map((fw, i) => (
                      <TableRow
                        key={fw.id}
                        className="border-white/5 transition-colors hover:bg-white/5"
                        style={{
                          animation: "otaFadeIn 0.3s ease both",
                          animationDelay: `${0.02 * i}s`,
                        }}
                      >
                        <TableCell>
                          <span className="font-mono text-primary text-sm font-semibold">
                            v{fw.version}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-white/70 text-sm flex items-center gap-1.5">
                            <FileCode2 className="h-3.5 w-3.5 text-white/30" />
                            {fw.fileName}
                          </span>
                          {fw.notes && (
                            <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              {fw.notes}
                            </p>
                          )}
                          {fw.firmwareUrl && (
                            <a
                              href={fw.firmwareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary/50 hover:text-primary text-xs flex items-center gap-1 mt-0.5 transition-colors"
                            >
                              <Github className="h-3 w-3" />
                              GitHub
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {fw.board ? (
                            <Badge variant="outline" className="ota-badge-board text-xs">
                              {fw.board}
                            </Badge>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white/50 text-sm font-mono">
                          {formatBytes(fw.fileSize)}
                        </TableCell>
                        <TableCell>{getStatusBadge(fw.status)}</TableCell>
                        <TableCell className="text-white/50 text-sm">
                          {fw.uploadedBy}
                        </TableCell>
                        <TableCell className="text-white/40 text-sm">
                          {formatDate(fw.uploadedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ota-btn-redeploy"
                              title="Re-trigger OTA"
                              onClick={() => handleRedeploy(fw)}
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                            </Button>
                            <Trash2
                              onClick={() => handleDelete(fw)}
                              className="h-4.5 w-4.5 text-red-500/60 cursor-pointer hover:text-red-400 transition-colors"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Confirm Upload Dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="ota-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Confirm OTA Deployment
            </DialogTitle>
            <DialogDescription className="text-white/50">
              This will publish a GitHub Release and push a firmware update to all
              connected IoTMesh devices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Summary */}
            <div className="ota-confirm-summary">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">File</span>
                <span className="text-white text-sm font-mono">{selectedFile?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Size</span>
                <span className="text-white text-sm font-mono">
                  {selectedFile && formatBytes(selectedFile.size)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Version</span>
                <span className="text-primary text-sm font-mono font-semibold">v{version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Board</span>
                <Badge variant="outline" className="ota-badge-board text-xs">
                  {board}
                </Badge>
              </div>
              {notes && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Notes</span>
                  <span className="text-white/70 text-sm">{notes}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Destination</span>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <Github className="h-3 w-3" /> GitHub Releases + Firebase
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="ota-confirm-warning">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200/70">
                Devices will automatically download and flash this firmware from GitHub.
                Ensure the binary is stable and tested.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleUpload} className="flex-1 ota-btn-confirm">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Deploy Now
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                className="ota-btn-outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{otaStyles}</style>
    </Layout>
  );
}

// ══════════════════════════════════════════════════════
//  Styles
// ══════════════════════════════════════════════════════
const otaStyles = `
  /* ── Animations ── */
  @keyframes otaFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes otaSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes otaPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.5; transform: scale(1.3); }
  }

  @keyframes otaSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Warning Banner ── */
  .ota-warning-banner {
    display: flex;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.03));
    border: 1px solid rgba(245, 158, 11, 0.15);
    backdrop-filter: blur(8px);
  }

  /* ── Latest firmware card (GitHub-backed) ── */
  .ota-latest-card {
    border: 1px solid rgba(0, 212, 255, 0.2) !important;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(6, 78, 59, 0.03)) !important;
    box-shadow: 0 0 24px rgba(0, 212, 255, 0.05);
  }

  /* ── Active OTA Card ── */
  .ota-active-card {
    border: 1px solid rgba(16, 185, 129, 0.2) !important;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 78, 59, 0.05)) !important;
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.08);
  }

  .ota-pulse-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10b981;
    animation: otaPulse 2s ease-in-out infinite;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
  }

  .ota-btn-cancel {
    border-color: rgba(239, 68, 68, 0.3) !important;
    color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.08) !important;
    transition: all 0.2s;
  }
  .ota-btn-cancel:hover {
    background: rgba(239, 68, 68, 0.15) !important;
    border-color: rgba(239, 68, 68, 0.5) !important;
  }

  /* ── GitHub link button ── */
  .ota-btn-github {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(0, 212, 255, 0.8);
    border: 1px solid rgba(0, 212, 255, 0.2);
    background: rgba(0, 212, 255, 0.06);
    text-decoration: none;
    transition: all 0.2s;
  }
  .ota-btn-github:hover {
    color: #00d4ff;
    background: rgba(0, 212, 255, 0.12);
    border-color: rgba(0, 212, 255, 0.4);
  }

  /* ── GitHub badge in upload header ── */
  .ota-badge-github {
    background: rgba(0, 212, 255, 0.07) !important;
    border-color: rgba(0, 212, 255, 0.2) !important;
    color: rgba(0, 212, 255, 0.7) !important;
  }

  /* ── Board badge ── */
  .ota-badge-board {
    background: rgba(139, 92, 246, 0.1) !important;
    border-color: rgba(139, 92, 246, 0.25) !important;
    color: #c4b5fd !important;
  }

  /* ── Upload Card ── */
  .ota-upload-card {
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(12px);
  }

  /* ── Drop Zone ── */
  .ota-dropzone {
    border: 2px dashed rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.01);
  }
  .ota-dropzone:hover {
    border-color: rgba(0, 212, 255, 0.3);
    background: rgba(0, 212, 255, 0.03);
  }
  .ota-dropzone-active {
    border-color: rgba(0, 212, 255, 0.5) !important;
    background: rgba(0, 212, 255, 0.06) !important;
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.08);
  }
  .ota-dropzone-selected {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.03);
  }

  /* ── Input ── */
  .ota-input {
    background: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: white !important;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  .ota-input:focus {
    border-color: rgba(0, 212, 255, 0.4) !important;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.1) !important;
  }
  .ota-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  /* ── Board selector buttons ── */
  .ota-board-btn {
    display: inline-flex;
    align-items: center;
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.2s;
  }
  .ota-board-btn:hover {
    border-color: rgba(139, 92, 246, 0.3);
    color: rgba(196, 181, 253, 0.8);
  }
  .ota-board-btn-active {
    border-color: rgba(139, 92, 246, 0.5) !important;
    background: rgba(139, 92, 246, 0.12) !important;
    color: #c4b5fd !important;
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.1);
  }

  /* ── Progress ── */
  .ota-progress {
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }
  .ota-progress > div {
    background: linear-gradient(90deg, #ffffff, #a3a3a3) !important;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  /* ── Upload Button ── */
  .ota-btn-upload {
    background: #ffffff !important;
    color: #000000 !important;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 12px 24px;
    border-radius: 12px;
    border: none !important;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
  }
  .ota-btn-upload:hover:not(:disabled) {
    background: #e5e5e5 !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(255, 255, 255, 0.25);
  }
  .ota-btn-upload:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Spinner ── */
  .ota-btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000000;
    border-radius: 50%;
    animation: otaSpin 0.6s linear infinite;
  }

  .ota-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: otaSpin 0.8s linear infinite;
  }

  /* ── History Card ── */
  .ota-history-card {
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(12px);
  }

  .ota-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  /* ── Status Badges ── */
  .ota-badge-pending {
    background: rgba(245, 158, 11, 0.1) !important;
    border-color: rgba(245, 158, 11, 0.25) !important;
    color: #fbbf24 !important;
  }
  .ota-badge-deployed {
    background: rgba(16, 185, 129, 0.1) !important;
    border-color: rgba(16, 185, 129, 0.25) !important;
    color: #34d399 !important;
  }
  .ota-badge-failed {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.25) !important;
    color: #f87171 !important;
  }
  .ota-badge-rollback {
    background: rgba(139, 92, 246, 0.1) !important;
    border-color: rgba(139, 92, 246, 0.25) !important;
    color: #a78bfa !important;
  }

  /* ── Redeploy Button ── */
  .ota-btn-redeploy {
    color: rgba(255, 255, 255, 0.7) !important;
    transition: all 0.2s;
  }
  .ota-btn-redeploy:hover {
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* ── Confirm Dialog ── */
  .ota-confirm-dialog {
    background: rgba(15, 23, 42, 0.97) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(20px);
    border-radius: 16px !important;
  }

  .ota-confirm-summary {
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ota-confirm-warning {
    display: flex;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.12);
  }

  .ota-btn-confirm {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    color: white !important;
    font-weight: 600;
    border: none !important;
    border-radius: 10px;
    transition: all 0.2s;
  }
  .ota-btn-confirm:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
  }

  .ota-btn-outline {
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.5) !important;
    background: transparent !important;
    border-radius: 10px;
    transition: all 0.2s;
  }
  .ota-btn-outline:hover {
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: white !important;
  }
`;
