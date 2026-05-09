import useLiveUserCount from "../hooks/useLiveUserCount";

export default function LiveUserCount() {
  const userCount = useLiveUserCount();

  return (
    <div className="live-user-count" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
      <span
        style={{
          width: "10px",
          height: "10px",
          backgroundColor: "#4ade80",
          borderRadius: "50%",
          display: "inline-block",
          animation: "pulse 1.5s infinite"
        }}
      />
      <span style={{ 
        fontSize: "11px", 
        color: "var(--text-secondary, #8b7da8)", 
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        letterSpacing: "0.02em"
      }}>
        Có {userCount} con dân CPK đang online
      </span>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
          }
        `}
      </style>
    </div>
  );
}
