import numpy as np
import pandas as pd


def compute_similarity_matrix(df):
    # center all items by their mean rating
    item_means = df.mean(axis=0, skipna=True)
    df_centered = df.sub(item_means, axis=1)

    items = df.columns.tolist()
    n = len(items)

    # compute pairwise cosine similarities over co-rated users only
    sim_matrix = np.full((n, n), np.nan)

    for i in range(n):
        for j in range(n):
            if i == j:
                sim_matrix[i, j] = np.nan
                continue

            item_a = df_centered.iloc[:, i]
            item_b = df_centered.iloc[:, j]

            # only use users who rated both items
            shared = ~item_a.isna() & ~item_b.isna()

            if shared.sum() == 0:
                sim_matrix[i, j] = 0.0
                continue

            corated_a = item_a[shared].values
            corated_b = item_b[shared].values

            norm_a = np.linalg.norm(corated_a)
            norm_b = np.linalg.norm(corated_b)

            if norm_a == 0 or norm_b == 0:
                sim_matrix[i, j] = 0.0
            else:
                sim_matrix[i, j] = np.dot(corated_a, corated_b) / (norm_a * norm_b)

    # make symmetric by averaging with transpose first
    sim_matrix_t = sim_matrix.T.copy()

    sim_symmetric = np.where(
        np.isnan(sim_matrix), sim_matrix_t,
        np.where(np.isnan(sim_matrix_t), sim_matrix,
                 (sim_matrix + sim_matrix_t) / 2)
    )

    # set diagonal to NaN before scaling so it doesn't affect min/max
    np.fill_diagonal(sim_symmetric, np.nan)

    # min-max scale each column to [0, 1]
    sim_df = pd.DataFrame(sim_symmetric, index=items, columns=items)

    sim_df_scaled = sim_df.apply(
        lambda x: (x - np.nanmin(x)) / (np.nanmax(x) - np.nanmin(x))
        if (np.nanmax(x) - np.nanmin(x)) != 0
        else x * 0,
        axis=0
    )

    # set diagonal to 0 after scaling
    np.fill_diagonal(sim_df_scaled.values, 0)

    sim_df_scaled.index.name = "sandwich_id"
    sim_df_scaled.columns.name = "sandwich_id"

    return sim_df_scaled


def item_collab_filter(df, target_user):
    if target_user not in df.index:
        print(f"Error: {target_user} not found in the dataset.")
        return None

    if not df.loc[target_user].isna().any():
        print(f"Error: {target_user} has no missing ratings")
        return None

    sim_df = compute_similarity_matrix(df)

    missing_items = df.columns[df.loc[target_user].isna()]
    predicted_ratings = {}

    for target_item in missing_items:
        similarity_scores = sim_df[target_item].copy()
        user_ratings = df.loc[target_user].copy()

        # only use items the user has rated with similarity > 0
        rated_mask = ~user_ratings.isna() & (similarity_scores > 0)

        numerator = (similarity_scores[rated_mask] * user_ratings[rated_mask]).sum()
        denominator = similarity_scores[rated_mask].sum()

        if denominator == 0:
            predicted_ratings[target_item] = np.nan
        else:
            pred = numerator / denominator
            predicted_ratings[target_item] = float(np.clip(pred, 1.0, 5.0))

    return predicted_ratings


def generate_loo_predictions(df):
    records = []

    for user in df.index:
        rated_items = df.columns[~df.loc[user].isna()]

        for sandwich in rated_items:
            actual_rating = df.loc[user, sandwich]

            # temporarily remove this rating
            df_loo = df.copy()
            df_loo.loc[user, sandwich] = np.nan

            if df_loo.loc[user].isna().all():
                continue

            sim_df = compute_similarity_matrix(df_loo)

            similarity_scores = sim_df[sandwich].copy()
            user_ratings = df_loo.loc[user].copy()
            rated_mask = ~user_ratings.isna() & (similarity_scores > 0)

            numerator = (similarity_scores[rated_mask] * user_ratings[rated_mask]).sum()
            denominator = similarity_scores[rated_mask].sum()

            if denominator == 0:
                cf_pred = np.nan
            else:
                cf_pred = float(np.clip(numerator / denominator, 1.0, 5.0))

            records.append({
                "user_id": user,
                "sandwich_id": sandwich,
                "cf_pred": cf_pred,
                "actual_rating": actual_rating
            })

    predictions_df = pd.DataFrame(
        records, columns=["user_id", "sandwich_id", "cf_pred", "actual_rating"])
    predictions_df.to_csv("model/data/cf_predictions.csv", index=False)

    return predictions_df


if __name__ == "__main__":
    df = pd.read_csv("model/data/ratings.csv", index_col="user_id", na_values="NA")

    # compute and save the similarity matrix
    sim_df = compute_similarity_matrix(df)
    sim_df.to_csv("model/data/item_similarities.csv")

    # melt to long format for the Bayesian model
    ratings_long = df.reset_index().melt(
        id_vars="user_id",
        var_name="sandwich_id",
        value_name="taste"
    ).dropna(subset=["taste"])
    ratings_long = ratings_long[["user_id", "sandwich_id", "taste"]].reset_index(drop=True)
    ratings_long.to_csv("model/data/ratings_long.csv", index=False)

    # generate and save LOO predictions
    predictions_df = generate_loo_predictions(df)
    print(predictions_df.head())
