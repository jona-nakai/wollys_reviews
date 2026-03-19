import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";
import { T, BRAND } from "../constants/theme";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", padding: "0 24px",
    }}>
      <div style={{ textAlign: "center", width: "100%", maxWidth: 400 }}>
        <h1 style={{
          fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700,
          color: T.text, margin: "0 0 6px", letterSpacing: "-0.5px",
        }}>Wally's Reviews</h1>
        <p style={{
          color: T.muted, fontSize: 12, marginBottom: 8,
          letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          ML Recommendation Engine · Khoury College
        </p>
        <div style={{ width: 40, height: 2, background: BRAND.red, margin: "0 auto 24px" }} />
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Rate Wally's sandwiches and our model will predict your next favorite order.
        </p>
        <button
          onClick={() => signInWithPopup(auth, provider)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, width: "100%", padding: "14px 20px",
            background: T.surface, color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 10,
            fontSize: 14, fontWeight: 500, cursor: "pointer",
          }}
        >
          <GoogleIcon /> Continue with Google
        </button>
        <p style={{ fontSize: 11, color: T.muted, marginTop: 20 }}>
          Open to all Northeastern students &amp; staff
        </p>
      </div>
    </div>
  );
}