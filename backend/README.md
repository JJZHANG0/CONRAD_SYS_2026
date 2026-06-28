# Portfolio Builder Backend

Django 5 + DRF API for Conrad Challenge Innovation Growth Portfolio Builder.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

## API Docs

- Swagger UI: http://localhost:8000/api/docs/
- OpenAPI schema: http://localhost:8000/api/schema/

## Apps

- `accounts` — User model, JWT auth, registration
- `portfolios` — Portfolio projects, page data, completion
- `uploads` — Image upload, JSON/PDF export
- `reviews` — Teacher page reviews

## Seed Data

```bash
python manage.py seed_demo
```

Creates demo users and a sample Mimo Smart Pillow portfolio.
