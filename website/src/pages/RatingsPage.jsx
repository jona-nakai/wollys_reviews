import { useState, useEffect, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { T, BRAND } from "../constants/theme";
import { SANDWICHES } from "../constants/sandwiches";
import { useRatings } from "../hooks/useRatings";
import { useAuth } from "../context/AuthContext";
import SandwichRow from "../components/SandwichRow";

export default function RatingsPage() {
  const { user } = useAuth();
  const {
    ratings, saved, cr, saving, unsaved,
    loadUserRatings, loadCommunityRatings, saveRatings, updateRating,
  } = useRatings(user);

  const [activeCategory, setCategory] = useState("breakfast");
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);
  const [toastTimer, setToastTimer]   = useState(null);

  useEffect(() => { if (user) loadUserRatings(user.uid); }, [user]);
  useEffect(() => { loadCommunityRatings(activeCategory); }, [activeCategory]);

  async function handleSave() {
    await saveRatings(activeCategory);
    showToast("Saved! Go Huskies 🐾");
  }

  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    setToast(msg);
    setToastTimer(setTimeout(() => setToast(null), 2800));
  }

  const category  = SANDWICHES[activeCategory];
  const allCount  = Object.values(SANDWICHES).reduce((s, c) => s + Object.keys(c.items).length, 0);
  const totalRated = Object.values(ratings).filter(Boolean).length;

  const filtered = useMemo(() => {
    const items = Object.entries(category.items);
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(([, n]) => n.toLowerCase().includes(s));
  }, [category, search]);

  return (
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

      {/* Header */}
      <div style={{
        background: BRAND.red,
        borderBottom: `3px solid ${BRAND.gold}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
          <img src={user.photoURL} alt="" style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.4)",
          }} />
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
            {user.displayName?.split(" ")[0]}
          </span>
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <span style={{
            fontFamily: "'Georgia', serif", fontWeight: 700,
            fontSize: 18, color: "#fff", letterSpacing: "-0.2px",
          }}>Wally's Reviews</span>
        </div>
        <div style={{ minWidth: 120, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => signOut(auth)} style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.85)", borderRadius: 6,
            padding: "5px 12px", fontSize: 12, cursor: "pointer",
          }}>Sign out</button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px 40px 0" }}>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
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

        {/* Search row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{
            background: BRAND.ink, color: BRAND.chalk,
            padding: "5px 12px", borderRadius: 4,
            fontSize: 11, fontFamily: "'Georgia', serif",
            letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
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
                background: "none", border: "none", cursor: "pointer", padding: "4px",
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
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
          borderBottom: `1px solid ${T.divider}`, marginBottom: 4,
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
          ) : filtered.map(([id, name], i) => (
            <SandwichRow
              key={id}
              id={id}
              name={name}
              myRating={ratings[id] || 0}
              communityR={cr[id]}
              saved={saved}
              isLast={i === filtered.length - 1}
              onChange={updateRating}
            />
          ))}
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
              letterSpacing: "0.02em", transition: "all 0.2s",
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
  );
}