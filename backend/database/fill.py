import cv2
import numpy as np
import os
import matplotlib.pyplot as plt

# === 📂 PATH CONFIG ===
INPUT_PATH = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\extraction"
OUTPUT_PATH = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\handwritten_output"
os.makedirs(OUTPUT_PATH, exist_ok=True)

def detect_handwritten_regions(image_path, blank_reference=None, visualize=True):
    """
    Detect handwritten regions by separating irregular, non-standard text regions
    from printed template text.
    """
    img = cv2.imread(image_path)
    if img is None:
        print(f"⚠️ Could not read {image_path}")
        return []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

    # === 1️⃣ Binarize the image ===
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, 12
    )

    # === 2️⃣ (Optional) Subtract printed background using reference ===
    if blank_reference:
        blank = cv2.imread(blank_reference)
        blank = cv2.resize(blank, (img.shape[1], img.shape[0]))
        blank_gray = cv2.cvtColor(blank, cv2.COLOR_BGR2GRAY)
        blank_bin = cv2.adaptiveThreshold(
            blank_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 25, 12
        )
        binary = cv2.bitwise_xor(binary, blank_bin)

    # === 3️⃣ Morphological enhancement (group handwriting strokes) ===
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    handwriting_mask = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=3)

    # === 4️⃣ Contour detection ===
    contours, _ = cv2.findContours(handwriting_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = gray.shape
    handwriting_regions = []
    vis = img.copy()

    for c in contours:
        x, y, cw, ch = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        aspect = cw / float(ch)

        # === 5️⃣ Filter: printed text vs handwriting ===
        # Handwriting tends to have more area and irregular shape
        if area < 100 or cw < 20 or ch < 10:
            continue
        if aspect > 10 or aspect < 0.2:  # printed lines or noise
            continue

        handwriting_regions.append((x, y, cw, ch))
        cv2.rectangle(vis, (x, y), (x + cw, y + ch), (0, 0, 255), 2)

    print(f"✍️ Detected {len(handwriting_regions)} handwritten regions in {os.path.basename(image_path)}")

    # === 6️⃣ Visualization ===
    if visualize:
        plt.figure(figsize=(10, 10))
        plt.imshow(cv2.cvtColor(vis, cv2.COLOR_BGR2RGB))
        plt.title(f"Detected Handwritten Regions - {os.path.basename(image_path)}")
        plt.axis("off")
        plt.show()

    # === 7️⃣ Save Results ===
    base = os.path.splitext(os.path.basename(image_path))[0]
    out_dir = os.path.join(OUTPUT_PATH, base)
    os.makedirs(out_dir, exist_ok=True)
    for i, (x, y, cw, ch) in enumerate(handwriting_regions):
        crop = img[y:y+ch, x:x+cw]
        cv2.imwrite(os.path.join(out_dir, f"handwritten_{i+1}.png"), crop)

    return handwriting_regions


# === 🚀 RUN FOR ALL IMAGES ===
files = [f for f in os.listdir(INPUT_PATH) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
if not files:
    print("⚠️ No images found.")
else:
    total = 0
    for i, f in enumerate(files):
        print(f"\n📄 [{i+1}/{len(files)}] Processing {f}")
        path = os.path.join(INPUT_PATH, f)
        handwriting_regions = detect_handwritten_regions(
            path,
            blank_reference=r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\input_images\2.jpg",
            visualize=True
        )
        total += len(handwriting_regions)
    print(f"\n✅ Total handwritten regions detected: {total}")
