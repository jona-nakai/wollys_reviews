# Wolly's Reviews

A sandwich review and recommendation website for Wollaston's Market at Northeastern University. Built for DS4420: Machine Learning and Data Mining 2.

Users rate sandwiches on a 1–5 scale (0.5 increments). The recommendation engine predicts ratings for sandwiches a user hasn't tried using a two-stage pipeline: item-based collaborative filtering followed by a Bayesian Dirichlet-Categorical model.

---

## IMPORTANT NOTE FOR GRADERS

We were given permission to use generative AI in order to build and deploy the website by professor Gerber. Code found in the website/ and model/deploy/ direction was generated with the assistance of generative AI. Code found in model/cf_model/ and model/bayesian/model/ were coded by team members, not generative AI.

---

## Stack

- **Frontend:** React + Vite, Firebase Auth, Firestore
- **CF Model:** Python (FastAPI) — item-item collaborative filtering
- **Bayesian Model:** R (Plumber) — Dirichlet-Categorical model with CF-informed prior
- **Deployment:** Google Cloud Run (two separate containers)

---

## Project Structure

```
wollys_reviews/
├── website/                        # React frontend
├── model/
│   ├── cf_model/                   # Item-item CF model (Python)
│   │   └── cf_model.py
│   ├── bayesian_model/             # Dirichlet-Categorical model (R)
│   │   └── bayesian_model.R
│   └── deploy/
│       ├── cf_service/             # FastAPI service
│       │   ├── main.py
│       │   ├── requirements.txt
│       │   └── Dockerfile
│       └── bayesian_service/       # Plumber service
│           ├── plumber.R
│           ├── packages.R
│           └── Dockerfile
└── project_admin/                  # Course materials and guidelines
```

---

## Local Development

### Prerequisites

- Python 3.11+
- R 4.3+
- Node.js 20+ and npm
- Google Cloud SDK (`gcloud`)

### 1. Frontend

```bash
cd website
npm install
```

Create `website/.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

```bash
npm run dev
```

### 2. Model — Local Testing

Generate data files from the ratings CSV, obtained via Google Forms (run from repo root):

```bash
python model/cf_model/cf_model.py
```

This produces `model/data/item_similarities.csv`, `model/data/ratings_long.csv`, and `model/data/cf_predictions.csv`.

Run the Bayesian model evaluation:

```bash
Rscript model/bayesian_model/test.R
```

This prints CF RMSE vs Bayesian RMSE on held-out ratings.

### 3. Services — Local Testing

Authenticate with Google Cloud (to access Firestore):

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your_firebase_project_id
```

Install Python dependencies:

```bash
pip install -r model/deploy/cf_service/requirements.txt
```

Install R dependencies:

```bash
Rscript -e "install.packages('plumber', repos='https://cloud.r-project.org')"
```

Terminal 1 — start the Bayesian (Plumber) service on port 8000:

```bash
Rscript -e "library(plumber); pr('model/deploy/bayesian_service/plumber.R') |> pr_run(port=8000)"
```

Terminal 2 — start the CF (FastAPI) service on port 8080:

```bash
uvicorn model.deploy.cf_service.main:app --host 0.0.0.0 --port 8080
```

Terminal 3 — test a prediction:

```bash
curl -X POST http://localhost:8080/predict \
  -H "Content-Type: application/json" \
  -d '{"user_id": "FIREBASE_USER_UID"}'
```

Response: predicted ratings for all sandwiches the user hasn't rated yet.

---

## Production Deployment

Both services deploy automatically to Google Cloud Run via Cloud Build triggers on push to `main`.

- **CF service:** `wollys-reviews-cf` (public, us-east4)
- **Bayesian service:** `wollys-reviews-bayesian` (IAM-authenticated, us-east4)

The CF service calls the Bayesian service internally. The frontend only talks to the CF service.

### Environment Variables (CF service)

| Variable | Value |
|----------|-------|
| `BAYESIAN_SERVICE_URL` | Cloud Run URL of the Bayesian service |
| `GOOGLE_CLOUD_PROJECT` | Firebase project ID |

### Docker builds

Both Dockerfiles must be built from the repo root:

```bash
docker build -f model/deploy/cf_service/Dockerfile -t cf-service .
docker build -f model/deploy/bayesian_service/Dockerfile -t bayesian-service .
```
