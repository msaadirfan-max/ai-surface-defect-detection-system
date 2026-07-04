
import time
import torch
import torch.nn as nn
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse

from model import build_model
from preprocess import preprocess_image




MODEL_PATH = "best_model_mvtec.pth"   # path to your saved .pth file

# Must match class_to_idx from your training notebook
# Your training showed: {'Defective': 0, 'Normal': 1}
CLASS_MAP = {
    0: "defective",
    1: "normal"
}

CONFIDENCE_THRESHOLD = 0.5   # above this → use predicted class, below → "uncertain"


# ─────────────────────────────────────────────
# App state — model lives here across requests
# ─────────────────────────────────────────────

class AppState:
    model: nn.Module = None
    device: torch.device = None
    model_loaded: bool = False


state = AppState()


# ─────────────────────────────────────────────
# Lifespan — load model once at startup
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model when server starts, clean up when it stops."""
    print("=" * 50)
    print("Starting AI Quality Assurance Service")
    print("=" * 50)

    state.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {state.device}")

    try:
        model = build_model(num_classes=2)
        model.load_state_dict(
            torch.load(MODEL_PATH, map_location=state.device)
        )
        model.eval()                         # disable dropout for inference
        model.to(state.device)
        state.model = model
        state.model_loaded = True
        print(f"Model loaded from: {MODEL_PATH}")
        print(f"Class mapping: {CLASS_MAP}")
    except FileNotFoundError:
        print(f"WARNING: Model file not found at '{MODEL_PATH}'")
        print("Server will start but /predict will return 503 until model is loaded.")
        state.model_loaded = False
    except Exception as e:
        print(f"ERROR loading model: {e}")
        state.model_loaded = False

    print("=" * 50)
    print("Server ready. Open http://localhost:8000")
    print("API docs: http://localhost:8000/docs")
    print("=" * 50)

    yield   # server runs here

    print("Shutting down service.")


# ─────────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────────

app = FastAPI(
    title="Tile Defect Detection API",
    description="AI-powered quality inspection for ceramic/tile manufacturing",
    version="1.0.0",
    lifespan=lifespan,
)


# ─────────────────────────────────────────────
# HTML UI — served at GET /
# ─────────────────────────────────────────────

HTML_UI = r"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tile QA Inspector</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }
    .header p {
      font-size: 0.875rem;
      color: #94a3b8;
      margin-top: 0.4rem;
    }
    .status-dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #22c55e;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }
    .status-dot.offline { background: #ef4444; animation: none; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    /* ── Main card ── */
    .card {
      width: 100%;
      max-width: 680px;
      background: #1e2130;
      border: 1px solid #2d3148;
      border-radius: 16px;
      padding: 2rem;
    }

    /* ── Drop zone ── */
    .drop-zone {
      border: 2px dashed #3d4468;
      border-radius: 12px;
      padding: 2.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      position: relative;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #6366f1;
      background: #1a1d2e;
    }
    .drop-zone input[type=file] {
      position: absolute; inset: 0;
      opacity: 0; cursor: pointer; width: 100%; height: 100%;
    }
    .drop-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .drop-label { font-size: 0.9rem; color: #94a3b8; }
    .drop-label span { color: #818cf8; font-weight: 500; }
    .drop-sub { font-size: 0.75rem; color: #64748b; margin-top: 0.3rem; }

    /* ── Preview ── */
    .preview-wrap {
      display: none;
      margin-top: 1.25rem;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }
    .preview-wrap img {
      width: 100%; max-height: 320px;
      object-fit: contain;
      background: #111827;
      border-radius: 10px;
    }
    .preview-clear {
      position: absolute; top: 8px; right: 8px;
      background: rgba(0,0,0,.6);
      border: none; color: #fff;
      width: 28px; height: 28px;
      border-radius: 50%; cursor: pointer;
      font-size: 14px; display: flex;
      align-items: center; justify-content: center;
    }

    /* ── Analyse button ── */
    .btn {
      display: block; width: 100%;
      padding: 0.75rem;
      margin-top: 1.25rem;
      background: #6366f1;
      color: #fff;
      border: none; border-radius: 10px;
      font-size: 0.95rem; font-weight: 600;
      cursor: pointer;
      transition: background .15s, transform .1s;
    }
    .btn:hover:not(:disabled) { background: #4f52d4; }
    .btn:active:not(:disabled) { transform: scale(.98); }
    .btn:disabled { background: #374151; color: #6b7280; cursor: not-allowed; }

    /* ── Spinner ── */
    .spinner {
      display: none;
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Result card ── */
    .result {
      display: none;
      margin-top: 1.5rem;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      border: 1px solid;
    }
    .result.pass {
      background: #052e16;
      border-color: #166534;
    }
    .result.fail {
      background: #2d0a0a;
      border-color: #7f1d1d;
    }
    .result.uncertain {
      background: #1c1a07;
      border-color: #713f12;
    }
    .result-top {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 1rem;
    }
    .result-icon { font-size: 2rem; }
    .result-verdict { font-size: 1.3rem; font-weight: 700; }
    .result.pass .result-verdict  { color: #4ade80; }
    .result.fail .result-verdict  { color: #f87171; }
    .result.uncertain .result-verdict { color: #fbbf24; }
    .result-status { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

    /* ── Confidence bar ── */
    .conf-label {
      display: flex; justify-content: space-between;
      font-size: 0.8rem; color: #94a3b8;
      margin-bottom: 6px;
    }
    .conf-bar {
      height: 8px; background: #1f2937;
      border-radius: 99px; overflow: hidden;
    }
    .conf-fill {
      height: 100%; border-radius: 99px;
      transition: width .6s ease;
    }
    .pass  .conf-fill { background: #22c55e; }
    .fail  .conf-fill { background: #ef4444; }
    .uncertain .conf-fill { background: #f59e0b; }

    /* ── Metadata row ── */
    .meta-row {
      display: flex; gap: 1rem;
      margin-top: 1rem;
    }
    .meta-item {
      flex: 1;
      background: rgba(255,255,255,.04);
      border-radius: 8px;
      padding: .5rem .75rem;
    }
    .meta-key  { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .meta-val  { font-size: 0.9rem; font-weight: 500; color: #e2e8f0; margin-top: 2px; }

    /* ── History ── */
    .history-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 2rem; margin-bottom: .75rem;
    }
    .history-title { font-size: 0.85rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .clear-btn {
      font-size: 0.75rem; color: #6b7280;
      background: none; border: none; cursor: pointer;
      padding: 2px 8px; border-radius: 6px;
    }
    .clear-btn:hover { color: #e2e8f0; background: #2d3148; }
    .history-list { display: flex; flex-direction: column; gap: 8px; }
    .history-item {
      display: flex; align-items: center; gap: 10px;
      background: #161926;
      border: 1px solid #2d3148;
      border-radius: 10px;
      padding: .6rem .9rem;
      font-size: 0.82rem;
    }
    .h-thumb {
      width: 36px; height: 36px;
      object-fit: cover; border-radius: 6px;
      background: #111827; flex-shrink: 0;
    }
    .h-name { color: #cbd5e1; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-badge {
      padding: 2px 10px; border-radius: 99px;
      font-size: 0.72rem; font-weight: 600; flex-shrink: 0;
    }
    .h-badge.pass     { background: #14532d; color: #4ade80; }
    .h-badge.fail     { background: #450a0a; color: #fca5a5; }
    .h-badge.uncertain{ background: #451a03; color: #fcd34d; }
    .h-conf { color: #64748b; flex-shrink: 0; }

    .error-box {
      background: #2d0a0a; border: 1px solid #7f1d1d;
      border-radius: 10px; padding: 1rem 1.25rem;
      margin-top: 1rem; font-size: 0.85rem; color: #fca5a5;
      display: none;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 2rem;
      font-size: 0.75rem;
      color: #475569;
      text-align: center;
    }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>

<div class="header">
  <h1>🔬 Tile QA Inspector</h1>
  <p>
    <span class="status-dot" id="statusDot"></span>
    <span id="statusText">Checking service...</span>
  </p>
</div>

<div class="card">

  <!-- Drop zone -->
  <div class="drop-zone" id="dropZone">
    <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp">
    <div class="drop-icon">🖼️</div>
    <div class="drop-label">Drop an image here or <span>browse files</span></div>
    <div class="drop-sub">JPEG · PNG · WEBP — max 10 MB</div>
  </div>

  <!-- Preview -->
  <div class="preview-wrap" id="previewWrap">
    <img id="previewImg" src="" alt="Preview">
    <button class="preview-clear" id="clearBtn" title="Remove image">✕</button>
  </div>

  <!-- Analyse button -->
  <button class="btn" id="analyseBtn" disabled>
    <span id="btnText">Select an image first</span>
    <div class="spinner" id="spinner"></div>
  </button>

  <!-- Error -->
  <div class="error-box" id="errorBox"></div>

  <!-- Result -->
  <div class="result" id="resultCard">
    <div class="result-top">
      <span class="result-icon" id="resultIcon"></span>
      <div>
        <div class="result-verdict" id="resultVerdict"></div>
        <div class="result-status" id="resultStatus"></div>
      </div>
    </div>
    <div class="conf-label">
      <span>Confidence</span>
      <span id="confText"></span>
    </div>
    <div class="conf-bar">
      <div class="conf-fill" id="confFill" style="width:0%"></div>
    </div>
    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-key">Inference time</div>
        <div class="meta-val" id="metaTime">—</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Raw status</div>
        <div class="meta-val" id="metaStatus">—</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Image</div>
        <div class="meta-val" id="metaFile">—</div>
      </div>
    </div>
  </div>

  <!-- History -->
  <div class="history-header">
    <div class="history-title">Inspection history</div>
    <button class="clear-btn" id="clearHistory">Clear</button>
  </div>
  <div class="history-list" id="historyList">
    <div style="font-size:.8rem;color:#475569;text-align:center;padding:.5rem 0">
      No inspections yet — upload a tile image above.
    </div>
  </div>

</div>

<div class="footer">
  AI Quality Assurance System · ResNet-50 Transfer Learning ·
  <a href="/docs" target="_blank">API Docs</a>
</div>

<script>
  // ── State ──────────────────────────────────────────────
  let selectedFile = null;
  let history = [];

  // ── Elements ───────────────────────────────────────────
  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const previewWrap = document.getElementById('previewWrap');
  const previewImg  = document.getElementById('previewImg');
  const clearBtn    = document.getElementById('clearBtn');
  const analyseBtn  = document.getElementById('analyseBtn');
  const btnText     = document.getElementById('btnText');
  const spinner     = document.getElementById('spinner');
  const errorBox    = document.getElementById('errorBox');
  const resultCard  = document.getElementById('resultCard');
  const historyList = document.getElementById('historyList');

  // ── Health check ───────────────────────────────────────
  async function checkHealth() {
    try {
      const res = await fetch('/health');
      const data = await res.json();
      const dot  = document.getElementById('statusDot');
      const txt  = document.getElementById('statusText');
      if (data.model_loaded) {
        dot.classList.remove('offline');
        txt.textContent = 'Model loaded — ready to inspect';
      } else {
        dot.classList.add('offline');
        txt.textContent = 'Model not loaded — check server logs';
      }
    } catch {
      document.getElementById('statusDot').classList.add('offline');
      document.getElementById('statusText').textContent = 'Service offline';
    }
  }
  checkHealth();
  setInterval(checkHealth, 30000);

  // ── File selection ─────────────────────────────────────
  function setFile(file) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showError('Only JPEG, PNG, and WEBP images are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('File too large. Maximum size is 10 MB.');
      return;
    }
    selectedFile = file;
    hideError();
    hideResult();

    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);

    btnText.textContent = 'Analyse Tile';
    analyseBtn.disabled = false;
  }

  fileInput.addEventListener('change', e => setFile(e.target.files[0]));
  clearBtn.addEventListener('click', resetUI);

  // Drag and drop
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  // ── Analyse ────────────────────────────────────────────
  analyseBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Loading state
    btnText.style.display   = 'none';
    spinner.style.display   = 'block';
    analyseBtn.disabled     = true;
    hideError();
    hideResult();

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res  = await fetch('/predict', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || `Server error (${res.status})`);
        return;
      }

      showResult(data, selectedFile);
      addHistory(data, selectedFile, previewImg.src);

    } catch (err) {
      showError('Network error — is the server running?');
    } finally {
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
      analyseBtn.disabled   = false;
      btnText.textContent   = 'Analyse Again';
    }
  });

  // ── Show result ────────────────────────────────────────
  function showResult(data, file) {
    const card    = resultCard;
    const pct     = Math.round(data.confidence * 100);
    const isNorm  = data.status === 'normal';
    const isUncertain = pct < 60;

    card.className = 'result ' + (isUncertain ? 'uncertain' : isNorm ? 'pass' : 'fail');

    document.getElementById('resultIcon').textContent    = isUncertain ? '⚠️' : isNorm ? '✅' : '❌';
    document.getElementById('resultVerdict').textContent = isUncertain ? 'UNCERTAIN' : isNorm ? 'PASS' : 'FAIL';
    document.getElementById('resultStatus').textContent  =
      isUncertain ? 'Low confidence — manual inspection recommended'
      : isNorm    ? 'Tile meets quality standards'
                  : 'Defect detected — tile should be rejected';

    document.getElementById('confText').textContent      = pct + '%';
    document.getElementById('confFill').style.width      = pct + '%';
    document.getElementById('metaTime').textContent      = data.inference_time_ms.toFixed(1) + ' ms';
    document.getElementById('metaStatus').textContent    = data.status.toUpperCase();
    document.getElementById('metaFile').textContent      = file.name.length > 16
      ? file.name.substring(0, 14) + '…' : file.name;

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── History ────────────────────────────────────────────
  function addHistory(data, file, thumbSrc) {
    const pct  = Math.round(data.confidence * 100);
    const cls  = pct < 60 ? 'uncertain' : data.status === 'normal' ? 'pass' : 'fail';
    const label = pct < 60 ? 'Uncertain' : data.status === 'normal' ? 'PASS' : 'FAIL';

    history.unshift({ data, file, thumbSrc, cls, label, pct });
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<div style="font-size:.8rem;color:#475569;text-align:center;padding:.5rem 0">No inspections yet — upload a tile image above.</div>';
      return;
    }
    historyList.innerHTML = history.map((h, i) => `
      <div class="history-item">
        <img class="h-thumb" src="${h.thumbSrc}" alt="">
        <span class="h-name">${h.file.name}</span>
        <span class="h-conf">${h.pct}%</span>
        <span class="h-badge ${h.cls}">${h.label}</span>
      </div>
    `).join('');
  }

  document.getElementById('clearHistory').addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  // ── Helpers ────────────────────────────────────────────
  function showError(msg) {
    errorBox.textContent    = '⚠ ' + msg;
    errorBox.style.display  = 'block';
  }
  function hideError()  { errorBox.style.display  = 'none'; }
  function hideResult() { resultCard.style.display = 'none'; }

  function resetUI() {
    selectedFile = null;
    fileInput.value = '';
    previewImg.src  = '';
    previewWrap.style.display = 'none';
    analyseBtn.disabled = true;
    btnText.textContent = 'Select an image first';
    hideError();
    hideResult();
  }
</script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def ui():
    """Serve the web UI."""
    return HTML_UI


@app.get("/health")
async def health():
    """
    Health check endpoint.
    Node.js backend calls this before forwarding images.
    """
    return {
        "status": "ok",
        "model_loaded": state.model_loaded,
        "device": str(state.device) if state.device else "unknown",
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Run defect detection on an uploaded tile image.

    Args:
        file : image file (JPEG or PNG)

    Returns:
        JSON with status, confidence, and inference_time_ms

    Example response:
        {"status": "defective", "confidence": 0.9731, "inference_time_ms": 48.3}
    """
    # ── Check model is loaded ──
    if not state.model_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Check server logs."
        )

    # ── Validate file type ──
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{file.content_type}'. "
                   f"Accepted: JPEG, PNG, WEBP."
        )

    # ── Read file bytes ──
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read file: {e}")

    # ── Preprocess ──
    try:
        tensor = preprocess_image(image_bytes)
        tensor = tensor.to(state.device)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {e}")

    # ── Inference ──
    try:
        t_start = time.time()

        with torch.no_grad():
            logits = state.model(tensor)                        # raw output [1, 2]
            probs  = torch.softmax(logits, dim=1)               # probabilities [1, 2]
            pred_idx = torch.argmax(probs, dim=1).item()        # 0 or 1
            confidence = probs[0][pred_idx].item()              # float 0–1

        inference_ms = (time.time() - t_start) * 1000

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    # ── Build response ──
    status = CLASS_MAP.get(pred_idx, "unknown")

    return JSONResponse({
        "status":           status,
        "confidence":       round(confidence, 4),
        "inference_time_ms": round(inference_ms, 2),
        "predicted_index":  pred_idx,
        "class_map":        CLASS_MAP,
    })