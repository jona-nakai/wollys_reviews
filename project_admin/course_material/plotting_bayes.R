# Use ggplot for plotting
library(ggplot2)

# Read in some real data
pokemon <- read.csv('pokedata_num.csv')
head(pokemon)

# Suppose we are interested in modeling the MAXIMUM value of a Pokemon's hp
poke_hp <- pokemon$hp
n <- length(poke_hp) # sample size
n
max_hp <- max(poke_hp) # the MLE
max_hp

# Define the prior distribution (Pareto)
prior <- function(theta, wedge=10, alpha=2) {
  # Prior only defined for theta >= wedge
  ifelse(theta >= wedge, ((alpha) * (wedge^alpha)) / (theta^(alpha + 1)), 0)
}

# Define the posterior distribution using log-space to prevent overflow
good_posterior <- function(theta, max_y, n, wedge=10, alpha=2) {
  alpha_star <- alpha + n
  wedge_star <- max(max_y, wedge)

  log_post <- ifelse(theta >= wedge_star,
                     log(alpha_star) + alpha_star * log(wedge_star) - (alpha_star + 1) * log(theta),
                     -Inf)

  exp(log_post)
}

# Generate the plot
sim_theta <- seq(1, 300, length.out = 1000)
prior_dist <- prior(sim_theta)
post_dist <- good_posterior(sim_theta, max_hp, n)

plot_df <- data.frame(theta = sim_theta, Prior = prior_dist, Posterior = post_dist)
ggplot(plot_df, aes(x = theta)) +
  geom_line(aes(y = Prior, color = 'red')) +
  geom_line(aes(y = Posterior, color = 'purple')) +
  labs(x = expression(theta), y = expression(p(theta))) +
  scale_color_manual(name = "Legend", values = c("red" = "red", "purple" = "purple"))

# Expected values
prior_mean <- 2 * 10 / (2 - 1)  # Prior mean (alpha * wedge / (alpha - 1))
MLE <- max_hp  # Maximum likelihood estimate
posterior_mean <- (2 + n) * max(max_hp, 10) / (2 + n - 1)  # Posterior mean

prior_mean
MLE
posterior_mean

ggplot(plot_df, aes(x = theta)) +
  geom_line(aes(y = Prior, color = 'red')) +
  geom_line(aes(y = Posterior, color = 'purple')) +
  geom_vline(xintercept = prior_mean, color = "red") +
  geom_vline(xintercept = MLE, color = "blue") +
  geom_vline(xintercept = posterior_mean, color = "purple") +
  labs(x = expression(theta), y = expression(p(theta))) +
  scale_color_manual(name = "Legend", values = c("red" = "red", "purple" = "purple"))

# What if we only had the first 10 pokemon?
sub_poke <- pokemon[1:10,]
poke_hp <- sub_poke$hp
n <- length(poke_hp)
n
max_hp <- max(poke_hp)
max_hp

sim_theta <- seq(1, 100, length.out = 1000)
prior_dist <- prior(sim_theta)
post_dist <- good_posterior(sim_theta, max_hp, n)

plot_df2 <- data.frame(theta = sim_theta, Prior = prior_dist, Posterior = post_dist)
ggplot(plot_df2, aes(x = theta)) +
  geom_line(aes(y = Prior, color = 'red')) +
  geom_line(aes(y = Posterior, color = 'purple')) +
  labs(x = expression(theta), y = expression(p(theta))) +
  scale_color_manual(name = "Legend", values = c("red" = "red", "purple" = "purple"))

# Updated expected values
prior_mean <- 2 * 10 / (2 - 1)
MLE <- max_hp
posterior_mean <- (2 + n) * max(max_hp, 10) / (2 + n - 1)

prior_mean
MLE
posterior_mean

ggplot(plot_df2, aes(x = theta)) +
  geom_line(aes(y = Prior, color = 'red')) +
  geom_line(aes(y = Posterior, color = 'purple')) +
  geom_vline(xintercept = prior_mean, color = "red") +
  geom_vline(xintercept = MLE, color = "blue") +
  geom_vline(xintercept = posterior_mean, color = "purple") +
  labs(x = expression(theta), y = expression(p(theta))) +
  scale_color_manual(name = "Legend", values = c("red" = "red", "purple" = "purple"))

# What if we change the prior?
prior_dist <- prior(sim_theta, wedge = 10, alpha = 50)
post_dist <- good_posterior(sim_theta, max_hp, n)

plot_df3 <- data.frame(theta = sim_theta, Prior = prior_dist, Posterior = post_dist)
ggplot(plot_df3, aes(x = theta)) +
  geom_line(aes(y = Prior, color = 'red')) +
  geom_line(aes(y = Posterior, color = 'purple')) +
  labs(x = expression(theta), y = expression(p(theta))) +
  scale_color_manual(name = "Legend", values = c("red" = "red", "purple" = "purple"))

prior_mean <- (50 * 1) / (50 - 1)
MLE <- max_hp
posterior_mean <- (50 + n) * max(max_hp, 1) / (50 + n - 1)

prior_mean
MLE
posterior_mean

ggplot(plot_df3, aes(x = theta)) +
  geom_line(aes(y = Prior, color = 'red')) +
  geom_line(aes(y = Posterior, color = 'purple')) +
  geom_vline(xintercept = prior_mean, color = "red") +
  geom_vline(xintercept = MLE, color = "blue") +
  geom_vline(xintercept = posterior_mean, color = "purple") +
  labs(x = expression(theta), y = expression(p(theta))) +
  scale_color_manual(name = "Legend", values = c("red" = "red", "purple" = "purple"))

