"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Root Error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#F4F8F6",
          color: "#0F2A24",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #DDE7E2",
            borderRadius: "1.5rem",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(19, 75, 64, 0.05)",
          }}
        >
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "50%",
              backgroundColor: "#FFF0F0",
              color: "#D14343",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#095046",
              margin: "0 0 0.5rem 0",
            }}
          >
            Terjadi Kendala Kritis
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#5B6F68",
              lineHeight: 1.5,
              marginBottom: "1.5rem",
            }}
          >
            Aplikasi mengalami kendala saat inisialisasi. Silakan muat ulang halaman.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: "#095046",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}
