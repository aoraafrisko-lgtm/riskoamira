interface Props {
  visible: boolean;
  closing: boolean;
  title?: string;
  guestName?: string;
  accent?: string;
  onOpen: () => void;
}

/**
 * Overlay pembuka undangan. Cover (section pertama) tetap dirender kanvas;
 * komponen ini hanya menaruh sapaan + tombol "Buka Undangan" di atasnya.
 */
export function CoverGate({ visible, closing, title, guestName, accent = "#b08d57", onOpen }: Props) {
  if (!visible) return null;

  return (
    <div
      aria-hidden={closing}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: "9vh",
        textAlign: "center",
        pointerEvents: closing ? "none" : "auto",
        opacity: closing ? 0 : 1,
        transform: closing ? "scale(1.08)" : "scale(1)",
        transition: "opacity .9s ease, transform 1.2s cubic-bezier(.16,.84,.24,1)",
        background:
          "linear-gradient(to top, rgba(12,10,8,.72) 0%, rgba(12,10,8,.35) 38%, rgba(12,10,8,0) 72%)",
        fontFamily: "'Jost', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes cg-rise { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform:none } }
        @keyframes cg-shimmer { 0%{ background-position: -140% 0 } 100%{ background-position: 240% 0 } }
        @keyframes cg-pulse { 0%,100%{ box-shadow: 0 0 0 0 rgba(255,255,255,.28) } 50%{ box-shadow: 0 0 0 14px rgba(255,255,255,0) } }
      `}</style>

      <div style={{ animation: "cg-rise .9s ease both", color: "#fff", padding: "0 24px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8 }}>
          {title ?? "Undangan Pernikahan"}
        </div>
        {guestName ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>KEPADA</div>
            <div style={{ fontSize: 22, marginTop: 4, fontFamily: "'Cormorant Garamond', serif" }}>{guestName}</div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onOpen}
        style={{
          marginTop: 26,
          padding: "13px 30px",
          borderRadius: 999,
          border: `1px solid ${accent}`,
          background: `linear-gradient(100deg, ${accent} 0%, #ffffff55 50%, ${accent} 100%)`,
          backgroundSize: "220% 100%",
          color: "#fff",
          fontSize: 13,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          cursor: "pointer",
          animation: "cg-rise 1s .15s ease both, cg-shimmer 3.4s linear infinite, cg-pulse 2.6s ease-in-out infinite",
        }}
      >
        ✧ Buka Undangan
      </button>
    </div>
  );
}
