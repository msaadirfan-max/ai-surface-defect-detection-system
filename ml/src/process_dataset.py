import os
import cv2
from collections import defaultdict


def process_dataset(input_path, output_path, target_size=(384, 384)):
    categories      = ["Normal", "Defective"]
    processed       = 0
    corrupted       = 0
    grayscale_found = 0
    category_counts = defaultdict(int)

    for category in categories:
        input_folder  = os.path.join(input_path,  category)
        output_folder = os.path.join(output_path, category)
        os.makedirs(output_folder, exist_ok=True)

        if not os.path.exists(input_folder):
            print(f"WARNING: '{input_folder}' not found. Skipping.")
            continue

        images = [
            f for f in os.listdir(input_folder)
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))
        ]
        print(f"\nProcessing '{category}' — {len(images)} images")

        for image_name in images:
            image_path        = os.path.join(input_folder, image_name)
            output_image_path = os.path.join(output_folder, image_name)

            # Extracting MVTec category from filename prefix
            # e.g. "tile_crack_000.png" → category = "tile"
            mvtec_category = image_name.split('_')[0]
            category_counts[mvtec_category] += 1

            img = cv2.imread(image_path)

            if img is None:
                print(f"  WARNING: Cannot read '{image_name}'. Skipping.")
                corrupted += 1
                continue

            try:
                # Handle grayscale images (grid, screw, zipper categories)
                # cv2.imread returns (H, W) for true grayscale
                # Convert to BGR so all outputs are 3-channel
                if len(img.shape) == 2:
                    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
                    grayscale_found += 1

                # INTER_AREA: best interpolation for downscaling
                # Avoids aliasing artifacts on fine geometric patterns
                img_resized = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
                cv2.imwrite(output_image_path, img_resized)
                processed += 1

            except Exception as e:
                print(f"  ERROR on '{image_name}': {e}")
                corrupted += 1

    # Report
    print("\n" + "=" * 50)
    print("RESIZE REPORT")
    print("=" * 50)
    print(f"  Successfully resized : {processed}")
    print(f"  Grayscale converted  : {grayscale_found}  (grid/screw/zipper → BGR)")
    print(f"  Corrupted/Skipped    : {corrupted}")
    print(f"  Target size          : {target_size[0]}x{target_size[1]} px")
    print(f"\n  Images per MVTec category:")
    for cat, count in sorted(category_counts.items()):
        print(f"    {cat:<15}: {count}")
    print("=" * 50)


if __name__ == "__main__":
    BASE = "database/full_mvtec"

    print("Processing TRAIN set...")
    process_dataset(
        input_path  = os.path.join(BASE, "Train"),
        output_path = os.path.join(BASE, "Train_resized"),
        target_size = (384, 384)
    )

    print("\nProcessing TEST set...")
    process_dataset(
        input_path  = os.path.join(BASE, "Test"),
        output_path = os.path.join(BASE, "Test_resized"),
        target_size = (384, 384)
    )