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

---

## System Architecture