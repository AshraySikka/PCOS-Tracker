# PCOS Tracker

A full-stack PWA for women managing PCOS. AI-powered meal planning, exercise plans, daily logging, and health insights.

## Stack

- **Backend:** Django + Django REST Framework
- **Frontend:** React + Vite
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (Anthropic)
- **Images:** Unsplash API
- **Hosting:** Render (backend) + Vercel (frontend)

## Local Setup

### Prerequisites
- Python 3.13+
- Node 20+

### Backend

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
cd backend
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
cd backend
../venv/bin/pytest
```

## Branch Strategy

- `main` — production only
- `develop` — integration branch, all PRs merge here
- `feature/issue-number-description` — one branch per issue

## Project Structure
    PCOS-Tracker/
    ├── backend/          # Django project
    │   ├── core/         # Settings, URLs, WSGI
    │   ├── tests/        # pytest test suite
    │   └── manage.py
    ├── frontend/         # React + Vite
    ├── .env.example      # Environment variable template
    ├── requirements.txt
    └── README.md

## Demo account

A passwordless demo user (Jane) with about five months of seed data is available from the login page ("Try the demo as Jane") or through the link:

```
GET /api/auth/demo-login/
```

That endpoint redirects to the frontend `/demo` page, which signs the visitor in and opens the dashboard. Jane's data is rebuilt automatically when it goes stale, and you can rebuild it by hand:

```bash
cd backend
python manage.py seed_demo
```

AI features (food estimates, meal and exercise plan generation) are switched off for the demo account unless `DEMO_ALLOW_AI=True`.
