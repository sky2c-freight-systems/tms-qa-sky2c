"use client";

import { useMemo, useState } from "react";
import { DOCUMENT_TYPES, type DocType } from "@/lib/pdf/documentTypes";

interface PrintOptionsClientProps {
  fileNumber: string;
}

type EmailStatus = { kind: "idle" } | { kind: "sending" } | { kind: "success" } | { kind: "error"; message: string };

export default function PrintOptionsClient({ fileNumber }: PrintOptionsClientProps) {
  const [selectedDocType, setSelectedDocType] = useState<DocType>(DOCUMENT_TYPES[0].docType);
  const [copies, setCopies] = useState<number>(1);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({ kind: "idle" });

  const htmlUrl = useMemo(
    () => `/api/shipments/${fileNumber}/documents/${selectedDocType}?format=html`,
    [fileNumber, selectedDocType]
  );
  const pdfUrl = useMemo(
    () => `/api/shipments/${fileNumber}/documents/${selectedDocType}?format=pdf`,
    [fileNumber, selectedDocType]
  );

  function handlePrint() {
    // Open the rendered PDF in a new tab — the browser's native PDF viewer
    // print button / Ctrl+P invokes the print dialog reliably across browsers,
    // which is simpler and more consistent than driving window.print() inside
    // a same-origin iframe.
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  async function handleEmail() {
    setEmailStatus({ kind: "sending" });
    try {
      const res = await fetch(`/api/shipments/${fileNumber}/documents/${selectedDocType}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copies }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailStatus({ kind: "error", message: json.error ?? "Failed to send email" });
        return;
      }
      setEmailStatus({ kind: "success" });
    } catch {
      setEmailStatus({ kind: "error", message: "Failed to send email" });
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Print Options</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>File #{fileNumber}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {DOCUMENT_TYPES.map((doc) => {
          const active = doc.docType === selectedDocType;
          return (
            <button
              key={doc.docType}
              type="button"
              onClick={() => {
                setSelectedDocType(doc.docType);
                setEmailStatus({ kind: "idle" });
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: active ? "2px solid #2563eb" : "1px solid #ccc",
                background: active ? "#eff6ff" : "#fff",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {doc.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <iframe
          key={htmlUrl}
          src={htmlUrl}
          title="Document preview"
          style={{ width: "100%", height: 640, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Copies
          <input
            type="number"
            min={1}
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 64, padding: "4px 6px", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>

        <button
          type="button"
          onClick={handlePrint}
          style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer" }}
        >
          Print
        </button>

        <a
          href={pdfUrl}
          download={`${fileNumber}_${selectedDocType}.pdf`}
          style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #333", background: "#fff", color: "#111", textDecoration: "none" }}
        >
          Save as PDF
        </a>

        <button
          type="button"
          onClick={handleEmail}
          disabled={emailStatus.kind === "sending"}
          style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #333", background: "#fff", color: "#111", cursor: "pointer" }}
        >
          {emailStatus.kind === "sending" ? "Sending…" : "Email"}
        </button>

        {emailStatus.kind === "success" && <span style={{ color: "#15803d" }}>Email sent.</span>}
        {emailStatus.kind === "error" && <span style={{ color: "#b91c1c" }}>{emailStatus.message}</span>}
      </div>
    </div>
  );
}
