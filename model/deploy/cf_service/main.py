from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pandas as pd
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from cf_model.cf_model import compute_similarity_matrix

app = FastAPI()


class PredictRequest(BaseModel):
    user_id: str
    ratings: dict  # e.g. {"bs_0": 4.5, "s_3": 3.0, ...}


@app.post("/predict")
def predict(request: PredictRequest):
    user_ratings = pd.Series(request.ratings, dtype=float)

    # load ratings and insert the target user's ratings
    ratings_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ratings.csv")
    df = pd.read_csv(ratings_path, index_col="user_id", na_values="NA")

    df_with_user = df.copy()
    df_with_user.loc[request.user_id] = np.nan
    for sandwich_id, rating in request.ratings.items():
        if sandwich_id in df_with_user.columns:
            df_with_user.loc[request.user_id, sandwich_id] = rating

    sim_df = compute_similarity_matrix(df_with_user)

    return {
        "user_id": request.user_id,
        "similarity_matrix": sim_df.to_dict(),
        "user_ratings": user_ratings.to_dict()
    }
