import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const API_URL = import.meta.env.VITE_PREDICTION_API_URL;

// R returns each prediction as a single-element array, e.g. { bs_0: [3.54] }
function flatten(predictions) {
  const flat = {};
  for (const [id, val] of Object.entries(predictions || {})) {
    flat[id] = Array.isArray(val) ? val[0] : val;
  }
  return flat;
}

// Read the cached predictions doc written by the CF service.
// Returns null if no doc exists yet for this user.
export async function fetchCachedPredictions(userId) {
  const snap = await getDoc(doc(db, "predictions", userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    predictions: flatten(data.predictions),
    updatedAt:   data.updatedAt,
  };
}

// Force a server recompute. The CF service writes the new result to
// predictions/{userId} and also returns it in the response.
export async function recomputePredictions(userId) {
  const res = await fetch(`${API_URL}/predict`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ user_id: userId }),
  });

  if (res.status === 404) return { predictions: {}, noRatings: true };
  if (!res.ok) throw new Error(`Prediction request failed: ${res.status}`);

  const data = await res.json();
  return { predictions: flatten(data.predictions), noRatings: false };
}
