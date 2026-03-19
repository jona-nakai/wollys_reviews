import { T, BRAND } from "../constants/theme";
import StarRating from "./StarRating";
import CommunityRating from "./CommunityRating";

export default function SandwichRow({ id, name, myRating, communityR, saved, isLast, onChange }) {
  const isSaved = saved[id] && myRating === saved[id];
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16,
      padding: "12px 12px",
      background: myRating ? "#fff8f8" : T.surface,
      borderBottom: isLast ? "none" : `1px solid ${T.divider}`,
      transition: "background 0.2s",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 500, color: T.text,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            fontFamily: "'Georgia', serif",
          }}>{name}</p>
          {communityR && parseFloat(communityR.avg) >= 4.5 && (
            <span style={{
              fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase",
              background: BRAND.red, color: "#fff",
              padding: "2px 6px", borderRadius: 3, flexShrink: 0,
              fontFamily: "system-ui", fontWeight: 600,
            }}>Fave</span>
          )}
        </div>
        <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
          {communityR && <CommunityRating avg={communityR.avg} count={communityR.count} />}
          {isSaved && !communityR && (
            <span style={{ fontSize: 10, color: BRAND.green, fontWeight: 500 }}>✓ saved</span>
          )}
        </div>
      </div>
      <StarRating value={myRating} onChange={val => onChange(id, val)} />
    </div>
  );
}