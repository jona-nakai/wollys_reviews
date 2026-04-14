FROM python:3.11-slim

WORKDIR /app

COPY model/cf_model/ model/cf_model/
COPY model/deploy/cf_service/requirements.txt model/deploy/cf_service/requirements.txt
COPY model/deploy/cf_service/main.py model/deploy/cf_service/main.py

RUN pip install --no-cache-dir -r model/deploy/cf_service/requirements.txt

ENV BAYESIAN_SERVICE_URL=""

CMD ["uvicorn", "model.deploy.cf_service.main:app", "--host", "0.0.0.0", "--port", "8080"]
