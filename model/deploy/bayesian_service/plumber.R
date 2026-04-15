library(plumber)

source("/app/model/bayesian_model/bayesian_model.R")

predict_handler <- function(req) {
  body <- req$body

  user_id <- body$user_id
  item_id <- body$item_id

  sim_raw <- body$similarities
  if (is.data.frame(sim_raw)) {
    sim_matrix <- as.matrix(sim_raw)
  } else {
    item_names <- names(sim_raw)
    sim_matrix <- do.call(cbind, lapply(sim_raw, function(col) unlist(col)[item_names]))
    rownames(sim_matrix) <- item_names
    colnames(sim_matrix) <- item_names
  }

  ratings <- as.data.frame(body$ratings, stringsAsFactors = FALSE)

  predicted_rating <- predict_user_item(user_id, item_id, sim_matrix, ratings)

  list(
    user_id          = user_id,
    item_id          = item_id,
    predicted_rating = predicted_rating
  )
}

root <- pr()
root <- pr_post(root, "/predict", predict_handler)
root <- pr_get(root, "/", function() list(status = "ok"))
pr_run(root, host = "0.0.0.0", port = as.integer(Sys.getenv("PORT", 8080)))
