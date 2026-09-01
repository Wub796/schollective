"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, FileText, Sparkles, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import type { ParsedResumeProfile } from "@/lib/ai/resume-parser";

interface ResumeDropzoneProps {
  onParsed: (data: ParsedResumeProfile) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

const LOADING_STAGES = [
  { minSec: 0, text: "Reading and extracting digital PDF..." },
  { minSec: 1.5, text: "Analyzing academic standing and coursework..." },
  { minSec: 3.5, text: "Structuring research projects, clubs & awards..." },
  { minSec: 6.0, text: "Mapping technical skills & synthesizing profile fields..." },
];

export function ResumeDropzone({ onParsed, disabled }: ResumeDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up any running timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Monotonic progress state derived cleanly at component level
  const currentStage =
    [...LOADING_STAGES].reverse().find((s) => elapsedSec >= s.minSec) || LOADING_STAGES[0];
  const isFinalStage = elapsedSec >= 6;
  const statusText = isFinalStage
    ? `${currentStage.text} (${elapsedSec}s)`
    : currentStage.text;
  const progressPercent = Math.min(
    94,
    Math.round(15 + Math.min(elapsedSec, 6) * 11 + Math.max(0, elapsedSec - 6) * 1.5)
  );

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setSuccessMessage(null);

    // 1. Validation: Strictly reject non-PDF MIME types and extensions
    const hasPdfExt = file.name.toLowerCase().endsWith(".pdf");
    const isNonPdfMime = Boolean(file.type && file.type !== "application/pdf");
    if (!hasPdfExt || isNonPdfMime) {
      setError("Please upload a valid PDF document (.pdf). Word, text, and image files are not supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Resume file must be smaller than 4 MB.");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setElapsedSec(0);
    const startTime = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Unable to extract information from this PDF.");
      }

      setSuccessMessage("Extracted background. Form updated with new activities and coursework.");
      toast.success("Resume parsed successfully!");
      onParsed(json.data);
    } catch (err: any) {
      console.error("[ResumeDropzone] Error parsing resume:", err);
      const msg = err?.message || "Failed to parse resume. You can still fill out the form manually.";
      setError(msg);
      toast.error(msg);
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [onParsed]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || loading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderRadius: "16px",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        boxShadow: "0 4px 24px rgba(99, 102, 241, 0.04)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Header Badge ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--accent), var(--accent-blue))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
            }}
          >
            <Sparkles size={15} />
          </div>
          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Resume Ingestion & Autofill
          </span>
        </div>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
            background: "rgba(99, 102, 241, 0.08)",
            padding: "0.2rem 0.65rem",
            borderRadius: "100px",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          gemini-3.6-flash
        </span>
      </div>

      {/* ── Dropzone Container ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload digital resume PDF"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!loading && !disabled) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !loading && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{
          border: isDragging
            ? "2px dashed var(--accent)"
            : "1.5px dashed rgba(99, 102, 241, 0.35)",
          background: isDragging
            ? "rgba(99, 102, 241, 0.08)"
            : loading
            ? "rgba(248, 250, 252, 0.8)"
            : "rgba(248, 250, 252, 0.5)",
          borderRadius: "12px",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
          minHeight: "140px",
          position: "relative",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          disabled={loading || disabled}
        />

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Loader2 size={24} className="animate-spin" />
            </div>
            <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
              <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Parsing {fileName || "Resume"}…
              </p>
              <p style={{ fontSize: "0.74rem", color: "var(--accent)", fontWeight: 600, margin: 0 }}>
                {statusText}
              </p>
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  borderRadius: "100px",
                  background: "rgba(99, 102, 241, 0.15)",
                  overflow: "hidden",
                  marginTop: "0.35rem",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, var(--accent), #818cf8)",
                    borderRadius: "100px",
                    transition: "width 0.5s ease-out",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: isDragging ? "rgba(79, 70, 229, 0.15)" : "rgba(99, 102, 241, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                transition: "all 0.2s ease",
              }}
            >
              {isDragging ? <FileText size={22} /> : <UploadCloud size={22} />}
            </div>
            <div>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                Drag &amp; drop your resume (PDF) here, or <span style={{ color: "var(--accent)", textDecoration: "underline" }}>browse files</span>
              </p>
              <p style={{ fontSize: "0.76rem", color: "var(--text-tertiary)", margin: "0.35rem 0 0", maxWidth: "420px" }}>
                Optional — extracts your background into the fields below without erasing your existing work (PDF up to 4 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Success Banner ── */}
      {successMessage && !loading && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#065f46" }}>
              {successMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#065f46",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && !loading && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#991b1b" }}>
              {error}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
