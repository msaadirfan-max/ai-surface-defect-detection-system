
import torch.nn as nn
import torchvision.models as models

def build_model(num_classes: int = 2, freeze_base: bool = False) -> nn.Module:
    
    ## No pretrained weights — we load our own 
    
    model = models.resnet50(weights=None)   

    if freeze_base:
        for param in model.parameters():
            param.requires_grad = False

    in_features = model.fc.in_features     # 2048 for ResNet-50
    model.fc = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, num_classes)
    )

    return model

