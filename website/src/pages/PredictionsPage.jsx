import styles from "./PredictionsPage.module.css";

export default function PredictionsPage({ onBack }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.headerTitle}>Try Next</span>
        <div style={{ minWidth: 80 }} />
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.icon}>🥪</p>
          <h1 className={styles.title}>Coming Soon</h1>
          <p className={styles.body}>
            Our ML model needs more data before it can predict your next favorite sandwich.
            Keep rating and check back soon!
          </p>
          <div className={styles.progressWrap}>
            <p className={styles.progressLabel}>Data collection in progress…</p>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}