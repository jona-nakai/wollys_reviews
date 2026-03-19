# Wolly's Reviews
A website to review and recommend sandwiches at Wollaston's NEU for Professor Gerber's DS4420: Machine Learning and Data Mining 2 Course

## Prerequisites
- Python 3.10+
- Node.js 20+ and npm

## Run Project

1. Clone the server repository:

```bash
git clone <repository-url>
cd wollys_reviews
```

2. Install frontend dependencies
```bash
cd website
npm install
```

3. Configure Firebase
Create a `.env` file inside the `website/` folder with your Firebase project credentials:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Run the frontend
```bash
npm run dev
'''