<div align="center">

# 🖼️ Distributed Image Processing System

### A distributed asynchronous image processing system built with Node.js, RabbitMQ, Redis, Docker, and Kubernetes

<br/>

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.x-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

# 📌 Overview

A distributed backend system that handles image uploads asynchronously through a message queue pipeline using RabbitMQ and distributed worker consumers.

The system processes images in the background using Sharp, stores metadata in MongoDB, caches statistics using Redis, and exposes real-time monitoring through a React dashboard.

This project demonstrates practical backend engineering concepts including:
- asynchronous job processing
- distributed workers
- retry handling
- dead letter queues
- Redis caching
- Docker containerization
- Kubernetes orchestration
- shared persistent storage
- secure upload validation
- admin-protected destructive operations

---

# ✨ Features

## Backend & Processing
- Multipart image upload API
- Asynchronous queue-based processing using RabbitMQ
- Distributed worker consumers
- Image resizing and compression using Sharp
- Retry mechanism for failed jobs
- Dead Letter Queue (DLQ) support
- Worker heartbeat monitoring
- Application-level priority-based job scheduling
- Upload validation — file size limit (10MB) and image-type verification (extension, MIME type, and magic-byte signature check) to block disguised/executable files
- Admin-protected routes (`/admin/reset`, `/clear-failed`) secured via a shared secret key

## Dashboard & Monitoring
- Real-time job monitoring
- Queue statistics
- Worker tracking
- Original and processed image preview
- Analytics charts using Recharts
- Admin key input for protected actions (key is held only in browser session state, never hardcoded or stored)

## Infrastructure & DevOps
- Dockerized architecture
- Kubernetes deployment using Minikube
- NGINX Ingress routing
- Shared PersistentVolumeClaim for images
- Horizontally scalable workers
- Kubernetes Secret-based credential management for admin key

---

# 🧠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Queue System | RabbitMQ |
| Cache | Redis |
| Image Processing | Sharp, Multer, file-type |
| Frontend | React, Vite, Tailwind CSS |
| Charts | Recharts |
| Containerization | Docker |
| Orchestration | Kubernetes, Minikube |
| Ingress | NGINX Ingress Controller |

---

# 📂 Project Structure

```bash
distributed-task-processor/
│
├── app.js
├── worker.js
├── Dockerfile
├── Dockerfile.worker
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
│
├── uploads/
├── processed/
│
├── dashboard/
│   └── src/
│
└── k8s/
    ├── backend.yaml
    ├── frontend.yaml
    ├── worker.yaml
    ├── mongo.yaml
    ├── rabbitmq.yaml
    ├── redis.yaml
    ├── storage.yaml
    └── ingress.yaml
```

---

# 🏗️ System Architecture

<p align="center">
  <img src="assets/system-architecture.png" width="100%" alt="System Architecture Diagram"/>
</p>

The system consists of three major layers:

- **API Layer** → Accepts uploads and sends jobs to RabbitMQ
- **Worker Layer** → Consumes jobs and processes images
- **Data Layer** → MongoDB, Redis, RabbitMQ, and Persistent Storage

The frontend dashboard communicates with the backend through Kubernetes Ingress routing.

---

# 🔄 Job Processing Workflow

<p align="center">
  <img src="assets/workflow-diagram.png" width="100%" alt="Workflow Diagram"/>
</p>

## Workflow Steps

1. User uploads image through dashboard or API
2. Backend validates the file (size ≤ 10MB, real image type confirmed via extension, MIME type, and magic-byte signature)
3. Backend stores image inside `uploads/`
4. Job metadata is stored in MongoDB
5. Job message is pushed to RabbitMQ
6. Worker consumes the message
7. Worker processes image using Sharp
8. Processed image is stored inside `processed/`
9. Job status is updated in MongoDB
10. Dashboard fetches live updates

---

# ☸️ Kubernetes Architecture

<p align="center">
  <img src="assets/kubernetes-deployment-architecture.png" width="100%" alt="Kubernetes Architecture"/>
</p>

The application runs inside a Kubernetes cluster using Minikube.

Each service runs independently:
- Backend Deployment
- Frontend Deployment
- Worker Deployment
- MongoDB Deployment
- RabbitMQ Deployment
- Redis Deployment

NGINX Ingress routes:
- `/api/*` → backend service
- `/` → frontend service

Workers and backend share the same PersistentVolumeClaim for image access.

Admin credentials (`ADMIN_SECRET`) are stored as a Kubernetes Secret and injected into the backend pod as an environment variable — never hardcoded in manifests or source code.

---

# ♻️ Retry Logic & Dead Letter Queue

<p align="center">
  <img src="assets/retry-and-dlq-workflow.png" width="100%" alt="Retry and DLQ Workflow"/>
</p>

If image processing fails:
- Retry count increases
- Job is retried up to 3 times
- Failed jobs move to the Dead Letter Queue (`failed_jobs`)

This prevents infinite retry loops and keeps failed jobs isolated.

> **Note:** This system intentionally simulates a 10% success rate per processing attempt to demonstrate retry and DLQ behavior under realistic failure conditions. This is by design, not a bug — it showcases how the system gracefully handles and isolates failures rather than crashing or hanging.

---

# ⚡ Redis Caching

Redis is used for:
- Dashboard statistics caching
- Queue statistics caching
- Reducing repeated MongoDB queries

Short TTL values help maintain near real-time data.

---

# 👷 Worker System

Workers are independent Node.js consumers connected to RabbitMQ.

Each worker:
- consumes one job at a time
- processes images using Sharp
- updates MongoDB
- sends heartbeat updates

Workers can be scaled horizontally:

```bash
kubectl scale deployment worker --replicas=5 -n image-system
```

With multiple replicas, RabbitMQ distributes jobs across workers using round-robin dispatch combined with `prefetch(1)`, so load is shared evenly rather than handled by a single worker.

---

# 🔐 Security Features

## Upload Validation

Every uploaded file is checked against three layers before a job is ever created:

1. **Size limit** — rejects files over 10MB
2. **Extension + MIME type filtering** — only `.png`, `.jpg`, `.jpeg`, `.webp` with matching `Content-Type` are accepted
3. **Magic-byte verification** — the actual binary signature of the saved file is inspected (via the `file-type` package) to catch disguised or renamed non-image files (e.g. an executable renamed to `photo.jpg`)

Invalid files are deleted immediately and rejected with a `400` response before any database write or queue message occurs.

## Admin Authentication

The following routes require an `x-admin-key` header matching the server's `ADMIN_SECRET`:

- `POST /api/jobs/admin/reset`
- `POST /api/jobs/clear-failed`

Requests without a valid key receive a `403 Unauthorized` response.

```bash
curl -X POST http://<MINIKUBE-IP>/api/jobs/admin/reset \
  -H "x-admin-key: your-secret-here"
```

In the dashboard, the admin key is entered once into an input field in the Admin Actions panel. It is held only in React component state for that browser session — it is never hardcoded into the frontend bundle, never persisted to local storage, and never committed to source control.

**Note:** Docker Compose and Minikube use separate, independent secret stores:
- Compose reads `ADMIN_SECRET` from `.env` / `docker-compose.yml`
- Minikube reads it from a Kubernetes Secret (see setup steps below)

Keep both in sync manually if testing the same key across both environments.

---

# 🐳 Docker Setup

## Build Images

```bash
docker build -t distributed-task-processor-backend:v5 .
docker build -f Dockerfile.worker -t distributed-task-processor-worker:v2 .
docker build -t distributed-task-processor-frontend:v4 ./dashboard
```

> Image tags here must match whatever tags are referenced in `k8s/*.yaml` if you plan to deploy the same build to Minikube later. Update both consistently if you change versions.

## Run System

```bash
docker compose up --build
```

## Stop System

```bash
docker compose down
```

## Restart a Single Service (e.g. after a code change)

```bash
docker compose build backend
docker compose up -d --force-recreate backend
```

---

# ☸️ Kubernetes Setup

## Start Minikube

```bash
minikube start --driver=docker --memory=4096 --cpus=4
```

## Enable Ingress

```bash
minikube addons enable ingress
```

## Point Docker at Minikube's Internal Daemon

Required so images built locally are visible inside the cluster (manifests use `imagePullPolicy: Never`):

```bash
eval $(minikube docker-env)
```

To switch back to your host's Docker daemon later:

```bash
eval $(minikube docker-env -u)
```

## Build Images Inside Minikube's Daemon

```bash
docker build -t distributed-task-processor-backend:v5 .
docker build -f Dockerfile.worker -t distributed-task-processor-worker:v2 .
docker build -t distributed-task-processor-frontend:v4 ./dashboard
```

## Create Namespace

```bash
kubectl create namespace image-system
```

## Create Admin Secret

```bash
kubectl create secret generic backend-secrets \
  --from-literal=ADMIN_SECRET='your-secret-here' \
  -n image-system
```

## Deploy Kubernetes Resources

```bash
kubectl apply -f k8s/ -n image-system
```

## Access Application

```bash
minikube ip
```

Open:

```bash
http://<MINIKUBE-IP>
```

## Useful Verification Commands

```bash
# Check all pods are Running
kubectl get pods -n image-system

# Check ingress controller is healthy
kubectl get pods -n ingress-nginx

# Tail logs for a specific pod
kubectl logs <pod-name> -n image-system

# Describe a pod (useful for ImagePullBackOff / CrashLoopBackOff debugging)
kubectl describe pod <pod-name> -n image-system

# Force a pod to pick up a freshly built image under the same tag
kubectl rollout restart deployment/<deployment-name> -n image-system

# Watch rollout status
kubectl rollout status deployment/<deployment-name> -n image-system

# Check PVC is Bound (not Pending)
kubectl get pvc -n image-system

# Temporarily access backend directly, bypassing Ingress (debugging only)
kubectl port-forward svc/backend 5000:5000 -n image-system
```

## Stopping and Resuming the Cluster

```bash
# Pause the cluster (keeps all state/data)
minikube stop

# IMPORTANT: reset your shell back to host Docker after building inside Minikube
eval $(minikube docker-env -u)
```

```bash
# Resume later
minikube start

# Confirm everything came back healthy
kubectl get pods -n image-system
kubectl get pods -n ingress-nginx
```

> After a `minikube stop` / `minikube start` cycle, all pods restart along with the node — an increased `RESTARTS` count in `kubectl get pods` is expected and not a sign of a crash. If the ingress controller pod looks unhealthy after a restart, re-cycling the addon usually resolves it:
> ```bash
> minikube addons disable ingress
> minikube addons enable ingress
> ```

---

# 📤 API Endpoints

## Upload Image

```bash
curl -X POST http://<MINIKUBE-IP>/api/jobs/upload \
  -F "image=@/path/to/image.png"
```

Rejected automatically if the file is over 10MB or is not a verified image type.

## Add Manual Job

```bash
curl -X POST http://<MINIKUBE-IP>/api/jobs/add
```

## Get Jobs

```bash
curl http://<MINIKUBE-IP>/api/jobs
```

## Get Statistics

```bash
curl http://<MINIKUBE-IP>/api/jobs/stats
```

## Get Queue Statistics

```bash
curl http://<MINIKUBE-IP>/api/jobs/queue-stats
```

## Get Active Workers

```bash
curl http://<MINIKUBE-IP>/api/jobs/workers
```

## Admin: Clear Failed Jobs (requires admin key)

```bash
curl -X POST http://<MINIKUBE-IP>/api/jobs/clear-failed \
  -H "x-admin-key: your-secret-here"
```

## Admin: Reset System (requires admin key)

```bash
curl -X POST http://<MINIKUBE-IP>/api/jobs/admin/reset \
  -H "x-admin-key: your-secret-here"
```

Purges both RabbitMQ queues (`jobQueue`, `failed_jobs`) and deletes all job documents from MongoDB.

---

# 🔥 Load Testing

## Upload Same Image 50 Times

```bash
for i in {1..50}; do
  curl -X POST http://<MINIKUBE-IP>/api/jobs/upload \
    -F "image=@/home/kunal/Downloads/testing1.png" &
done
wait
```

> Replace the file path with your own local test image. Note that the API is rate-limited (100 requests per second per IP via `express-rate-limit`) — large burst tests beyond this threshold will receive `429 Too Many Requests` responses by design, not as an error.

## Test Upload Validation Rejection

```bash
# Oversized file (should be rejected if over 10MB)
curl -X POST http://<MINIKUBE-IP>/api/jobs/upload \
  -F "image=@/path/to/large-file.png"

# Disguised non-image file (should be rejected regardless of extension)
curl -X POST http://<MINIKUBE-IP>/api/jobs/upload \
  -F "image=@/path/to/notes.txt"
```

---

# 📊 Dashboard Features

The dashboard provides:
- Live queue monitoring
- Job status tracking
- Worker activity tracking
- Original image preview
- Processed image preview
- Analytics charts
- Failed job tracking
- Admin key input for protected actions (Clear Failed, Reset)

---

# 🚀 Future Improvements

- Horizontal Pod Autoscaler (HPA)
- JWT Authentication
- Prometheus + Grafana Monitoring
- WebSocket Live Updates
- CI/CD Pipelines
- Object Storage Integration
- Native RabbitMQ Priority Queues
- Magic-byte verification extended to processed output files
- Total-time-to-resolution metrics surfaced separately from per-attempt processing time

---

# 📚 Learning Outcomes

This project helped in understanding:
- Distributed systems
- Asynchronous processing
- Message queues
- Worker scaling
- Docker containerization
- Kubernetes deployments
- Persistent storage
- Redis caching
- Fault-tolerant systems
- Secure file upload handling
- Secrets management across local (Compose) and cluster (Kubernetes) environments
- Debugging race conditions in distributed message consumers

---

# 🧭 Project Journey

This project went through a full build → debug → harden cycle, verified end-to-end across both Docker Compose and Minikube:

1. **Initial build** — backend, worker, frontend, and infrastructure (MongoDB, RabbitMQ, Redis) containerized and wired together with a message-queue-driven processing pipeline.
2. **Compose verification** — confirmed all services start cleanly together, the upload → queue → worker → completion pipeline works end-to-end, and the dashboard correctly reflects live state.
3. **Frontend routing fix** — diagnosed and fixed a missing `/api` reverse-proxy rule in the dashboard's nginx config, which had been silently returning the SPA's `index.html` instead of proxying API calls to the backend.
4. **Worker race condition fix** — identified and fixed a bug where the worker matched "any pending job" instead of the specific job tied to its RabbitMQ message, which could leave jobs orphaned in a `processing` state under concurrent load with no message left to drive their retry cycle.
5. **Dashboard accuracy fix** — corrected the job duration calculation to measure total time from job creation (including all retries and queue wait time) rather than only the final successful attempt.
6. **Security hardening** — added multi-layered upload validation (size limit, extension/MIME filtering, magic-byte signature verification) and admin-key authentication on destructive routes (`reset`, `clear-failed`), backed by Kubernetes Secrets in the cluster and `.env` locally.
7. **Kubernetes verification** — deployed the full stack to Minikube, confirmed Ingress routing for both `/api` and `/` paths, verified worker replicas correctly share load via RabbitMQ round-robin dispatch, and confirmed admin authentication and upload validation both function identically inside the cluster as they do locally.

---

# 👨‍💻 Author

**Kunal Jambhale**

[![GitHub](https://img.shields.io/badge/GitHub-kunaljambhale06-181717?style=flat-square&logo=github)](https://github.com/kunaljambhale06)

---

<div align="center">

⭐ Star this repo if you found it useful.

</div>