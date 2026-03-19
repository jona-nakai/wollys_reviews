import { useState } from "react";
import styles from "./StarRating.module.css";

export default function StarRating({ value, onChange, readonly = false, size = 21 }) {
  const [hov, setHov] = useState(0);

  return (
    <div className={styles.row}>
      {[1, 2, 3, 4, 5].map(s => {
        const filled = s <= (hov || value);
        return (
          <button
            key={s}
            type="button"
            disabled={readonly}
            aria-label={readonly ? undefined : `Rate ${s} star${s > 1 ? "s" : ""}`}
            onClick={() => !readonly && onChange(s === value ? 0 : s)}
            onMouseEnter={() => !readonly && setHov(s)}
            onMouseLeave={() => !readonly && setHov(0)}
            className={`${styles.star} ${filled ? styles.filled : styles.empty} ${!readonly ? styles.interactive : ""} ${!readonly && hov === s ? styles.hovered : ""}`}
            style={{ fontSize: size }}
          >★</button>
        );
      })}
    </div>
  );
}