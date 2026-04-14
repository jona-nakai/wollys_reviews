FROM r-base:4.3.2

WORKDIR /app

COPY model/bayesian_model/bayesian_model.R model/bayesian_model/bayesian_model.R
COPY model/deploy/bayesian_service/plumber.R model/deploy/bayesian_service/plumber.R

RUN Rscript -e "install.packages('plumber', repos='https://cloud.r-project.org', lib='/usr/local/lib/R/site-library')"

CMD ["Rscript", "-e", "library(plumber, lib.loc='/usr/local/lib/R/site-library'); pr('model/deploy/bayesian_service/plumber.R') |> pr_run(host='0.0.0.0', port=as.integer(Sys.getenv('PORT', 8080)))"]
