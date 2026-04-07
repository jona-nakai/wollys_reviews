library(MASS)
library(mvnfast)
library(ggplot2)
library(plotly)

# Extract relevant blocks for conditional distribution p(y1| y2 , y3, y4)
mu_a <- 64
mu_b <- matrix(c(47, 101, 69), ncol = 1)

Sigma_aa <- 800
Sigma_bb <- matrix(c(1430, 2810, 200,
                     2810, 17240, 190,
                     200, 190, 730), nrow = 3, byrow = TRUE)

Sigma_ab <- matrix(c(260, 1670, -30), nrow = 1)

y_b <- matrix(c(16, 14, 35), ncol = 1)

# Compute conditional mean and covariance for p(y1| y2 , y3, y4)
Sigma_bb_inv <- solve(Sigma_bb)
mu_agb <- (mu_a + Sigma_ab %*% Sigma_bb_inv %*% (y_b - mu_b))
Sigma_agb <- (Sigma_aa - Sigma_ab %*% Sigma_bb_inv %*% t(Sigma_ab))

print(mu_agb)
print(Sigma_agb)

# Cubone's actual health
cubone_health <- 50

# Generate x1 values for plotting
x_line <- seq(c(mu_agb - 3 * sqrt(Sigma_agb)),
              c(mu_agb + 3 * sqrt(Sigma_agb)),
              length.out = 100)

# Compute probability density function
p_agb <- dnorm(x_line, mean = mu_agb, sd = sqrt(Sigma_agb))

# Plot the estimated biological age distribution
ggplot() +
  geom_line(aes(x = x_line, y = p_agb), color = "blue") +
  geom_vline(aes(xintercept = cubone_health), color = "red", linetype = "dashed") +
  geom_vline(aes(xintercept = mu_agb), color = "green", linetype = "dotted") +
  labs(x = "Health", y = "Probability Density",
       title = "Estimated Cubone Health Distribution")

# Correlation between pokemon health and weight
rho_13 <- 1670 / (sqrt(800) * sqrt(17240))
print(rho_13)

# Extract relevant blocks for conditional distribution p(x2, x3 | x1, x4)
mu_a <- matrix(c(47, 101), ncol = 1)
mu_b <- matrix(c(64, 69), ncol = 1)

Sigma_aa <- matrix(c(1430, 2810,
                     2810, 17240), nrow = 2, byrow = TRUE)

Sigma_bb <- matrix(c(800, -30,
                     -30, 730), nrow = 2, byrow = TRUE)

Sigma_ab <- matrix(c(260, 200,
                     1670, 190), nrow = 2, byrow = TRUE)

y_a <- matrix(c(16, 14), ncol = 1) # Cubone's actual height and weight
y_b <- matrix(c(50, 35), ncol = 1)

# Compute conditional mean and covariance for p(y2, y3 | y1, y4)
Sigma_bb_inv <- solve(Sigma_bb)
mu_agb <- mu_a + Sigma_ab %*% Sigma_bb_inv %*% (y_b - mu_b)
Sigma_agb <- Sigma_aa - Sigma_ab %*% Sigma_bb_inv %*% t(Sigma_ab)

print(mu_agb)
print(Sigma_agb)

# Generate grid
x2_vals <- seq(-50, 160, by = 1)
x3_vals <- seq(-50, 160, by = 1)
grid <- expand.grid(x2 = x2_vals, x3 = x3_vals)

# Compute the probability density function
py_values <- dmvn(as.matrix(grid), mu = mu_agb, sigma = Sigma_agb)

# Reshape the density values into a matrix for plotting
py_matrix <- t(matrix(py_values, nrow = length(x2_vals), ncol = length(x3_vals)))

# Create 3D surface plot
fig <- plot_ly(
  x = x2_vals, y = x3_vals, z = py_matrix,
  type = "surface") %>%
  layout(
    title = "Cubone Height/Weight Normal Distribution",
    scene = list(
      xaxis = list(title = "Height (cm)"),
      yaxis = list(title = "Weight (kg)"),
      zaxis = list(title = "Probability Density")
    )
  )

# Plot Cubone's location
cubone_pdf_value <- dmvn(as.numeric(y_a), mu = as.numeric(mu_agb), sigma = Sigma_agb)
fig <- fig %>%
  add_trace(
    x = y_a[1], y = y_a[2], z = cubone_pdf_value,
    type = "scatter3d", mode = "markers",
    marker = list(size = 6, color = "red"),
    name = "Cubone location"
  )

# And the mean
fig <- fig %>%
  add_trace(
    x = mu_agb[1], y = mu_agb[2], z = dmvn(as.numeric(mu_agb), mu = as.numeric(mu_agb), sigma = Sigma_agb),
    type = "scatter3d", mode = "markers",
    marker = list(size = 6, color = "blue"),
    name = expression(mu[agb])
  )

fig

