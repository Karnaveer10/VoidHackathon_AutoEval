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
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 10
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

# === ✍️ HANDWRITING MASK ===
laplacian = cv2.Laplacian(filled_gray, cv2.CV_64F)
texture = cv2.convertScaleAbs(laplacian)
_, handwriting_mask = cv2.threshold(texture, lap_thresh, 255, cv2.THRESH_BINARY)

# === 🧩 COMBINE MASKS ===
hybrid_mask = cv2.bitwise_and(diff_clean, handwriting_mask)

# === 🔍 DETECT CONTOURS ===
contours, _ = cv2.findContours(hybrid_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
output = filled.copy()
font = cv2.FONT_HERSHEY_SIMPLEX
accepted = 0

for idx, c in enumerate(contours):
    x, y, w_box, h_box = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    aspect_ratio = w_box / float(h_box) if h_box > 0 else 999
    perimeter = cv2.arcLength(c, True)
    reasons = []  # store why this region was selected

    # === FILTERS ===
    if area < min_area:
        continue
    else:
        reasons.append("Area OK")

    if w_box < min_w or h_box < min_h:
        continue
    else:
        reasons.append("Size OK")

    if aspect_ratio > aspect_max:
        continue
    else:
        reasons.append("Aspect OK")

    hull = cv2.convexHull(c)
    hull_area = cv2.contourArea(hull)
    if hull_area == 0:
        continue

    solidity = float(area) / hull_area
    region = filled_gray[y:y + h_box, x:x + w_box]
    if region.size == 0:
        continue

    edges = cv2.Canny(region, 50, 150)
    edge_density = np.sum(edges > 0) / float(w_box * h_box)
    if edge_density < edge_min:
        continue
    else:
        reasons.append("Edges OK")

    elongation = max(w_box, h_box) / (min(w_box, h_box) + 1e-5)
    if elongation > elong_max:
        continue
    else:
        reasons.append("Elongation OK")

    # === ACCEPT ===
    accepted += 1
    cv2.rectangle(output, (x, y), (x + w_box, y + h_box), (0, 255, 0), 2)
    cv2.putText(output, f"#{idx}", (x, y - 6), font, 0.45, (0, 255, 0), 1, cv2.LINE_AA)

    # Add reasoning text below the box
    text_y = y + h_box + 15
    for reason in reasons:
        cv2.putText(output, reason, (x, text_y), font, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
        text_y += 15

print(f"\n✅ Final refined detector found {accepted} valid handwriting/changed regions.")

# === DISPLAY OPTIONS ===
SHOW_MODE = "side_by_side"  # change to "single" if you prefer
filled_vis = cv2.cvtColor(filled_gray, cv2.COLOR_GRAY2BGR)
mask_vis = cv2.cvtColor(hybrid_mask, cv2.COLOR_GRAY2BGR)

if SHOW_MODE == "single":
    vis = output
else:
    vis = np.hstack([filled_vis, mask_vis, output])

# === SMART RESIZING ===
max_win_w, max_win_h = 1200, 800
vis_h, vis_w = vis.shape[:2]
scale = min(max_win_w / vis_w, max_win_h / vis_h, 1.0)
vis_display = cv2.resize(
    vis, (int(vis_w * scale), int(vis_h * scale)), interpolation=cv2.INTER_AREA
)

# === SHOW WINDOW ===
win_name = "Hybrid Detector - With Selection Reasoning"
cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
cv2.imshow(win_name, vis_display)
print("\nPress any key on the image window to close it.")
cv2.waitKey(0)
cv2.destroyAllWindows()
