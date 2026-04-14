FROM r-base:4.3.2

WORKDIR /app

COPY model/bayesian_model/bayesian_model.R model/bayesian_model/bayesian_model.R
COPY model/deploy/bayesian_service/plumber.R model/deploy/bayesian_service/plumber.R

RUN Rscript -e "install.packages('plumber', repos='https://cloud.r-project.org')"

CMD ["Rscript", "-e", "library(plumber); pr('model/deploy/bayesian_service/plumber.R') |> pr_run(host='0.0.0.0', port=8080)"]
