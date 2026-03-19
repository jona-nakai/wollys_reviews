import { T, BRAND } from "../constants/theme";

export default function CommunityRating({ avg, count }) {
  if (!avg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.accent }}>★</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{avg}</span>
      <span style={{ fontSize: 10, color: T.muted }}>({count} ratings)</span>
    </div>
  );
}