import { useState, useEffect, useRef } from "react";
import { Filter } from "bad-words";
import styles from "./UsernameSetupPage.module.css";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const filter = new Filter();

export default function UsernameSetupPage({ user, onSave, checkAvailability, saving, error }) {
  const [handle,   setHandle]   = useState("");
  const [status,   setStatus]   = useState(null); // null | "available" | "taken" | "invalid" | "inappropriate"
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef(null);

  // Validate + debounce availability check as user types
  useEffect(() => {
    if (!handle) { setStatus(null); return; }
    if (!USERNAME_REGEX.test(handle)) { setStatus("invalid"); return; }
    if (filter.isProfane(handle)) { setStatus("inappropriate"); return; }

    setChecking(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await checkAvailability(handle);
      setStatus(result);
      setChecking(false);
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [handle, checkAvailability]);

  const canSubmit = status === "available" && !saving;

  function getHintText() {
    if (status === "available")     return `@${handle} is available!`;
    if (status === "taken")         return "That username is already taken.";
    if (status === "inappropriate") return "That username is not allowed.";
    if (status === "invalid" && handle) return "3–20 chars, letters, numbers and _ only.";
    return "3–20 characters. Letters, numbers, and _ only.";
  }

  function getHintClass() {
    if (status === "available")     return styles.hintGreen;
    if (status === "taken")         return styles.hintRed;
    if (status === "inappropriate") return styles.hintRed;
    if (status === "invalid")       return styles.hintRed;
    return "";
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Pick your username</h1>
        <p className={styles.subtitle}>
          Choose a username so other Huskies can find you.
        </p>

        <div className={styles.inputWrap}>
          <span className={styles.at}>@</span>
          <input
            type="text"
            placeholder="yourname"
            value={handle}
            onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            maxLength={20}
            className={styles.input}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
          />
          <span className={styles.statusIcon}>
            {checking                       ? "⏳" :
             status === "available"         ? "✅" :
             status === "taken"             ? "❌" :
             status === "inappropriate"     ? "❌" :
             status === "invalid" && handle ? "⚠️" : ""}
          </span>
        </div>

        <p className={`${styles.hint} ${getHintClass()}`}>
          {getHintText()}
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btn}
          onClick={() => onSave(handle)}
          disabled={!canSubmit}
        >
          {saving ? "Saving…" : "Claim username"}
        </button>
      </div>
    </div>
  );
}