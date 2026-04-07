# Output files:
# item_similarities.csv : 27x27 symmetric matrix, sandwich IDs as row/column
# headers, cosine similarity values
# ratings.csv : columns: user_id, sandwich_id, rating - observed ratings only, no NaNs

# Constraints:
# Ratings are 1-5 in 0.5 increments (9 discrete values: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
# Synthetic data generator uses the same scale
# K = 5 (shared config constant -> Bayesian model should use the same value)
