"use client";

import { useState, useRef, useCallback } from "react";
import { PRINT_FORMATS, FitMode } from "@/lib/formats";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "jfif"].includes(ext || "");
    });
    setFiles((prev) => [...prev, ...validFiles]);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    setError(null);
    setDone(false);
    setProgress(0);

    if (files.length === 0) {
      setError("Please upload at least one image.");
      return;
    }
    if (selectedFormats.length === 0) {
      setError("Please select at least one print format.");
      return;
    }

    setProcessing(true);
    setProgress(15);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("formats", JSON.stringify(selectedFormats));
      formData.append("fitMode", fitMode);
      formData.append("bgColor", bgColor);

      setProgress(30);

      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      setProgress(85);

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Processing failed.");
        setProcessing(false);
        return;
      }

      // Download the ZIP directly
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "print-formats.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setSelectedFormats([]);
    setFitMode("contain");
    setBgColor("#FFFFFF");
    setDone(false);
    setError(null);
    setProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Image Converter
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Upload images and convert them to print-ready formats. Results are downloaded as a single ZIP.
        </p>
      </div>

      {/* Upload Zone */}
      <section
        className={`drop-zone p-8 text-center cursor-pointer ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.jfif"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <svg
            width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--text-muted)" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Drop images here or click to browse
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Supports JPG, PNG, JFIF • Max 50 MB per file
            </p>
          </div>
        </div>
      </section>

      {/* File List */}
      {files.length > 0 && (
        <section
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Uploaded Files ({files.length})
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-xs px-2 py-1 rounded-md transition-colors"
              style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}
            >
              Clear All
            </button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent)", flexShrink: 0 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>({formatFileSize(file.size)})</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="ml-2 hover:opacity-80 transition-opacity"
                  style={{ color: "var(--error)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Settings */}
      <section
        className="rounded-xl p-5 space-y-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Settings
        </h3>

        {/* Format Selection */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Print Formats
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRINT_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => toggleFormat(format.id)}
                className="p-3 rounded-lg text-left transition-all duration-200"
                style={{
                  background: selectedFormats.includes(format.id) ? "var(--accent-glow)" : "var(--bg-secondary)",
                  border: `1px solid ${selectedFormats.includes(format.id) ? "var(--accent)" : "var(--border-color)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: selectedFormats.includes(format.id) ? "var(--accent)" : "var(--border-accent)",
                      background: selectedFormats.includes(format.id) ? "var(--accent)" : "transparent",
                    }}
                  >
                    {selectedFormats.includes(format.id) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    {format.label}
                  </span>
                </div>
                <p className="text-xs mt-1 ml-6" style={{ color: "var(--text-muted)" }}>
                  {format.width} × {format.height} px
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Fit Mode */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Fit Mode
          </label>
          <div className="flex gap-3">
            {[
              { value: "contain" as FitMode, label: "Contain", desc: "Fit with background fill" },
              { value: "cover" as FitMode, label: "Cover", desc: "Fill and crop" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFitMode(option.value)}
                className="flex-1 p-3 rounded-lg text-left transition-all duration-200"
                style={{
                  background: fitMode === option.value ? "var(--accent-glow)" : "var(--bg-secondary)",
                  border: `1px solid ${fitMode === option.value ? "var(--accent)" : "var(--border-color)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: fitMode === option.value ? "var(--accent)" : "var(--border-accent)",
                    }}
                  >
                    {fitMode === option.value && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                    )}
                  </div>
                  <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    {option.label}
                  </span>
                </div>
                <p className="text-xs mt-1 ml-5.5" style={{ color: "var(--text-muted)" }}>
                  {option.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Background Color (for Contain mode)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0"
              style={{ background: "var(--bg-secondary)" }}
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm w-28 uppercase"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-4 text-sm animate-fade-in"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--error)",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Action Button */}
      <div className="flex gap-3">
        <button
          onClick={handleProcess}
          disabled={processing}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: processing ? "var(--border-accent)" : "var(--accent)",
          }}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
              </svg>
              Processing...
            </span>
          ) : (
            "Start Processing"
          )}
        </button>
        {(done || files.length > 0) && (
          <button
            onClick={handleReset}
            className="py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress */}
      {processing && (
        <div className="space-y-2 animate-fade-in">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Processing images... This may take a moment for large files.
          </p>
        </div>
      )}

      {/* Success */}
      {done && (
        <div
          className="rounded-xl p-5 animate-fade-in"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--success)" }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--success)" }}>
                Download complete!
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Your ZIP file contains resized images, PDFs for each format
                {selectedFormats.length > 1 ? ", and a merged PDF" : ""}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Contents Info */}
      {done && (
        <section
          className="rounded-xl p-5 animate-fade-in"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            ZIP Contents
          </h3>
          <div className="space-y-2">
            {selectedFormats.map((fmtId) => {
              const fmt = PRINT_FORMATS.find((f) => f.id === fmtId);
              if (!fmt) return null;
              return (
                <div key={fmtId} className="flex items-center gap-3 text-sm">
                  <span style={{ color: "var(--accent)" }}>📁</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {fmt.id}/
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    — {files.length} resized image{files.length > 1 ? "s" : ""} ({fmt.width}×{fmt.height})
                  </span>
                </div>
              );
            })}
            {selectedFormats.map((fmtId) => (
              <div key={`pdf-${fmtId}`} className="flex items-center gap-3 text-sm">
                <span style={{ color: "var(--error)" }}>📄</span>
                <span style={{ color: "var(--text-primary)" }}>{fmtId}.pdf</span>
              </div>
            ))}
            {selectedFormats.length > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <span style={{ color: "var(--warning)" }}>📄</span>
                <span style={{ color: "var(--text-primary)" }}>merged.pdf</span>
                <span style={{ color: "var(--text-muted)" }}>— all formats combined</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
