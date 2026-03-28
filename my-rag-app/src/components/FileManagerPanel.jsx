import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fetchWithRefresh, friendlyError, ApiError, toast } from "../lib/api";
import { CONTENT_API } from "../lib/constants";
import ConfirmDialog from "./ui/ConfirmDialog";
import { c, s } from "../lib/styles";
import { PdfIcon, TrashIcon, UploadIcon, CloseIcon } from "./icons/Icons";

export default function FileManagerPanel({ onClose }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fileInputRef = useRef(null);
  const LIMIT = 12;

  const loadPdfs = useCallback(async (pg = 1, append = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await apiFetch(`${CONTENT_API}/list?page=${pg}&limit=${LIMIT}`);
      const items = res.data.content || [];
      setPdfs((prev) => append ? [...prev, ...items] : items);
      setHasMore(items.length === LIMIT);
      setPage(pg);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPdfs(1); }, [loadPdfs]);

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUploadErr("");
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetchWithRefresh(`${CONTENT_API}/upload-file`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        const msg = friendlyError(data.message, res.status);
        throw new ApiError(msg, res.status);
      }
      await loadPdfs(1);
      toast.success("PDF uploaded successfully");
    } catch (e) {
      setUploadErr(e.message);
      toast.error(e.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await apiFetch(`${CONTENT_API}/delete/${fileId}`, { method: "DELETE" });
      setPdfs((prev) => prev.filter((p) => p.id !== fileId));
      toast.success("PDF deleted");
    } catch (e) {
      toast.error(e.message);
    }
    setConfirm(null);
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.65)", animation: "fadeIn 0.15s ease" }} onClick={onClose} />
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 160,
        width: "min(460px, calc(100vw - 32px))",
        maxHeight: "85vh",
        overflowY: "auto",
        background: c.surface,
        border: `0.5px solid ${c.border}`,
        borderRadius: 16,
        animation: "fadeUp 0.2s ease",
        boxSizing: "border-box",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `0.5px solid ${c.borderFaint}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: c.surface,
          zIndex: 1,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'DM Mono', monospace" }}>My PDFs</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploadLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 7,
                border: `0.5px solid ${c.accentBorder}`,
                background: c.accentDim,
                color: c.accent,
                fontSize: 12,
                cursor: uploadLoading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: uploadLoading ? 0.6 : 1,
              }}
            >
              <UploadIcon /> {uploadLoading ? "Uploading..." : "Upload PDF"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.hint, padding: 4 }}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={uploadFile} />
          {uploadErr && <div style={{ ...s.err, marginBottom: 12 }}>{uploadErr}</div>}
          {loading ? (
            <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "24px 0", justifyContent: "center" }}>
              {[0, 160, 320].map((delay, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c.hint, display: "inline-block", animation: "dotPulse 1.2s ease-in-out infinite", animationDelay: `${delay}ms` }} />
              ))}
            </div>
          ) : pdfs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: c.hint, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              No PDFs uploaded yet
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pdfs.map((pdf) => (
                  <div key={pdf.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: c.elevated,
                    border: `0.5px solid ${c.borderFaint}`,
                  }}>
                    <PdfIcon />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdf.file_name}</div>
                      <div style={{ fontSize: 11, color: c.hint, marginTop: 2 }}>{new Date(pdf.created_at).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => setConfirm(pdf)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: c.hint, padding: 6, borderRadius: 6, transition: "color 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = c.errText}
                      onMouseLeave={(e) => e.currentTarget.style.color = c.hint}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => loadPdfs(page + 1, true)}
                  disabled={loadingMore}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: "9px",
                    borderRadius: 8,
                    border: `0.5px solid ${c.border}`,
                    background: "transparent",
                    color: loadingMore ? c.hint : c.muted,
                    fontSize: 12,
                    cursor: loadingMore ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          title={`Delete "${confirm.file_name}"?`}
          message="This will permanently delete the PDF and all its embeddings. This cannot be undone."
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
