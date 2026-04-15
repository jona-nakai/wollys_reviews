import os
import requests
import numpy as np
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.auth.transport.requests
import google.oauth2.id_token

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from cf_model.cf_model import compute_similarity_matrix

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

BAYESIAN_SERVICE_URL = os.environ.get("BAYESIAN_SERVICE_URL", "http://localhost:8000")

# Cloud Run attaches a service account automatically — uses Application Default
# Credentials. Locally, set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.
firebase_admin.initialize_app()
db = firestore.client()


class PredictRequest(BaseModel):
    user_id: str


def load_ratings_from_firestore() -> pd.DataFrame:
    """Pull all ratings from Firestore, return long-format DataFrame."""
    docs = db.collection("ratings").stream()
    records = []
    for doc in docs:
        data = doc.to_dict()
        records.append({
            "user_id":     data["userId"],
            "sandwich_id": data["sandwichId"],
            "taste":       data["taste"],
        })
    return pd.DataFrame(records, columns=["user_id", "sandwich_id", "taste"])


@app.post("/predict")
def predict(request: PredictRequest):
    ratings_long = load_ratings_from_firestore()

    if request.user_id not in ratings_long["user_id"].values:
        raise HTTPException(status_code=404, detail=f"No ratings found for user {request.user_id}")

    # pivot to wide format for CF
    df = ratings_long.pivot(index="user_id", columns="sandwich_id", values="taste")

    sim_df = compute_similarity_matrix(df)

    # sandwiches the target user has rated
    rated = ratings_long[ratings_long["user_id"] == request.user_id]["sandwich_id"].tolist()
    unrated_items = [s for s in df.columns if s not in rated]

    ratings_records = ratings_long.to_dict(orient="records")

    # attach identity token when calling an IAM-protected Cloud Run service
    # locally BAYESIAN_SERVICE_URL is http://localhost:8000 so token fetch is skipped
    headers = {}
    if BAYESIAN_SERVICE_URL.startswith("https://"):
        auth_req = google.auth.transport.requests.Request()
        token = google.oauth2.id_token.fetch_id_token(auth_req, BAYESIAN_SERVICE_URL)
        headers["Authorization"] = f"Bearer {token}"

    predictions = {}
    for item_id in unrated_items:
        response = requests.post(
            f"{BAYESIAN_SERVICE_URL}/predict",
            headers=headers,
            json={
                "user_id":      request.user_id,
                "item_id":      item_id,
                "similarities": sim_df.to_dict(),
                "ratings":      ratings_records,
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Bayesian service failed for {item_id}: {response.status_code} {response.text[:200]}")

        predictions[item_id] = response.json()["predicted_rating"]

    # Cache the result so the client can read it directly from Firestore
    # on future page loads (1 doc read instead of a full collection scan).
    db.collection("predictions").document(request.user_id).set({
        "userId":      request.user_id,
        "predictions": predictions,
        "updatedAt":   firestore.SERVER_TIMESTAMP,
    })

    return {
        "user_id":     request.user_id,
        "predictions": predictions,
    }
