import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function isAbsoluteHttp(u) {
  return /^https?:\/\//i.test(u);
}

/**
 * Path for axios when baseURL is .../api — avoids leading "/" eating the /api segment.
 */
function toAxiosRelativePath(apiRelativeUrl) {
  if (!apiRelativeUrl) return "";
  if (apiRelativeUrl.startsWith("/api/")) {
    return apiRelativeUrl.slice(5);
  }
  return apiRelativeUrl.replace(/^\//, "");
}

/**
 * Renders a ticket attachment: public Supabase URLs load directly; API paths load with JWT via blob URL.
 */
export default function TicketAttachmentImage({ url, alt, className }) {
  const [src, setSrc] = useState(() => (url && isAbsoluteHttp(url) ? url : null));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      setError(true);
      return undefined;
    }

    if (isAbsoluteHttp(url)) {
      setSrc(url);
      setError(false);
      return undefined;
    }

    let blobUrl = null;
    let cancelled = false;
    setSrc(null);
    setError(false);

    const path = toAxiosRelativePath(url);
    axiosInstance
      .get(path, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(res.data);
        setSrc(blobUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-500 text-[10px] text-center p-2 border-2 border-dashed border-slate-200 rounded-xl ${className || ""}`}
      >
        Could not load image
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs animate-pulse rounded-xl border-2 border-slate-200 ${className || ""}`}
      >
        Loading…
      </div>
    );
  }

  return <img src={src} alt={alt || ""} className={className} />;
}
