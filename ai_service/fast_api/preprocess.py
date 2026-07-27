"""
Steps:
Resize(384, 384) → BGR→RGB → ToTensor → Normalize(ImageNet stats)
"""

import io
import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

# Fixing and Normallizing the image size and ImageNet statistics
TARGET_SIZE   = (384, 384)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


_transform = transforms.Compose([
    transforms.Resize(TARGET_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Convert raw image bytes → model-ready tensor of shape [1, 3, 384, 384].

    Args:
        image_bytes : raw bytes from UploadFile.read()

    Returns:
        torch.Tensor of shape [1, 3, 384, 384]

    Raises:
        ValueError : if image cannot be decoded (corrupted or wrong format)
    """
    # bytes → numpy array
    np_array = np.frombuffer(image_bytes, dtype=np.uint8)

    # numpy array → OpenCV BGR image
    img_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError(
            "Could not decode image. "
            "File may be corrupted or not a valid image format."
        )

    # BGR → RGB 
    # OpenCV reads as BGR, PyTorch/torchvision expects RGB
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # numpy array → PIL Image (torchvision transforms expect PIL)
    pil_image = Image.fromarray(img_rgb)

    # Apply Resize → ToTensor → Normalize
    tensor = _transform(pil_image)

    # Added batch dimension [3, 384, 384] → [1, 3, 384, 384]
    tensor = tensor.unsqueeze(0)

    return tensor