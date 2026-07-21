# Crimson — Router Automation & Network Map Dashboard

FastAPI backend for automating network routers/switches and mapping network infrastructure (nodes, cables, coverage zones) on an OpenLayers + PostGIS map.

## Features

- **Router automation** — connect to devices via Netmiko (SSH/Telnet), run commands, view output
- **Scheduled jobs** — one-time and recurring command schedules (APScheduler)
- **Backups** — device config backup, backup scheduling, FTP export
- **Network map** — PostGIS-backed nodes (joints/buildings/clients/sites), cable segments, coverage zones, KMZ import
- **Auth** — JWT-based login, user management
- **Terminal** — live device terminal in-browser

## Stack

- **Backend:** FastAPI, SQLAlchemy, GeoAlchemy2 (PostGIS), APScheduler, Netmiko, python-jose, bcrypt
- **DB:** PostgreSQL + PostGIS
- **Frontend:** Vanilla JS, OpenLayers (map), served as static files

## Setup

```bash
pip install fastapi uvicorn sqlalchemy geoalchemy2 psycopg2-binary \
            apscheduler netmiko python-jose bcrypt python-dotenv
```

Create `.env` in project root:
```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
```

Load schema:
```bash
psql -U <user> -d <database> -f map-create.sql
```

Run:
```bash
uvicorn main:app --reload
```

App redirects `/` → `/static/login.html`. Map UI at `/static/map.html`.

## Project layout

```
controllers/   business logic per resource
models/        SQLAlchemy models (routers, devices, users, points, cables, coverage zones, backups, schedules...)
routes/        FastAPI routers, mounted in main.py
schemas/       Pydantic request/response schemas
dependencies/  auth dependency (get_current_user)
static/        login, home, map pages + JS/CSS
scheduler.py   APScheduler setup, loads active DB schedules on startup
database.py    SQLAlchemy engine/session
import_kmz.py  import KMZ map data into DB
hash_migration.py  password hash migration script
```

## Key API areas

| Router | Purpose |
|---|---|
| `/auth` | login, JWT |
| `/users` | user management |
| `/routers`, `/devices` | router/device inventory |
| `/commands`, `/execute` | run commands on devices |
| `/schedules`, `/onetime`, `/backup-schedule` | scheduled jobs |
| `/backup` | config backups |
| `/ftp` | FTP export |
| `/terminal` | live device terminal |
| `/points`, `/cable`, `/coverage-zones` | network map data (PostGIS) |

Most routes require a Bearer JWT (`dependencies.auth.get_current_user`).

## Notes

- `Нэгтгэсэн_КМЗ_2026он.kmz` — combined KMZ map data, importable via `import_kmz.py`
- `cursor-demo-file.txt` and `backup_session.log` look like stray dev artifacts — safe to remove or gitignore
- No `requirements.txt` committed — consider adding one (`pip freeze > requirements.txt`)
