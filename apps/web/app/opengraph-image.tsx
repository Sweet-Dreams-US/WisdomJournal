import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wisdom Journal — Your Wisdom Lives Forever";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0a0e1a 0%, #111b33 55%, #1a2540 100%)",
          position: "relative",
        }}
      >
        {/* stars */}
        <div style={{ position: "absolute", top: 90, left: 180, width: 4, height: 4, borderRadius: 9999, background: "#c5d5f0", opacity: 0.8 }} />
        <div style={{ position: "absolute", top: 160, right: 240, width: 3, height: 3, borderRadius: 9999, background: "#c5d5f0", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: 140, left: 300, width: 3, height: 3, borderRadius: 9999, background: "#c5d5f0", opacity: 0.5 }} />
        <div style={{ position: "absolute", top: 220, left: 520, width: 5, height: 5, borderRadius: 9999, background: "#F5A623", opacity: 0.9 }} />
        <div style={{ position: "absolute", bottom: 200, right: 340, width: 4, height: 4, borderRadius: 9999, background: "#c5d5f0", opacity: 0.7 }} />

        {/* moon */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 140,
            width: 110,
            height: 110,
            borderRadius: 9999,
            background: "radial-gradient(circle at 65% 35%, #f5e9c9 0%, #e8d5a3 45%, transparent 72%)",
            opacity: 0.95,
          }}
        />

        <div
          style={{
            fontSize: 84,
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          <span>Your Wisdom</span>
          <span style={{ color: "#F5A623" }}>Lives Forever</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#c5d5f0",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          One thoughtful question a day. A living archive your loved ones can
          ask anything.
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 26,
            color: "#7CB9E8",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          Wisdom Journal
        </div>
      </div>
    ),
    { ...size }
  );
}
