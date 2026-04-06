# Smart Corridor Display

Welcome to the **Smart Corridor Display** project. This full-stack application provides a signage and dynamic display system designed to seamlessly manage and broadcast announcements, events, and media across smart TVs and displays. It provides role-based access for admins and designated clients to manage content, all backed by a scalable, async-capable infrastructure.

This guide is designed to help you thoroughly understand the robust infrastructure backing this application: **Docker**, **PostgreSQL**, and **Redis**.

---

## 🏗️ Architecture Overview

The system is separated into two domains:
1. **Frontend (React / Vite)**: Single-page application handling the Admin dashboard, Client portals, and the real-time Display screen for the TV.
2. **Backend (Django REST Framework)**: The main API orchestrating data persistence, user auth, and serving media.

### The Backend Services Ecosystem

To make the backend reliable and easy to deploy, we use **Docker Compose** (`backend_v2/docker-compose.yml`). Docker spins up 5 inter-connected "containers" (isolated mini-servers):

1. **`db` (Postgres)**: Holds all persistent relational data (Users, Events, Announcements).
2. **`redis`**: An in-memory data store acting as our message broker and cache.
3. **`backend` (Django)**: The main web server processing HTTP requests.
4. **`celery`**: A background worker that listens to Redis for complex async tasks (like video processing or bulk email).
5. **`celery-beat`**: A cron-like scheduler that triggers periodic tasks automatically.

---

## 🐳 Step-by-Step: Managing Docker

Docker Compose manages the lifecycle of your entire backend application.

### Starting and Stopping the Project

1. **Open your terminal** and navigate to the backend directory:
   ```bash
   cd backend_v2
   ```

2. **Start all services in the background**:
   ```bash
   docker-compose up -d --build
   ```
   > *Note: `-d` means "detached" (runs in the background), and `--build` forces Docker to compile any recent code changes.*

3. **Check the status of your services**:
   ```bash
   docker-compose ps
   ```
   *You should see `tv_db`, `tv_redis`, `tv_backend`, `tv_celery`, and `tv_celery_beat` as "**Up**" or "**Healthy**".*

4. **Stop all services**:
   ```bash
   docker-compose down
   ```

### Reading the Logs
If the backend crashes or you want to see request traffic:
```bash
# View logs for the Django backend server
docker-compose logs -f backend

# View logs for the Celery background worker
docker-compose logs -f celery
```
*(Press `Ctrl+C` to exit the live log view).*

---

## 🐘 Step-by-Step: Exploring PostgreSQL (Database)

PostgreSQL is a powerful relational database. Your main Django models (`User`, `Announcement`, `Event`, `Media`) live here. The database files are safely stored in a Docker volume, meaning data persists even if you destroy the container.

### How to access the database directly (Using `psql`)

You can jump straight into the PostgreSQL command line inside the running container:

1. **Connect to the database via Docker**:
   ```bash
   docker-compose exec db psql -U tvuser -d tvdb
   ```
2. **List all tables**:
   Once inside the `psql` prompt, type:
   ```sql
   \dt
   ```
   *You will see tables like `core_user`, `core_announcement`, `core_media`, etc.*

3. **Query data**:
   Write standard SQL queries to view your records:
   ```sql
   SELECT id, username, role FROM core_user;
   SELECT title, status, file_type FROM core_media;
   ```
4. **Exit the database**:
   ```sql
   \q
   ```

### Managing data using Django (`manage.py`)

Usually, it's safer to interact with the database using Django's built-in tools. Run these from your terminal:

- **Create a superuser (Admin)**:
  ```bash
  docker-compose exec backend python manage.py createsuperuser
  ```
- **Apply Database Migrations** *(do this if you ever change `models.py`)*:
  ```bash
  docker-compose exec backend python manage.py makemigrations
  docker-compose exec backend python manage.py migrate
  ```
- **Open the Django interactive shell** *(great for writing Python to test data)*:
  ```bash
  docker-compose exec backend python manage.py shell
  ```

---

## ⚡ Step-by-Step: Understanding Redis (Cache & Broker)

**Redis** stores data inside system RAM, making it incredibly fast. In this project, Redis performs two critical jobs:
1. **Caching**: Storing frequently accessed API responses (like the active TV schedule) so Django doesn't have to query PostgreSQL repeatedly.
2. **Message Broker**: When Django needs to run a heavy task, it sends a "message" to Redis. The `celery` container listens to Redis, picks up the message, and processes the task in the background.

### How to view Redis data directly

1. **Open the Redis CLI inside the container**:
   ```bash
   docker-compose exec redis redis-cli
   ```
2. **Test if Redis is responding**:
   ```bash
   ping
   ```
   *(It should reply with `PONG`)*.
3. **View all stored keys in the cache**:
   ```bash
   keys *
   ```
   *(You'll likely see keys related to Celery queues or Django cache).*
4. **Flush / Clear the entire cache** *(useful if the frontend is stuck showing old data)*:
   ```bash
   flushall
   ```
5. **Exit Redis CLI**:
   ```bash
   exit
   ```

---

## 🚀 Running the Frontend (React / Vite)

While Docker handles your backend environment flawlessly, the React frontend is run via Node.js natively on your machine for the best development experience.

1. **Open a new terminal tab** and navigate to the project root (where `package.json` lives).
2. **Install dependencies** (only required the first time or if `package.json` changes):
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```

You can now visit:
- **`http://localhost:5173/`** - The Frontend application.
- **`http://localhost:5173/admin`** - The Admin dashboard.
- **`http://localhost:5173/display`** - The TV Display receiver.
- **`http://localhost:8000/api/`** - The deployed Django REST framework backing the app.

---

> **✨ Troubleshooting Note**: If you ever see `relation "auth_user" does not exist` or a `500 Server Error`, it means your PostgreSQL tables haven't been created yet. Fix this by running `docker-compose exec backend python manage.py migrate`. All system errors have been fully audited and resolved for a complete deployment.
