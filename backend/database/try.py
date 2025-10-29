import cv2
import numpy as np
import os

# === 📂 PATH CONFIG ===
blank_path = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\input_images\2.jpg"
filled_path = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\extraction\2extraction.png"

# === 🖼️ READ IMAGES ===
blank = cv2.imread(blank_path)
filled = cv2.imread(filled_path)
if blank is None or filled is None:
    raise ValueError("❌ Error reading input images. Check file paths!")

# === RESIZE TO MATCH ===
h = min(blank.shape[0], filled.shape[0])
w = min(blank.shape[1], filled.shape[1])
blank = cv2.resize(blank, (w, h))
filled = cv2.resize(filled, (w, h))

# === 🧹 PREPROCESSING FUNCTION ===
def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 8, 7, 21)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    binary = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 21, 10
    )
    return gray, binary

blank_gray, blank_bin = preprocess(blank)
filled_gray, filled_bin = preprocess(filled)

# === 🎚️ FIXED THRESHOLDS (From tuned sliders) ===
lap_thresh = 35
ksize = 5
close_iter = 3
open_iter = 1
min_area = 371
min_w = 15
min_h = 14
aspect_max = 9
edge_min = 0.12
elong_max = 9

# === ⚙️ DIFF MAP CREATION ===
diff = cv2.bitwise_xor(blank_bin, filled_bin)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (ksize, ksize))
diff_clean = cv2.morphologyEx(diff, cv2.MORPH_CLOSE, kernel, iterations=close_iter)
diff_clean = cv2.morphologyEx(diff_clean, cv2.MORPH_OPEN, kernel, iterations=open_iter)

# === ✍️ IMPROVED HANDWRITING MASK ===
laplacian = cv2.Laplacian(filled_gray, cv2.CV_64F)
texture = cv2.convertScaleAbs(laplacian)

# Gradient direction variance (detects irregular strokes)
sobelx = cv2.Sobel(filled_gray, cv2.CV_64F, 1, 0, ksize=3)
sobely = cv2.Sobel(filled_gray, cv2.CV_64F, 0, 1, ksize=3)
magnitude = np.sqrt(sobelx ** 2 + sobely ** 2)
direction = np.arctan2(sobely, sobelx)

# Local variance of gradient direction
direction_var = cv2.blur(direction**2, (9, 9)) - cv2.blur(direction, (9, 9))**2
direction_var = cv2.convertScaleAbs(255 * (direction_var / np.max(direction_var)))

# Handwriting mask = Laplacian + gradient variance + edge density
edges = cv2.Canny(filled_gray, 50, 150)
combined_mask = cv2.addWeighted(texture, 0.6, direction_var, 0.4, 0)
_, handwriting_mask = cv2.threshold(combined_mask, lap_thresh, 255, cv2.THRESH_BINARY)

# === 🧩 COMBINE WITH STRUCTURAL DIFF ===
hybrid_mask = cv2.bitwise_and(diff_clean, handwriting_mask)

# === 🔍 DETECT CONTOURS ===
contours, _ = cv2.findContours(hybrid_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
output = filled.copy()
font = cv2.FONT_HERSHEY_SIMPLEX
accepted = 0

for idx, c in enumerate(contours):
    x, y, w_box, h_box = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    aspect_ratio = w_box / float(h_box)
    if h_box == 0:
        continue
    if area < min_area or w_box < min_w or h_box < min_h or aspect_ratio > aspect_max:
        continue

    region = filled_gray[y:y+h_box, x:x+w_box]
    edges = cv2.Canny(region, 50, 150)
    edge_density = np.sum(edges > 0) / float(w_box * h_box)
    if edge_density < edge_min:
        continue

    elongation = max(w_box, h_box) / (min(w_box, h_box) + 1e-5)
    if elongation > elong_max:
        continue

    # === Geometry filter: reject straight-line drawings ===
    lines = cv2.HoughLines(edges, 1, np.pi / 180, 40)
    if lines is not None and len(lines) > 4:
        # too many parallel lines = diagram or shape
        continue

    accepted += 1
    cv2.rectangle(output, (x, y), (x + w_box, y + h_box), (0, 255, 0), 2)
    cv2.putText(output, f"#{idx}", (x, y - 6), font, 0.5, (0, 255, 0), 1, cv2.LINE_AA)

print(f"\n✅ Final refined detector found {accepted} valid handwriting/changed regions.")

# === DISPLAY RESULTS ===
SHOW_MODE = "side_by_side"
filled_vis = cv2.cvtColor(filled_gray, cv2.COLOR_GRAY2BGR)
mask_vis = cv2.cvtColor(hybrid_mask, cv2.COLOR_GRAY2BGR)

if SHOW_MODE == "single":
    vis = output
else:
    vis = np.hstack([filled_vis, mask_vis, output])

max_win_w, max_win_h = 1200, 800
vis_h, vis_w = vis.shape[:2]
scale = min(max_win_w / vis_w, max_win_h / vis_h, 1.0)
vis_display = cv2.resize(vis, (int(vis_w * scale), int(vis_h * scale)), interpolation=cv2.INTER_AREA)

cv2.imshow("Hybrid Detector - Refined (Curves & Diagrams Ignored)", vis_display)
cv2.waitKey(0)
cv2.destroyAllWindows()
