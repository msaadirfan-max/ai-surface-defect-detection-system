# AI-Powered Quality Assurance System
### Surface Defect Detection for Ceramic Tile Manufacturing

A machine learning proof-of-concept built during a 6-week software engineering internship. The system automates visual quality inspection on a ceramic tile production line using transfer learning, replacing error-prone manual inspection with a consistent, auditable AI pipeline.

A factory worker inspects thousands of tiles per shift. Accuracy degrades with fatigue, results vary between inspectors, and there is no digital record of decisions made. This system addresses all three problems.

---

## Demo

> Upload a tile image → get an instant PASS / FAIL verdict with confidence score

![System Architecture](docs/architecture.png)
<!-- Replace with actual screenshot once frontend is connected -->

---

## System Architecture

```
┌─────────────────┐     POST /api/inspect      ┌──────────────────────┐
│  React Web App  │ ─────────────────────────► │  Node.js / Express   │
│  React Native   │ ◄───────────────────────── │  (Traffic Cop)       │
└─────────────────┘     JSON result            └──────────┬───────────┘
                                                          │ POST /predict
                                                          ▼
                                               ┌──────────────────────┐
                                               │  FastAPI Microservice│
                                               │  ResNet-50 + PyTorch │
                                               └──────────┬───────────┘
                                                          │
                                               ┌──────────▼───────────┐
                                               │      MongoDB         │
                                               │  Inspection Logs     │
                                               └──────────────────────┘
```

The Node.js backend acts as the sole entry point — it handles authentication, rate limiting, and image forwarding. The Python AI service is never directly exposed to the internet.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML / AI Core | Python, PyTorch, OpenCV, Torchvision |
| AI Microservice | FastAPI, Uvicorn |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Web Frontend | React (Vite) |
| Mobile | React Native (Expo) |
| Training Environment | Google Colab (NVIDIA T4 GPU) |

---

## ML Model

### Architecture

ResNet-50 pretrained on ImageNet, fine-tuned for binary surface defect classification.

| Property | Value |
|---|---|
| Base model | ResNet-50 (IMAGENET1K_V2 weights) |
| Fine-tuned layers | `layer3`, `layer4`, classification head |
| Frozen layers | `layer1`, `layer2` |
| Input resolution | 384 × 384 RGB |
| Output | `normal` / `defective` + confidence score |
| Classification head | `Dropout(0.4)` → `Linear(2048, 2)` |

### Why ResNet-50

Early layers of ResNet already encode edges, textures, and surface patterns from ImageNet's 1.2 million images. Fine-tuning only the later layers lets the model adapt these general features to the specific visual vocabulary of tile defects — cracks, oil contamination, rough texture, glue — without relearning from scratch on a small dataset.

### Training Strategy

**Class imbalance** is the central challenge. The dataset has roughly 4× more Normal images than Defective. Three mechanisms address this together:

- `WeightedRandomSampler` — each training batch is balanced to approximately 50/50 Normal/Defective regardless of folder counts
- `CrossEntropyLoss(weight=...)` — higher loss penalty for misclassifying a Defective tile than a Normal one
- Per-class augmentation — heavy rotation, affine shifts, and colour jitter on Defective images only; mild flips on Normal images

**Two loss functions** are used deliberately. Weighted loss during training pushes the model to treat missed defects as costly. Unweighted loss during validation gives an honest, comparable number for early stopping — using the weighted loss for validation inflated val_loss and caused training to stop too early.

### Dataset

[MVTec Anomaly Detection Dataset](https://www.mvtec.com/company/research/datasets/mvtec-ad) — flat-surface texture categories only.

| Category | Included | Reason |
|---|---|---|
| `tile` | ✅ | Primary domain — geometric patterned tiles |
| `carpet` | ✅ | Flat texture, same imaging geometry |
| `leather` | ✅ | Flat texture, crack defects transfer well |
| `wood` | ✅ | Flat texture, surface discontinuity defects |
| `grid` | ❌ | Grayscale — produces flat R=G=B tensors that destabilise ResNet colour features |
| All 3D objects | ❌ | Screws, pills, cables — defect morphology irrelevant to surface inspection |

The 3D object categories (hazelnut, toothbrush, transistor, etc.) were excluded deliberately. A bent toothbrush bristle and a ceramic surface crack share no learnable visual features. Including them would force the model to memorise unrelated patterns at the cost of tile-specific accuracy.

**Split:** 70% of defective images → training, 30% → test. All normal images split 80/20.

| Split | Normal | Defective |
|---|---|---|
| Train | ~1,030 | ~264 |
| Test | ~278 | ~117 |

### Key Metric

**Defective recall** — of all actually defective tiles in the test set, what fraction did the model flag?

Overall accuracy is a misleading metric here. A model that predicts Normal for every image achieves ~70% accuracy on this test set while catching zero defects. Defective recall directly measures what matters in manufacturing: are bad tiles being caught before they reach a customer?

---

## Project Structure

```
ai-qa-system/
│
├── ml/                          # Training pipeline
│   ├── notebooks/
│   │   └── training.ipynb       # Full training notebook (Colab)
│   ├── src/
│   │   ├── restructure_mvtec.py # Converts MVTec folder structure → Normal/Defective
│   │   └── process_dataset.py   # Batch resize all images to 384×384
│   └── requirements.txt
│
├── ai-service/                  # FastAPI inference microservice
│   ├── main.py                  # App, routes, startup model loading, web UI
│   ├── model.py                 # ResNet-50 architecture (matches training exactly)
│   ├── preprocess.py            # Image bytes → normalised tensor
│   └── requirements.txt
│
├── backend/                     # Node.js / Express  [in progress]
├── frontend/                    # React web dashboard [in progress]
├── mobile/                      # React Native (Expo) [in progress]
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- NVIDIA GPU recommended for training (Google Colab T4 works)

### 1. Clone the repository

```bash
git clone https://github.com/msaadirfan-max/ai-qa-system.git
cd ai-qa-system
```

### 2. Download the trained model

The model weights are not stored in this repository (100 MB+ file). Download `best_model_mvtec.pth` from the [latest release](https://github.com/msaadirfan-max/ai-qa-system/releases) and place it in `ai-service/`.

### 3. Run the AI microservice

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` for the built-in inspection UI.
Open `http://localhost:8000/docs` for the auto-generated API reference.

### 4. API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service status and model load confirmation |
| `POST` | `/predict` | Upload an image, receive defect prediction |
| `GET` | `/` | Built-in drag-and-drop web UI |

**Example response from `POST /predict`:**
```json
{
  "status": "defective",
  "confidence": 0.9731,
  "inference_time_ms": 48.3,
  "predicted_index": 0,
  "class_map": {"0": "defective", "1": "normal"}
}
```

### 5. Dataset setup (for retraining)

Download the MVTec AD dataset from [mvtec.com](https://www.mvtec.com/company/research/datasets/mvtec-ad). Then run the preparation scripts in order:

```bash
cd ml/src

# Step 1 — restructure MVTec folders into Normal/Defective splits
python restructure_mvtec.py

# Step 2 — resize all images to 384×384
python process_dataset.py

# Step 3 — zip and upload to Google Drive, then open training.ipynb in Colab
```

---

## Inference Pipeline

When an image reaches `POST /predict`, this sequence runs:

1. File type validation — only JPEG, PNG, WEBP accepted
2. Bytes decoded to OpenCV BGR image
3. BGR converted to RGB — OpenCV reads BGR; PyTorch expects RGB
4. Resized to 384 × 384 using `INTER_AREA` interpolation
5. Converted to tensor, normalised with ImageNet mean and std
6. Batch dimension added: `[3, 384, 384]` → `[1, 3, 384, 384]`
7. Forward pass through ResNet-50 under `torch.no_grad()`
8. Softmax converts logits to probabilities
9. `argmax` selects predicted class, confidence extracted
10. JSON response returned to Node.js backend

Steps 3–6 must exactly mirror the test transforms used during training. Any mismatch produces wrong predictions without any error — the model receives valid-looking input and outputs confidently incorrect results.

---

## Roadmap

- [x] ML training pipeline (ResNet-50, MVTec dataset)
- [x] FastAPI inference microservice with built-in web UI
- [ ] Node.js backend — image forwarding, MongoDB logging, auth
- [ ] React web dashboard — inspection history, stats, drag-and-drop upload
- [ ] React Native mobile app — camera capture and real-time result display
- [ ] Docker Compose — single command local environment setup
- [ ] Model retraining on factory-specific tile images

---

## Known Limitations

**Dataset variability.** MVTec tile images were captured under controlled lab conditions with consistent lighting and camera angle. Real factory environments introduce variable lighting, slight camera tilt, and tile positioning differences that this model has not seen.

**Domain specificity.** The model is calibrated to the visual patterns of MVTec's tile category. New tile product lines or significantly different surface textures require a retraining cycle on representative samples.

**No defect localisation.** The model returns a binary Normal/Defective label with a confidence score. It does not indicate where on the tile the defect is located. Bounding-box localisation would require either pixel-level annotations or an object detection approach (YOLO, Faster R-CNN).

---

## References

- Bergmann, P. et al. (2021). [The MVTec Anomaly Detection Dataset](https://doi.org/10.1007/s11263-020-01400-4). *International Journal of Computer Vision*, 129, 1038–1059.
- He, K. et al. (2016). [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385). *CVPR 2016*.

---

## Author

**Hafiz Muhammad Saad Irfan**
BS Software Engineering — Information Technology University, Lahore
Internship Project · 2024

[GitHub](https://github.com/msaadirfan-max) · [LinkedIn](https://linkedin.com/in/hafiz-muhammad-saad-irfan-69b7132a7)

---

*Built with PyTorch, FastAPI, and the MVTec AD dataset. Model weights available in [Releases](https://github.com/msaadirfan-max/ai-qa-system/releases).*
