import { useState } from "react";
import { T, BRAND } from "../constants/theme";

export default function StarRating({ value, onChange, readonly = false, size = 21 }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          disabled={readonly}
          onClick={() => !readonly && onChange(s === value ? 0 : s)}
          onMouseEnter={() => !readonly && setHov(s)}
          onMouseLeave={() => !readonly && setHov(0)}
          style={{
            background: "none", border: "none", padding: "2px",
            cursor: readonly ? "default" : "pointer",
            fontSize: size, lineHeight: 1,
            color: s <= (hov || value) ? T.accent : T.hint,
            transform: !readonly && hov === s ? "scale(1.25)" : "scale(1)",
            transition: "transform 0.1s, color 0.12s",
          }}
        >★</button>
      ))}
    </div>
  );
}