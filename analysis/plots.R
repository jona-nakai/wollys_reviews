source("model/bayesian_model/bayesian_model.R")

similarities <- as.matrix(read.csv("analysis/data/item_similarities.csv", row.names = 1, check.names = FALSE))
ratings <- read.csv("analysis/data/ratings_long.csv", check.names = FALSE)
cf_predictions <- read.csv("analysis/data/cf_predictions.csv", check.names = FALSE)
cf_predictions <- cf_predictions[!is.na(cf_predictions$cf_pred), ]

bayesian_preds <- numeric(nrow(cf_predictions))
for (i in seq_len(nrow(cf_predictions))) {
  bayesian_preds[i] <- predict_user_item(
    cf_predictions$user_id[i],
    cf_predictions$sandwich_id[i],
    similarities,
    ratings
  )
}

cf_rmse <- sqrt(mean((cf_predictions$cf_pred - cf_predictions$actual_rating)^2))
bayesian_rmse <- sqrt(mean((bayesian_preds - cf_predictions$actual_rating)^2))


# CF Graph
png("analysis/plots/cf_predicted_vs_actual.png", width = 600, height = 600)
plot(
  cf_predictions$actual_rating, cf_predictions$cf_pred,
  xlim = c(1, 5), ylim = c(1, 5),
  xlab = "Actual Rating", ylab = "Predicted Rating",
  main = paste0("Collaborative Filtering (RMSE = ", round(cf_rmse, 3), ")"),
  pch = 19, col = rgb(0.27, 0.51, 0.71, 0.4)
)
abline(0, 1, col = "red", lty = 2)
legend("topleft", legend = "Predicted = Actual", col = "red", lty = 2, bty = "n")
dev.off()


# Bayesian Graph
png("analysis/plots/bayesian_predicted_vs_actual.png", width = 600, height = 600)
plot(
  cf_predictions$actual_rating, bayesian_preds,
  xlim = c(1, 5), ylim = c(1, 5),
  xlab = "Actual Rating", ylab = "Predicted Rating",
  main = paste0("CF + Bayesian (RMSE = ", round(bayesian_rmse, 3), ")"),
  pch = 19, col = rgb(0.27, 0.51, 0.71, 0.4)
)
abline(0, 1, col = "red", lty = 2)
legend("topleft", legend = "Predicted = Actual", col = "red", lty = 2, bty = "n")
dev.off()


# Rating Distribution
rating_counts <- table(ratings$taste)

png("analysis/plots/rating_distribution.png", width = 700, height = 500)
barplot(
  rating_counts,
  xlab = "Rating", ylab = "Number of Ratings",
  main = "Distribution of Ratings",
  col = "steelblue"
)
invisible(dev.off())


# Prior vs Posterior for student 0, sandwich 11
user_id <- "stu_0"
item_id <- "s_11"

similarity_scores <- similarities[item_id, ] + similarities[, item_id]
similarity_scores[item_id] <- 0

user_ratings <- ratings[ratings$user_id == user_id, ]

similarity_ratings <- c()
similarity_weights <- c()
for (i in seq_len(nrow(user_ratings))) {
  sandwich_id <- user_ratings$sandwich_id[i]
  sim <- similarity_scores[sandwich_id]
  if (sim != 0) {
    similarity_ratings <- c(similarity_ratings, user_ratings$taste[i])
    similarity_weights <- c(similarity_weights, sim)
  }
}

alpha_prior <- dirichlet_prior(similarity_ratings, similarity_weights)

observed <- ratings$taste[ratings$sandwich_id == item_id & ratings$user_id != user_id]
alpha_post <- dirichlet_posterior(alpha_prior, observed)

prior_probs <- alpha_prior / sum(alpha_prior)
post_probs <- alpha_post  / sum(alpha_post)

probs_matrix <- rbind(prior_probs, post_probs)
colnames(probs_matrix) <- rating_values
rownames(probs_matrix) <- c("Prior", "Posterior")

png("analysis/plots/prior_vs_posterior.png", width = 700, height = 500)
barplot(
  probs_matrix, beside = TRUE,
  col = c("steelblue", "tomato"),
  xlab = "Rating", ylab = "Probability",
  main = paste("Prior vs Posterior for Student 0, Sandwich 11"),
  legend.text = TRUE,
  args.legend = list(x = "topleft", bty = "n")
)
dev.off()
