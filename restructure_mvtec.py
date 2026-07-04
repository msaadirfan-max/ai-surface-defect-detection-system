"""
restructure_full_mvtec.py
==========================
Converts the full MVTec AD dataset (all 15 categories) into a
binary Normal/Defective classification structure.

MVTec original structure (per category):
    <category>/
    ├── train/
    │   └── good/          ← defect-free training images
    └── test/
        ├── good/          ← defect-free test images
        └── <defect_type>/ ← one folder per defect type (crack, glue, etc.)

Output structure:
    dataset/
    ├── Train/
    │   ├── Normal/        ← 80% of each category's train/good/
    │   └── Defective/     ← 70% of each category's test/<defect>/
    └── Test/
        ├── Normal/        ← 20% of each category's train/good/
        └── Defective/     ← 30% of each category's test/<defect>/

Filenames are prefixed with category + defect type to avoid collisions:
    tile_crack_000.png
    carpet_cut_003.png
    leather_good_012.png
"""

import os
import shutil
import random
from collections import defaultdict

random.seed(42)  

# All 15 MVTec categories
CATEGORIES = [
    "carpet", "grid",
    "leather","tile", "wood"
]

# Split ratios
NORMAL_TRAIN_RATIO   = 0.80   # 80% of good images → Train/Normal
DEFECTIVE_TRAIN_RATIO = 0.70  # 70% of defective images → Train/Defective


def get_images(folder):
    """Return sorted list of image filenames in a folder."""
    if not os.path.exists(folder):
        return []
    return sorted([
        f for f in os.listdir(folder)
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))
    ])


def copy_images(src_folder, dest_folder, filenames, prefix):
    """
    Copy images from src_folder to dest_folder.
    Prefixes each filename with <prefix> to avoid collisions.
    Returns count of successfully copied images.
    """
    os.makedirs(dest_folder, exist_ok=True)
    copied = 0
    for fname in filenames:
        src  = os.path.join(src_folder, fname)
        # e.g. tile_crack_000.png or carpet_good_012.png
        dest_name = f"{prefix}_{fname}"
        dest = os.path.join(dest_folder, dest_name)
        try:
            shutil.copy2(src, dest)
            copied += 1
        except Exception as e:
            print(f"  ERROR copying {src}: {e}")
    return copied


def restructure_mvtec(mvtec_root, output_root, normal_train_ratio=NORMAL_TRAIN_RATIO,
                      defective_train_ratio=DEFECTIVE_TRAIN_RATIO):
    """
    Main restructuring function.

    Args:
        mvtec_root          : path to the MVTec AD root folder
                              (contains bottle/, cable/, tile/, ... subfolders)
        output_root         : where to write the restructured dataset
        normal_train_ratio  : fraction of normal images for training (default 0.80)
        defective_train_ratio: fraction of defective images for training (default 0.70)
    """

    # Create output directories
    for split in ['Train', 'Test']:
        for cls in ['Normal', 'Defective']:
            os.makedirs(os.path.join(output_root, split, cls), exist_ok=True)

    # Stats tracking
    stats = defaultdict(lambda: defaultdict(int))
    missing_categories = []
    all_defect_types   = set()

    print("=" * 60)
    print("MVTec AD Full Dataset Restructuring")
    print("=" * 60)
    print(f"Source      : {mvtec_root}")
    print(f"Destination : {output_root}")
    print(f"Normal split: {int(normal_train_ratio*100)}% train / "
          f"{int((1-normal_train_ratio)*100)}% test")
    print(f"Defect split: {int(defective_train_ratio*100)}% train / "
          f"{int((1-defective_train_ratio)*100)}% test")
    print("=" * 60)

    for category in CATEGORIES:
        cat_path = os.path.join(mvtec_root, category)

        if not os.path.exists(cat_path):
            print(f"\n[SKIP] Category '{category}' not found at {cat_path}")
            missing_categories.append(category)
            continue

        print(f"\n[{category.upper()}]")

        # ── Normal images ──────────────────────────────────────────
        # MVTec puts all good training images in train/good/
        # We also check test/good/ for additional normal images
        good_sources = [
            os.path.join(cat_path, 'train', 'good'),
            os.path.join(cat_path, 'test',  'good'),
        ]

        all_good_images = []
        for src in good_sources:
            imgs = get_images(src)
            all_good_images.extend([(src, img) for img in imgs])

        random.shuffle(all_good_images)
        split_idx    = int(len(all_good_images) * normal_train_ratio)
        train_good   = all_good_images[:split_idx]
        test_good    = all_good_images[split_idx:]

        for (src_folder, fname) in train_good:
            prefix = f"{category}_good"
            dest   = os.path.join(output_root, 'Train', 'Normal')
            try:
                shutil.copy2(
                    os.path.join(src_folder, fname),
                    os.path.join(dest, f"{prefix}_{fname}")
                )
                stats[category]['train_normal'] += 1
            except Exception as e:
                print(f"  ERROR: {e}")

        for (src_folder, fname) in test_good:
            prefix = f"{category}_good"
            dest   = os.path.join(output_root, 'Test', 'Normal')
            try:
                shutil.copy2(
                    os.path.join(src_folder, fname),
                    os.path.join(dest, f"{prefix}_{fname}")
                )
                stats[category]['test_normal'] += 1
            except Exception as e:
                print(f"  ERROR: {e}")

        print(f"  Normal  → Train: {stats[category]['train_normal']}, "
              f"Test: {stats[category]['test_normal']}")

        # ── Defective images ───────────────────────────────────────
        # Find all defect type subfolders in test/
        test_path = os.path.join(cat_path, 'test')
        if not os.path.exists(test_path):
            print(f"  [SKIP] No test/ folder found")
            continue

        defect_types = [
            d for d in os.listdir(test_path)
            if os.path.isdir(os.path.join(test_path, d)) and d != 'good'
        ]

        all_defective = []   # (src_folder, fname, defect_type)
        for defect_type in defect_types:
            defect_folder = os.path.join(test_path, defect_type)
            imgs = get_images(defect_folder)
            for img in imgs:
                all_defective.append((defect_folder, img, defect_type))
            all_defect_types.add(defect_type)

        random.shuffle(all_defective)
        split_idx        = int(len(all_defective) * defective_train_ratio)
        train_defective  = all_defective[:split_idx]
        test_defective   = all_defective[split_idx:]

        for (src_folder, fname, defect_type) in train_defective:
            prefix = f"{category}_{defect_type}"
            dest   = os.path.join(output_root, 'Train', 'Defective')
            try:
                shutil.copy2(
                    os.path.join(src_folder, fname),
                    os.path.join(dest, f"{prefix}_{fname}")
                )
                stats[category]['train_defective'] += 1
            except Exception as e:
                print(f"  ERROR: {e}")

        for (src_folder, fname, defect_type) in test_defective:
            prefix = f"{category}_{defect_type}"
            dest   = os.path.join(output_root, 'Test', 'Defective')
            try:
                shutil.copy2(
                    os.path.join(src_folder, fname),
                    os.path.join(dest, f"{prefix}_{fname}")
                )
                stats[category]['test_defective'] += 1
            except Exception as e:
                print(f"  ERROR: {e}")

        print(f"  Defect  → Train: {stats[category]['train_defective']}, "
              f"Test: {stats[category]['test_defective']} "
              f"({len(defect_types)} defect types: {', '.join(sorted(defect_types))})")

    # ── Final summary ──────────────────────────────────────────────
    total_train_normal    = sum(s['train_normal']    for s in stats.values())
    total_test_normal     = sum(s['test_normal']     for s in stats.values())
    total_train_defective = sum(s['train_defective'] for s in stats.values())
    total_test_defective  = sum(s['test_defective']  for s in stats.values())

    print("\n" + "=" * 60)
    print("RESTRUCTURING COMPLETE")
    print("=" * 60)
    print(f"\n  {'Folder':<30} {'Count':>6}")
    print(f"  {'-'*36}")
    print(f"  {'Train/Normal':<30} {total_train_normal:>6}")
    print(f"  {'Train/Defective':<30} {total_train_defective:>6}")
    print(f"  {'Test/Normal':<30} {total_test_normal:>6}")
    print(f"  {'Test/Defective':<30} {total_test_defective:>6}")
    print(f"  {'-'*36}")
    print(f"  {'TOTAL':<30} {total_train_normal+total_test_normal+total_train_defective+total_test_defective:>6}")

    ratio = total_train_normal / total_train_defective if total_train_defective > 0 else 0
    print(f"\n  Train imbalance ratio: {ratio:.1f}:1 (Normal:Defective)")

    # Print class weights for CrossEntropyLoss
    n_total = total_train_normal + total_train_defective
    w_def   = n_total / (2 * total_train_defective) if total_train_defective > 0 else 1.0
    w_nor   = n_total / (2 * total_train_normal)    if total_train_normal    > 0 else 1.0

    print(f"\n  CrossEntropyLoss weights (copy into notebook Cell 6):")
    print(f"    class_weights = torch.tensor([{w_def:.4f}, {w_nor:.4f}])")
    print(f"    index 0 = Defective (weight {w_def:.4f})")
    print(f"    index 1 = Normal    (weight {w_nor:.4f})")

    print(f"\n  Defect types found across all categories ({len(all_defect_types)}):")
    for dt in sorted(all_defect_types):
        print(f"    {dt}")

    if missing_categories:
        print(f"\n  WARNING: These categories were not found:")
        for c in missing_categories:
            print(f"    {c}")

    print("=" * 60)


if __name__ == "__main__":
    # ── Configure these two paths ──
    MVTEC_ROOT  = "mvtec_anomaly_detection"   # root folder containing all 15 categories
    OUTPUT_ROOT = "database/full_mvtec"       # output destination

    restructure_mvtec(MVTEC_ROOT, OUTPUT_ROOT)