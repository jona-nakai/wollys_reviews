const API_URL = import.meta.env.VITE_PREDICTION_API_URL;

export async function fetchPredictions(userId) {
  const res = await fetch(`${API_URL}/predict`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ user_id: userId }),
  });

  if (res.status === 404) return { predictions: {}, noRatings: true };
  if (!res.ok) throw new Error(`Prediction request failed: ${res.status}`);

  const data = await res.json();
  // R returns each prediction as a single-element array, e.g. { bs_0: [3.54] }
  const flat = {};
  for (const [id, val] of Object.entries(data.predictions || {})) {
    flat[id] = Array.isArray(val) ? val[0] : val;
  }
  return { predictions: flat, noRatings: false };
}
