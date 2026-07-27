# Use lightweight Python 3.13 image
FROM python:3.13-slim

# Prevent Python from writing .pyc files & enable unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for OpenCV / PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and weights
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Start Uvicorn server
CMD ["uvicorn", "fast_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]