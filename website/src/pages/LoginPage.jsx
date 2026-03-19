import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";
import styles from "./LoginPage.module.css";
import GoogleIcon from "../components/GoogleIcon";

export default function LoginPage() {
  async function handleLogin() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Sign-in failed:", e);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Wally's Reviews</h1>
        <p className={styles.subtitle}>ML Recommendation Engine · Khoury College</p>
        <div className={styles.divider} />
        <p className={styles.body}>
          Rate Wally's sandwiches and our model will predict your next favorite order.
        </p>
        <button className={styles.loginBtn} onClick={handleLogin}>
          <GoogleIcon /> Continue with Google
        </button>
        <p className={styles.footnote}>Open to all Northeastern students &amp; staff</p>
      </div>
    </div>
  );
}