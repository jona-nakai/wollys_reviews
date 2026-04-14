FROM rocker/r-ver:4.3.2

WORKDIR /app

RUN Rscript -e "install.packages('plumber', repos='https://packagemanager.posit.co/cran/__linux__/jammy/latest')" && \
    Rscript -e "library(plumber); cat('plumber installed OK\n')"

COPY model/bayesian_model/bayesian_model.R model/bayesian_model/bayesian_model.R
COPY model/deploy/bayesian_service/plumber.R model/deploy/bayesian_service/plumber.R

CMD ["Rscript", "-e", "library(plumber); pr('model/deploy/bayesian_service/plumber.R') |> pr_run(host='0.0.0.0', port=as.integer(Sys.getenv('PORT', 8080)))"]
