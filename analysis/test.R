source("model/bayesian_model/bayesian_model.R")

similarities <- as.matrix(read.csv("analysis/data/item_similarities.csv", row.names = 1, check.names = FALSE))
ratings <- read.csv("analysis/data/ratings_long.csv", check.names = FALSE)
cf_predictions <- read.csv("analysis/data/cf_predictions.csv", check.names = FALSE)

cf_predictions <- cf_predictions[!is.na(cf_predictions$cf_pred), ]
cat("held-out predictions:", nrow(cf_predictions), '\n')

cf_rmse <- sqrt(mean((cf_predictions$cf_pred - cf_predictions$actual_rating)^2))
cat("cf rmse:", round(cf_rmse, 4), '\n')

bayesian_preds <- numeric(nrow(cf_predictions))
for (i in seq_len(nrow(cf_predictions))) {
  bayesian_preds[i] <- predict_user_item(
    cf_predictions$user_id[i],
    cf_predictions$sandwich_id[i],
    similarities,
    ratings
  )
}

bayesian_rmse <- sqrt(mean((bayesian_preds - cf_predictions$actual_rating)^2))
cat("bayesian rmse:", round(bayesian_rmse, 4), '\n')
