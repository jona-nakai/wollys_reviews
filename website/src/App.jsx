import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, getDocs,
  serverTimestamp, doc, setDoc,
} from "firebase/firestore";
import { SANDWICHES } from "./sandwiches";

// ─── Brand Tokens ──────────────────────────────────────────────────────────────
const BRAND = {
  red:       "#C8102E",
  redMuted:  "#f9e4e7",
  gold:      "#A4804A",
  goldLight: "#f5ead8",
  white:     "#fdfaf5",
  kraft:     "#f0e8d8",
  kraftDark: "#d6c9b0",
  ink:       "#2a2118",
  muted:     "#8a7f72",
  border:    "#ddd5c5",
  green:     "#2d6a4f",
  chalk:     "#e8e4d8",
};

const T = {
  bg:       BRAND.white,
  surface:  "#ffffff",
  surface2: BRAND.kraft,
  border:   BRAND.border,
  text:     BRAND.ink,
  muted:    BRAND.muted,
  hint:     BRAND.kraftDark,
  accent:   BRAND.red,
  accentBg: BRAND.redMuted,
  gold:     BRAND.gold,
  goldBg:   BRAND.goldLight,
  divider:  BRAND.kraftDark,
};

const ThemeCtx = createContext("light");
const useDark  = () => useContext(ThemeCtx) === "dark";

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 21 }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s}
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

// ─── Community Rating ──────────────────────────────────────────────────────────
function CommunityRating({ avg, count }) {
  if (!avg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.accent }}>★</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{avg}</span>
      <span style={{ fontSize: 10, color: T.muted }}>({count} ratings)</span>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState(null);
  const [ratings, setRatings]         = useState({});
  const [saved, setSaved]             = useState({});
  const [cr, setCr]                   = useState({});
  const [saving, setSaving]           = useState(false);
  const [activeCategory, setCategory] = useState("breakfast");
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);
  const [toastTimer, setToastTimer]   = useState(null);

  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    if (u) loadUserRatings(u.uid);
  }), []);

  useEffect(() => { if (user) loadCommunityRatings(); }, [activeCategory]);

  async function loadUserRatings(uid) {
    const snap = await getDocs(query(collection(db, "ratings"), where("userId", "==", uid)));
    const loaded = {};
    snap.forEach(d => { loaded[d.data().sandwichId] = d.data().taste; });
    setSaved(loaded); setRatings(loaded);
    loadCommunityRatings();
  }

  async function loadCommunityRatings() {
    const items = Object.keys(SANDWICHES[activeCategory].items);
    const result = {};
    await Promise.all(items.map(async id => {
      const snap = await getDocs(query(collection(db, "ratings"), where("sandwichId", "==", id)));
      const scores = snap.docs.map(d => d.data().taste).filter(Boolean);
      if (scores.length) result[id] = {
        avg: (scores.reduce((a,b) => a+b,0)/scores.length).toFixed(1),
        count: scores.length,
      };
    }));
    setCr(result);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    for (const [id, taste] of Object.entries(ratings)) {
      if (taste === saved[id]) continue;
      await setDoc(doc(db, "ratings", `${user.uid}_${id}`), {
        userId: user.uid, displayName: user.displayName,
        sandwichId: id, taste, updatedAt: serverTimestamp(),
      });
    }
    setSaved({ ...ratings }); setSaving(false);
    await loadCommunityRatings();
    showToast("Saved! Go Huskies 🐾");
  }

  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    setToast(msg);
    setToastTimer(setTimeout(() => setToast(null), 2800));
  }

  const category   = SANDWICHES[activeCategory];
  const unsaved    = Object.entries(ratings).some(([id, v]) => v !== saved[id]);
  const totalRated = Object.values(ratings).filter(Boolean).length;
  const allCount   = Object.values(SANDWICHES).reduce((s, c) => s + Object.keys(c.items).length, 0);

  const filtered = useMemo(() => {
    const items = Object.entries(category.items);
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(([, n]) => n.toLowerCase().includes(s));
  }, [category, search]);

  // ── Login ──
  if (!user) return (
    <ThemeCtx.Provider value="light">
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
          <p style={{ color: T.muted, fontSize: 12, marginBottom: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Machine Learning Recommendation Engine
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
          ><GoogleIcon /> Continue with Google</button>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 20 }}>
            Open to all Northeastern students &amp; staff
          </p>
        </div>
      </div>
    </ThemeCtx.Provider>
  );

  // ── Main ──
  return (
    <ThemeCtx.Provider value="light">
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "system-ui, sans-serif", color: T.text }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)",
            background: BRAND.red, color: "#fff",
            padding: "9px 20px", borderRadius: 24,
            fontSize: 13, fontWeight: 500, zIndex: 999,
            whiteSpace: "nowrap", animation: "fadeUp 0.2s ease",
          }}>{toast}</div>
        )}

        {/* ── Top header bar ── */}
        <div style={{
          background: BRAND.red,
          borderBottom: `3px solid ${BRAND.gold}`,
          padding: "0 24px",
          height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          {/* Left — avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
            <img src={user.photoURL} alt="" style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.4)",
            }} />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              {user.displayName?.split(" ")[0]}
            </span>
          </div>

          {/* Center — title */}
          <div style={{ textAlign: "center", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <span style={{
              fontFamily: "'Georgia', serif", fontWeight: 700,
              fontSize: 18, color: "#fff", letterSpacing: "-0.2px",
            }}>Wally's Reviews</span>
          </div>

          {/* Right — sign out */}
          <div style={{ minWidth: 120, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => signOut(auth)} style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
              color: "rgba(255,255,255,0.85)", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, cursor: "pointer",
            }}>Sign out</button>
          </div>
        </div>

        {/* ── Page content ── */}
        <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px 40px 0" }}>

          {/* Progress + welcome */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20, gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 4, background: T.hint, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: BRAND.red, borderRadius: 4,
                    width: `${Math.round((totalRated / allCount) * 100)}%`,
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>
                  {totalRated} / {allCount} rated
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                ML Recommendation Engine · Khoury College
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {Object.entries(SANDWICHES).map(([key, cat]) => {
              const active = activeCategory === key;
              return (
                <button key={key}
                  onClick={() => { setCategory(key); setSearch(""); }}
                  style={{
                    padding: "9px 20px", borderRadius: 6, flexShrink: 0,
                    fontSize: 13, cursor: "pointer", letterSpacing: "0.02em",
                    fontFamily: active ? "'Georgia', serif" : "system-ui",
                    fontWeight: active ? 700 : 400,
                    border: `1.5px solid ${active ? BRAND.red : T.border}`,
                    background: active ? BRAND.red : T.surface2,
                    color: active ? "#fff" : T.muted,
                    transition: "all 0.15s",
                  }}
                >{cat.label}</button>
              );
            })}
          </div>

          {/* Section label + search row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{
              background: BRAND.ink, color: BRAND.chalk,
              padding: "5px 12px", borderRadius: 4,
              fontSize: 11, fontFamily: "'Georgia', serif",
              letterSpacing: "0.1em", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              {category.label.replace(/^\S+\s*/, "")} Menu
            </div>
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <span style={{
                position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                color: T.muted, fontSize: 14, pointerEvents: "none",
              }}>⌕</span>
              <input
                type="text"
                placeholder="Search the menu…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "8px 32px 8px 30px",
                  background: T.surface, color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 7, fontSize: 13, outline: "none",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  ...btnReset, position: "absolute", right: 10,
                  top: "50%", transform: "translateY(-50%)",
                  color: T.muted, fontSize: 14,
                }}>✕</button>
              )}
            </div>
            <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>★ = Husky fave</span>
          </div>

          {/* Column headers */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "4px 12px 8px",
            borderBottom: `1px solid ${T.divider}`,
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Item</span>
            <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Your rating</span>
          </div>

          {/* Sandwich list */}
          <div style={{ paddingBottom: 100, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0 32px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: T.muted, padding: "48px 0", fontSize: 14 }}>
                Nothing found for "{search}"
              </div>
            ) : filtered.map(([id, name], i) => {
              const myRating   = ratings[id] || 0;
              const communityR = cr[id];
              const isSaved    = saved[id] && ratings[id] === saved[id];
              const isLast     = i === filtered.length - 1;
              return (
                <div key={id} style={{
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
                  <StarRating value={myRating} onChange={val => setRatings(r => ({ ...r, [id]: val }))} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Save bar */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: T.bg, borderTop: `1px solid ${T.divider}`,
          padding: "12px 40px",
          paddingBottom: "max(14px, env(safe-area-inset-bottom))",
          zIndex: 10,
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              {unsaved && <span style={{ fontSize: 12, color: BRAND.red }}>Unsaved changes</span>}
              {!unsaved && totalRated > 0 && <span style={{ fontSize: 12, color: T.muted }}>All ratings saved ✓</span>}
            </div>
            <button
              onClick={handleSave}
              disabled={!unsaved || saving}
              style={{
                padding: "13px 36px",
                background: unsaved ? BRAND.red : T.surface2,
                color: unsaved ? "#fff" : T.muted,
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: unsaved ? "pointer" : "default",
                letterSpacing: "0.02em",
                transition: "all 0.2s",
                fontFamily: "'Georgia', serif",
              }}
            >{saving ? "Saving…" : "Save ratings"}</button>
          </div>
        </div>

        <style>{`
          @keyframes fadeUp {
            from { opacity:0; transform:translateX(-50%) translateY(8px); }
            to   { opacity:1; transform:translateX(-50%) translateY(0); }
          }
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
          ::-webkit-scrollbar { display: none; }
          input { font-family: system-ui; }
          input::placeholder { color: ${T.muted}; }
        `}</style>
      </div>
    </ThemeCtx.Provider>
  );
}

const btnReset = { background: "none", border: "none", cursor: "pointer", padding: "4px" };

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