# AI-Powered Surface Defect Detection System

> Automated visual quality inspection using transfer learning — replacing manual surface
> inspection with a consistent, auditable, and explainable AI pipeline.

---

## Overview

A full-stack machine learning system built during a 6-week software engineering internship.
The system detects surface defects across multiple material types using a fine-tuned ResNet-50
model, served through a microservices architecture with real-time Grad-CAM explainability.

A quality inspector examines hundreds of surface samples per shift. Accuracy degrades with
fatigue, results vary between inspectors, and there is no digital record of decisions made.
This system addresses all three problems.

**Supported surface types:** Ceramic tile · Carpet · Leather · Wood

---

## Demo

> Upload a surface image → instant PASS / FAIL verdict → confidence score → Grad-CAM heatmap

```text
┌─────────────────┐     POST /api/inspect      ┌──────────────────────┐
│  React Web App  │ ─────────────────────────► │  Node.js / Express   │
│  TypeScript     │ ◄───────────────────────── │  Auth · Logging      │
└─────────────────┘     JSON result            └──────────┬───────────┘
                                                          │ POST /predict-explain
                                                          ▼
                                               ┌──────────────────────┐
                                               │  FastAPI Microservice│
                                               │  ResNet-50 + PyTorch │
                                               │  Grad-CAM Explainer  │
                                               └──────────┬───────────┘
                                                          │
                                               ┌──────────▼───────────┐
                                               │    MongoDB Atlas     │
                                               │  Inspection Logs     │
                                               └──────────────────────┘
```
---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account
- Docker + Docker Compose (recommended)
- NVIDIA GPU recommended for training (Google Colab T4 works)

### Option A — Run with Docker Compose (recommended)

```bash
git clone https://github.com/msaadirfan-max/ai-surface-defect-detection-system.git
cd ai-surface-defect-detection-system

# Copy and fill in environment variables
cp backend/.env.example backend/.env

# Start all services
docker-compose up --build
```

Open `http://localhost:5173`

### Option B — Run manually

**1. Clone the repository**

```bash
git clone https://github.com/msaadirfan-max/ai-surface-defect-detection-system.git
cd ai-surface-defect-detection-system
```

**2. Download the trained model**

Download `best_model_mvtec.pth` from the
[latest release](https://github.com/msaadirfan-max/ai-surface-defect-detection-system/releases)
and place it in `ai-service/`.

**3. Set environment variables**

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-qa-system
JWT_SECRET=your_secret_key_here
FASTAPI_URL=http://localhost:8000
PORT=5000
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_FASTAPI_URL=http://localhost:8000
```

**4. Run the AI microservice**

```bash
cd ai-service
uv venv
uv run uvicorn fast_api.main:app --reload --host 0.0.0.0 --port 8000
```

**5. Run the backend**

```bash
cd backend
npm install
npm run dev
```

**6. Run the frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Create account |
| `POST` | `/auth/login` | None | Login, returns JWT |
| `POST` | `/api/inspect` | User | Upload image → prediction + Grad-CAM saved |
| `GET` | `/api/inspections` | User | Paginated personal inspection history |
| `GET` | `/api/inspections/:id` | User | Single inspection record |
| `GET` | `/api/admin/stats` | Admin | System-wide analytics |
| `GET` | `/api/admin/inspections` | Admin | All users' inspections |
| `GET` | `/api/admin/users` | Admin | All user accounts |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Change user role |

---

## Inference Pipeline

When an image reaches `POST /api/inspect`, this sequence runs:

1. JWT verified by Node.js auth middleware
2. Image saved to disk via multer
3. Image buffer forwarded to FastAPI `/predict-explain` as multipart form data
4. File type validation — JPEG, PNG only
5. Bytes decoded to OpenCV BGR image
6. BGR converted to RGB — OpenCV reads BGR; PyTorch expects RGB
7. Resized to 384 × 384 using `INTER_AREA` interpolation
8. Converted to tensor, normalised with ImageNet mean and std
9. Batch dimension added: `[3, 384, 384]` → `[1, 3, 384, 384]`
10. Forward pass through ResNet-50 under `torch.no_grad()`
11. Softmax converts logits to probabilities, argmax selects predicted class
12. Grad-CAM heatmap generated and returned as base64
13. Result + heatmap saved to MongoDB Atlas, JSON returned to frontend

Steps 6–9 must exactly mirror the test transforms used during training. Any mismatch
produces wrong predictions without any error.

---

## Roadmap

- [x] ML training pipeline (ResNet-50, MVTec dataset)
- [x] FastAPI inference microservice with Grad-CAM explainability
- [x] Node.js backend — image forwarding, MongoDB logging, JWT auth
- [x] React web dashboard — drag-and-drop upload, real-time results, Grad-CAM display
- [x] Inspection history with pagination, filtering, and modal detail view
- [x] Admin dashboard — analytics, user management, role assignment
- [x] Docker containerisation
- [ ] Docker Compose — single command environment setup
- [ ] Azure deployment — Container Apps + Static Web Apps
- [ ] React Native mobile app — camera capture and real-time results
- [ ] Model retraining pipeline on domain-specific images

---

## Known Limitations

**Dataset variability.** MVTec images were captured under controlled lab conditions with
consistent lighting and camera angle. Real environments introduce variable lighting,
slight camera tilt, and positioning differences the model has not seen.

**Domain specificity.** The model is calibrated to MVTec's visual patterns. New material
types or significantly different surface textures require a retraining cycle on
representative samples.

**No pixel-level localisation.** Grad-CAM shows which regions the model attended to but
does not produce precise defect bounding boxes. Pixel-level localisation would require
annotated segmentation masks and a different model architecture (YOLO, Mask R-CNN).

**Image persistence.** Uploaded images are currently stored on the container's local
filesystem. In a production deployment, these should be migrated to cloud object storage
(Azure Blob Storage or AWS S3) to survive container restarts.

---

## References

- Bergmann, P. et al. (2021). [The MVTec Anomaly Detection Dataset](https://doi.org/10.1007/s11263-020-01400-4). *International Journal of Computer Vision*, 129, 1038–1059.
- He, K. et al. (2016). [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385). *CVPR 2016*.

---

## Author

**Hafiz Muhammad Saad Irfan**
BS Software Engineering — Information Technology University, Lahore
Internship Project · 2026

[GitHub](https://github.com/msaadirfan-max) · [LinkedIn](https://linkedin.com/in/hafiz-muhammad-saad-irfan-69b7132a7)

---

*Built with PyTorch, FastAPI, Node.js, and React.
Model weights available in [Releases](https://github.com/msaadirfan-max/ai-surface-defect-detection-system/releases).*


---

## System Architecture
