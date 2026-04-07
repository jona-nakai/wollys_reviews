# all possible ratings of sandwiches
rating_values <- c(1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)

dirichlet_prior <- function(similar_ratings, similarity_weights) {
  # ---------------------------------------------------------------
  # Builds a Dirichlet prior from a user's ratings of similar items
  # ---------------------------------------------------------------
  # (input) similar_ratings: observed ratings from items similar to the
  #                               target item
  # (input) similarity_weights: CF item-item similarity scores between each
  #                             item and the target item
  # (output) alpha: hyperparameter vector for Dirichlet prior
  # ---------------------------------------------------------------

  # initialize alpha as a 0 vector
  alpha <- numeric(length(rating_values))

  # build alpha for each rating value
  for (i in seq_along(rating_values)) {
    total <- 0
    for (j in seq_along(similar_ratings)) {
      if (similar_ratings[j] == rating_values[i]) {
        total <- total + similarity_weights[j]
      }
    }
    alpha[i] <- total
  }

  # if alpha is 0, set alpha to a uniform Dirichlet,
  # equal weights for all ratings
  if (all(alpha == 0)) {
    alpha <- rep(1, length(rating_values))
  }

  alpha
}

dirichlet_posterior <- function(alpha, observed_ratings) {
  # ---------------------------------------------------------------
  # Returns the Dirichlet posterior by updating the Dirichlet prior
  # using observed data
  # ---------------------------------------------------------------
  # (input) alpha: hyperparameter vector from Dirichlet prior
  # (input) observed_ratings: observed ratings for the target item
  # (output) alpha: updated hyperparameter vector
  #                 alpha_i = alpha_i + y_i
  # ---------------------------------------------------------------

  # updates alpha by how many times each rating appears in the observed ratings
  for (i in seq_along(rating_values)) {
    count <- 0
    for (j in seq_along(observed_ratings)) {
      if (observed_ratings[j] == rating_values[i]) {
        count <- count + 1
      }
    }
    alpha[i] <- alpha[i] + count
  }

  alpha
}

predict_rating <- function(alpha) {
  # ------------------------------------------------------------------
  # Returns expected value of the rating for the target item under the
  # Dirichlet posterior
  # ------------------------------------------------------------------
  # (input) alpha: updated hyperparameter vector from Dirichlet posterior
  # (output) : expected value for target item
  # ------------------------------------------------------------------

  sum((rating_values * alpha) / sum(alpha))
}

predict_user_item <- function(user_id, item_id, similarities, ratings) {
  # ---------------------------------------------------------------------------
  # Predicts the rating for a given user and item using a Dirichlet-Categorical
  # model
  # ---------------------------------------------------------------------------
  # (input) user_id: target user id
  # (input) item_id: target item id
  # (input) similarities: similarity matrix from item-item CF model
  # (input) ratings: observed data dataframe
  # (output): expected rating for the target user and item
  # ---------------------------------------------------------------------------

  # obtain similarity scores for target item, set self similarity to 0
  similarity_scores <- similarities[item_id, ] + similarities[, item_id]
  similarity_scores[item_id] <- 0

  user_ratings <- data.frame()
  for (i in seq_len(nrow(ratings))) {
    if (ratings$user_id[i] == user_id) {
      user_ratings <- rbind(user_ratings, ratings[i, ])
    }
  }

  # collect ratings and similarity scores from similar items the user has rated
  similarity_ratings <- c()
  similarity_weights <- c()
  for (i in seq_len(nrow(user_ratings))) {
    sandwich_id <- user_ratings$sandwich_id[i]

    similarity <- similarity_scores[sandwich_id]

    if (similarity != 0) {
      similarity_ratings <- c(similarity_ratings, user_ratings$taste[i])
      similarity_weights <- c(similarity_weights, similarity)
    }
  }

  alpha <- dirichlet_prior(similarity_ratings, similarity_weights)

  # collect observed ratings from other users for the target item
  observed_ratings <- c()
  for (i in seq_len(nrow(ratings))) {
    if (ratings$sandwich_id[i] == item_id && ratings$user_id[i] != user_id) {
      observed_ratings <- c(observed_ratings, ratings$taste[i])
    }
  }

  alpha <- dirichlet_posterior(alpha, observed_ratings)

  predict_rating(alpha)
}
