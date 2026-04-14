library(plumber)

source("../../bayesian_model/bayesian_model.R")

#* @post /predict
function(req) {
  body <- req$body

  user_id <- body$user_id
  item_id <- body$item_id

  # similarities arrives as a named list of named lists OR as a data frame
  # depending on jsonlite simplification, normalize to a matrix
  sim_raw <- body$similarities
  if (is.data.frame(sim_raw)) {
    sim_matrix <- as.matrix(sim_raw)
  } else {
    item_names <- names(sim_raw)
    sim_matrix <- do.call(cbind, lapply(sim_raw, function(col) unlist(col)[item_names]))
    rownames(sim_matrix) <- item_names
    colnames(sim_matrix) <- item_names
  }

  # ratings arrives as a data frame (jsonlite auto-simplifies arrays of records)
  ratings <- as.data.frame(body$ratings, stringsAsFactors = FALSE)

  predicted_rating <- predict_user_item(user_id, item_id, sim_matrix, ratings)

  list(
    user_id          = user_id,
    item_id          = item_id,
    predicted_rating = predicted_rating
  )
}
