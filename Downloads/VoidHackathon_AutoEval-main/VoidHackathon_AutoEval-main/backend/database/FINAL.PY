import cv2
import numpy as np
import os

# === 📂 PATH CONFIG ===
filled_only_path = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\database\filled_only_area.png"  # Filled-only extracted
save_dir = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\database\detected_boxes"

os.makedirs(save_dir, exist_ok=True)

# === 🧠 LOAD IMAGE ===
filled_only = cv2.imread(filled_only_path)
if filled_only is None:
    raise ValueError("❌ Could not load filled-only image. Check the path!")

# === ⚙️ PREPROCESS ===
gray = cv2.cvtColor(filled_only, cv2.COLOR_BGR2GRAY)
gray = cv2.GaussianBlur(gray, (5, 5), 0)

# === 💥 LAPLACIAN EDGE DETECTION ===
laplacian = cv2.Laplacian(gray, cv2.CV_8U, ksize=3)
laplacian = cv2.convertScaleAbs(laplacian)
_, thresh = cv2.threshold(laplacian, 40, 255, cv2.THRESH_BINARY)

# Morphological closing to join nearby strokes
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=3)

# === 🧱 FIND CONTOURS ===
contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
boxes = []
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    if 30 < w < 2000 and 20 < h < 1000:
        boxes.append([x, y, x + w, y + h])

# === 🧩 MERGE NEARBY BOXES HORIZONTALLY (same line) ===
boxes = sorted(boxes, key=lambda b: (b[1], b[0]))  # Sort top-to-bottom, then left-to-right
merged = []
for box in boxes:
    if not merged:
        merged.append(box)
    else:
        x1, y1, x2, y2 = box
        last_x1, last_y1, last_x2, last_y2 = merged[-1]

        # Merge if on same line (close in Y) and horizontally near
        if abs(y1 - last_y1) < 25 and x1 - last_x2 < 40:
            merged[-1] = [min(x1, last_x1), min(y1, last_y1),
                          max(x2, x2, last_x2), max(y2, last_y2)]
        else:
            merged.append(box)

# === 💾 SAVE CROPPED BOXES ===
output_vis = filled_only.copy()
count = 0

for i, (x1, y1, x2, y2) in enumerate(merged, start=1):
    cv2.rectangle(output_vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cropped = filled_only[y1:y2, x1:x2]
    file_path = os.path.join(save_dir, f"box_{i}.png")
    cv2.imwrite(file_path, cropped)
    count += 1

# === SAVE VISUALIZATION ===
cv2.imwrite(os.path.join(save_dir, "boxed_preview.png"), output_vis)
cv2.imshow("Detected Answer Boxes", output_vis)
print(f"✅ Saved {count} boxes and 'boxed_preview.png' in: {save_dir}")

cv2.waitKey(0)
cv2.destroyAllWindows()
