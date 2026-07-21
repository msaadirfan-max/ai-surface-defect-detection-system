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

## System Architecture

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
The Node.js backend acts as the sole entry point — it handles authentication, rate limiting,
and image forwarding. The FastAPI AI service is never directly exposed to the browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML / AI Core | Python · PyTorch · OpenCV · Torchvision |
| AI Microservice | FastAPI · Uvicorn |
| Backend | Node.js · Express · MongoDB Atlas · Mongoose |
| Frontend | React · TypeScript · Vite · Tailwind CSS |
| Containerisation | Docker · Docker Compose |
| Auth | JWT · bcryptjs |
| Training Environment | Google Colab (NVIDIA T4 GPU) |

---

## ML Model

### Architecture

ResNet-50 pretrained on ImageNet, fine-tuned for binary surface defect classification
with Grad-CAM explainability.

| Property | Value |
|---|---|
| Base model | ResNet-50 (IMAGENET1K_V2 weights) |
| Fine-tuned layers | `layer3`, `layer4`, classification head |
| Frozen layers | `layer1`, `layer2` |
| Input resolution | 384 × 384 RGB |
| Output | `normal` / `defective` + confidence score |
| Classification head | `Dropout(0.4)` → `Linear(2048, 2)` |
| Explainability | Grad-CAM heatmap overlay |

### Why ResNet-50

Early layers of ResNet already encode edges, textures, and surface patterns from ImageNet's
1.2 million images. Fine-tuning only the later layers lets the model adapt these general
features to the specific visual vocabulary of surface defects — cracks, oil contamination,
rough texture, glue — without relearning from scratch on a small dataset.

### Training Strategy

**Class imbalance** is the central challenge. The dataset has roughly 4× more Normal images
than Defective. Three mechanisms address this together:

- `WeightedRandomSampler` — each training batch is balanced to approximately 50/50
  Normal/Defective regardless of folder counts
- `CrossEntropyLoss(weight=...)` — higher loss penalty for misclassifying a Defective
  surface than a Normal one
- Per-class augmentation — heavy rotation, affine shifts, and colour jitter on Defective
  images only; mild flips on Normal images

**Two loss functions** are used deliberately. Weighted loss during training pushes the model
to treat missed defects as costly. Unweighted loss during validation gives an honest,
comparable number for early stopping — using the weighted loss for validation inflated
val_loss and caused training to stop too early.

### Dataset

[MVTec Anomaly Detection Dataset](https://www.mvtec.com/company/research/datasets/mvtec-ad)
— flat-surface texture categories only.

| Category | Included | Defect Types |
|---|---|---|
| `tile` | ✅ | crack, glue strip, gray stroke, oil, rough |
| `carpet` | ✅ | color, cut, hole, metal contamination, thread |
| `leather` | ✅ | color, cut, fold, glue, poke |
| `wood` | ✅ | color, combined, hole, liquid, scratch |
| `grid` | ❌ | Grayscale — produces flat R=G=B tensors that destabilise ResNet colour features |
| All 3D objects | ❌ | Screws, pills, cables — defect morphology irrelevant to surface inspection |

The 3D object categories (hazelnut, toothbrush, transistor, etc.) were excluded deliberately.
A bent toothbrush bristle and a ceramic surface crack share no learnable visual features.
Including them would force the model to memorise unrelated patterns at the cost of
surface-specific accuracy.

**Split:** 70% of defective images → training, 30% → test. All normal images split 80/20.

| Split | Normal | Defective |
|---|---|---|
| Train | ~1,030 | ~264 |
| Test | ~278 | ~117 |

### Key Metric

**Defective recall** — of all actually defective surfaces in the test set, what fraction
did the model flag?

Overall accuracy is a misleading metric here. A model that predicts Normal for every image
achieves ~70% accuracy on this test set while catching zero defects. Defective recall
directly measures what matters in manufacturing: are bad surfaces being caught before they
reach a customer?

---

## Features

### Regular User
- Upload surface images via drag-and-drop or file picker
- Instant PASS / FAIL verdict with confidence score
- Grad-CAM heatmap showing which surface regions triggered the prediction
- Personal inspection history with pagination and status filtering
- Click any inspection row to view full details and heatmap

### Admin
- System-wide analytics dashboard
- Defect rate trends over the last 30 days
- All users' inspection history
- User management and role assignment

---

## Project Structure


```text
ai-surface-defect-detection-system/
│
├── ml/                              # Training pipeline
│   ├── notebooks/
│   │   └── training.ipynb           # Full training notebook (Colab)
│   └── src/
│       ├── restructure_mvtec.py     # Converts MVTec folder structure → Normal/Defective
│       └── process_dataset.py       # Batch resize all images to 384×384
│
├── ai-service/                      # FastAPI inference microservice
│   ├── fast_api/
│   │   └── main.py                  # Routes, startup, model loading
│   ├── model.py                     # ResNet-50 architecture (matches training exactly)
│   ├── preprocess.py                # Image bytes → normalised tensor
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend/                         # Node.js / Express API
│   ├── config/
│   │   └── db.js                    # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js                  # User schema (name, email, passwordHash, role)
│   │   └── Inspection.js            # Inspection schema (status, confidence, gradCamUrl)
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   ├── role.js                  # Admin role guard
│   │   ├── upload.js                # Multer disk storage config
│   │   └── errorHandler.js          # Global error handler
│   ├── routes/
│   │   ├── auth.js                  # POST /auth/register, /auth/login
│   │   ├── inspect.js               # POST /api/inspect
│   │   ├── inspection.js            # GET /api/inspections
│   │   └── admin.js                 # GET /api/admin/*
│   ├── services/
│   │   └── aiService.js             # FastAPI bridge (forwards image, returns prediction)
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                        # React · TypeScript · Tailwind CSS
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts            # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Global auth state (token, user, login, logout)
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── InspectionTable.tsx
│   │   │   ├── InspectionModal.tsx
│   │   │   └── StatCard.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── History.tsx
│   │   │   └── AdminDashboard.tsx
│   │   └── types/
│   │       └── index.ts             # Shared TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml               # Single command local environment
└── README.md
```


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
