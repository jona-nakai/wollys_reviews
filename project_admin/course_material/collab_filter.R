# collaborative filtering lecture .R file
spot <- read.csv("ds4420_spotify.csv")
head(spot)

# need to scale the data!
num_spot <- as.matrix(spot[,c(5,7)])
head(num_spot)
scale_spot <- scale(num_spot)
head(scale_spot)

# example x, y, z
x <- as.matrix(scale_spot[1,])
y <- as.matrix(scale_spot[2,])
z <- as.matrix(scale_spot[183,])

# calculate distances
# notice R and Python have slightly different norm functions due to rounding
norm(z - x, "1")
norm(z - y, "1")

norm(z - x, "2")
norm(z - y, "2")

norm(z - x, "I")
norm(z - y, "I")

# this package has the cosine() function which calculates the cosine similarity score of two vectors; you can also just calculate it manually (it is an easy function)
# install.packages("lsa")
library(lsa)
# it requires either individual vector objects
cosine(as.vector(z), as.vector(x))
# or a matrix made up of the vectors
cosine(cbind(z, x))
cosine(cbind(z, x, y))

# For the first basic collaborative filtering example
drg <- as.matrix(c(-5/3, 0, 4/3, 1/3))
st1 <- as.matrix(c(1, -1, 0, 0))
st2 <- as.matrix(c(-2, 2, 0, 0))
st3 <- as.matrix(c(0, 1/3, 4/3, -5/3))
st4 <- as.matrix(c(-2/3, 1/3, 0, 1/3))

sim_scores <- cosine(cbind(drg, st1, st2, st3, st4))
sim_scores

(sim_scores[1,3]*4 + sim_scores[1,5]*5)/(sim_scores[1,3] + sim_scores[1,5])

# MinMax Scaling of each Score
# This step is necessary!
# Remove diagonal elements first
diag(sim_scores) = NA
sim_scores_scaled <- apply(sim_scores, 2, function(x) (x - min(x, na.rm = T))/(max(x, na.rm = T) - min(x, na.rm = T)))
sim_scores_scaled

# Then, for example, Student 1 Song 4 prediction
(.510*4 + 1*1)/(.510 + 1)

# And, Dr. Gerber's Song 2 using all other users
sum(sim_scores_scaled[-1,1] * c(3, 5, 3, 4)) / sum(sim_scores_scaled[-1,1])
# Or, just the top 2
sum(sim_scores_scaled[c(3, 5),1] * c(5, 4)) / sum(sim_scores_scaled[c(3, 5),1])


## User-User Practice
# FILL THESE IN WITH STUDENT VALUES
drg <- scale(as.matrix(c(NA, NA, NA, NA, NA)), scale = FALSE)
st1 <- scale(as.matrix(c(NA, NA, NA, NA, NA)), scale = FALSE)
st2 <- scale(as.matrix(c(NA, NA, NA, NA, NA)), scale = FALSE)
st3 <- scale(as.matrix(c(NA, NA, NA, NA, NA)), scale = FALSE)
st4 <- scale(as.matrix(c(NA, NA, NA, NA, NA)), scale = FALSE)
st5 <- scale(as.matrix(c(NA, NA, NA, NA, NA)), scale = FALSE)
big_mat <- cbind(drg, st1, st2, st3, st4, st5)
big_mat[is.na(big_mat)] <- 0
big_mat


sim_scores <- cosine(big_mat)
sim_scores

diag(sim_scores) = NA
sim_scores_scaled <- apply(sim_scores, 2, function(x) (x - min(x, na.rm = T))/(max(x, na.rm = T) - min(x, na.rm = T)))
sim_scores_scaled

# Predicted ratings for movies Dr. Gerber hasn't seen:
# predicting Avatar?
sum(sim_scores_scaled[-1 ,1] * c()) / sum(sim_scores_scaled[-1 ,1])
# predicting Titanic?
sum(sim_scores_scaled[-1 ,1] * c()) / sum(sim_scores_scaled[-1 ,1])




## Using Song Data (content-based filtering)
# We've already got a big matrix of scaled artist popularity and duration, let's add in whether the song is explicit or not
head(scale_spot)
full_spot <- cbind(scale_spot, explicit = as.numeric(spot$explicit))
head(full_spot)

# We are making a big assumption that this data set (full_spot) is made up of songs likes by SIMILAR users to Dr. Gerber; we've skipped the first similarity score step here...
# We know that Mr. Brightside is song #183. Let's loop through and find the cosine similarity scores for all the songs relative to Mr. Brightside
drg <- as.matrix(full_spot[183,])
cosine_sim_to_drg <- c()
for (i in 1:nrow(full_spot)){
  temp_cosine <- cosine(cbind(drg, full_spot[i,]))[1,2]
  cosine_sim_to_drg <- c(cosine_sim_to_drg, temp_cosine)
}
similarity_df <- data.frame(song = spot$song_title, artist = spot$artist_name, sim_scores = cosine_sim_to_drg)

# a nice way to sort data using the tidyverse package
library(tidyverse)
similarity_df <- similarity_df %>%
                    arrange(desc(sim_scores))

head(similarity_df)
# these three measures (artist popularity, duration, and whether the song is explicit) are probably not very informative...
# would be nicer if we could get things like tempo, energy, danceability...
# but unfortunately Spotify deprecated some of their API endpoints last fall, so I can't get that information anymore (https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
# I do have it from previous classes though, if anyone is interested in a fun data set (or, if anyone knows a good way to replicate that information).

## Item-Item Example
Song1v2 <- as.matrix(c(2.25, -1.75, .25))
Song2v1 <- as.matrix(c(-.75, 1.25, .25))
cosine(cbind(Song1v2, Song2v1))

Song1v3 <- as.matrix(c(-.75, -1.75))
Song3v1 <- as.matrix(c(1, -1))
cosine(cbind(Song1v3, Song3v1))

# do it algorithmically
item_mat <- matrix(c(2, NA, 5, 4,
                     5, 3, NA, 4,
                     1, 5, 3, NA,
                     NA, 3, 4, 1,
                     3, 4, NA, 4), ncol = 4, byrow = T)
item_mat_scaled <- scale(item_mat, scale = FALSE)
item_mat_scaled

sim_scores <- matrix(0, nrow = ncol(item_mat), ncol = ncol(item_mat))
for(i in 1:(ncol(item_mat)-1)){
  for(j in (i+1):ncol(item_mat)){
    SongA_temp <- item_mat_scaled[,i]
    SongB_temp <- item_mat_scaled[,j]
    shared <- !is.na(SongA_temp) & !is.na(SongB_temp)
    comp_mat <- cbind(SongA_temp[shared], SongB_temp[shared])
    sim_scores[i,j] <- cosine(comp_mat)[1,2]
  }
}
sim_scores

# Min-Max Scale for Song 2
Song2_scores <- c(sim_scores[1,2], sim_scores[2,3], sim_scores[2,4])
scale_Song2 = (Song2_scores - min(Song2_scores)) / (max(Song2_scores) - min(Song2_scores))
scale_Song2

# Weighted Average to Predict
sum(item_mat[1,!is.na(item_mat[1,])] * scale_Song2) / sum(scale_Song2)


# Intuition behind SVD for Recommender Systems
# use the last matrix but centering by item and fill in the missing values
# (Note: I'm centering on item because that's what I did last; user means are more common)
item_mat_scaled[is.na(item_mat_scaled)] <- 0
R <- item_mat_scaled
# review the user-user matrix
R%*%t(R)

# what are the eigenvectors
eigen(R%*%t(R))
# remember those

# now, lets get the SVD
R_full <- svd(R)
R_full$u # should look a little familiar...
R_full$v # I wonder what these are... try eigen(t(item_mat)%*%item_mat)
# the S matrix (R calls it d) is diagonal, so R just provides those diagonal terms
R_full$d

# Should be able to recover full matrix with
R_full$u%*%diag(R_full$d)%*%t(R_full$v)
R

# But, the point is to pick only the most important latent features, k < 4
# Note, the diagonal terms are sorted; the matrices are already sorted so that
# the first k columns/rows are the most important! The fourth is much smaller than the third, so
k = 3
U_tilde <- R_full$u[,1:k]
S_tilde <- diag(R_full$d[1:k])
VT_tilde <- t(R_full$v)[1:k,]

# Our prediction matrix
R_hat <- U_tilde%*%S_tilde%*%VT_tilde
R_hat
# Add the mean back to put it on the original scale
R_hat + colMeans(item_mat, na.rm=T)
# compare to original
item_mat
