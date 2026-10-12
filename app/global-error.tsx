"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isHotspot =
    typeof window !== "undefined" && window.location.pathname.indexOf("/hotspot") === 0
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", padding: 16 }}>
        <h2 style={{ fontSize: 18 }}>Something went wrong</h2>
        <button
          onClick={() => reset()}
          style={{ padding: "10px 16px", margin: "12px 0", fontSize: 15 }}
        >
          Try again
        </button>
        {isHotspot && (
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#b91c1c" }}>
            {String((error && error.message) || error)}
            {"\n"}
            {String((error && error.stack) || "").slice(0, 700)}
          </pre>
        )}
      </body>
    </html>
  )
}