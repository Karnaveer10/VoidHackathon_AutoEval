import cv2
import numpy as np
import os
from sklearn.cluster import DBSCAN
import matplotlib.pyplot as plt

# === PATH CONFIG ===
INPUT_PATH = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\extraction"
OUTPUT_PATH = "output_detections"
os.makedirs(OUTPUT_PATH, exist_ok=True)


def detect_boxes_and_bubbles(image_path, visualize=True):
    img = cv2.imread(image_path)
    orig = img.copy()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # === 1️⃣ Adaptive Denoising & Edge Detection ===
    gray = cv2.fastNlMeansDenoising(gray, None, 15, 7, 21)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    k = int(np.clip(lap_var / 100, 1, 5))
    edges = cv2.Canny(gray, 40, 150)
    edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)), iterations=1)

    # === 2️⃣ Auto Skew Correction ===
    lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)
    if lines is not None:
        angles = [theta for rho, theta in lines[:, 0]]
        median_angle = np.median(np.rad2deg(angles)) - 90
        if abs(median_angle) > 1:
            h, w = gray.shape
            M = cv2.getRotationMatrix2D((w // 2, h // 2), median_angle, 1.0)
            gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC)
            edges = cv2.warpAffine(edges, M, (w, h), flags=cv2.INTER_CUBIC)

    # === 3️⃣ Contour Detection ===
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates, centers, shapes = [], [], []

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        if area < 100 or w < 10 or h < 10:
            continue

        aspect = w / float(h)
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)
        compactness = (4 * np.pi * area) / (peri ** 2 + 1e-5)

        if len(approx) >= 8 and 0.7 < compactness < 1.3:
            shape_type = "circle"
        elif len(approx) == 4 and 0.7 < aspect < 1.3:
            shape_type = "square"
        else:
            continue

        if 400 < area < 30000:
            candidates.append((x, y, w, h))
            centers.append([x + w / 2, y + h / 2])
            shapes.append(shape_type)

    # === 4️⃣ Cluster Merging (DBSCAN) ===
    if len(centers) > 0:
        clustering = DBSCAN(eps=25, min_samples=1).fit(centers)
        labels = clustering.labels_
        unique_labels = set(labels)
        clustered_boxes, clustered_shapes = [], []

        for label in unique_labels:
            cluster_points = np.array([candidates[i] for i in range(len(candidates)) if labels[i] == label])
            cluster_shapes = [shapes[i] for i in range(len(candidates)) if labels[i] == label]
            x_min, y_min = np.min(cluster_points[:, 0]), np.min(cluster_points[:, 1])
            x_max, y_max = np.max(cluster_points[:, 0] + cluster_points[:, 2]), np.max(cluster_points[:, 1] + cluster_points[:, 3])
            clustered_boxes.append((x_min, y_min, x_max - x_min, y_max - y_min))
            clustered_shapes.append(max(set(cluster_shapes), key=cluster_shapes.count))

        candidates, shapes = clustered_boxes, clustered_shapes

    # === 5️⃣ Confidence Scoring ===
    confidences = []
    for (x, y, w, h) in candidates:
        roi = gray[y:y + h, x:x + w]
        edge_density = cv2.countNonZero(cv2.Canny(roi, 50, 150)) / (w * h)
        conf = np.clip(1.0 - abs(edge_density - 0.1), 0, 1)
        confidences.append(conf)

    # === 6️⃣ Visualization ===
    for i, ((x, y, w, h), conf, shape) in enumerate(zip(candidates, confidences, shapes)):
        color = (0, int(255 * conf), int(255 * (1 - conf)))
        cv2.rectangle(orig, (x, y), (x + w, y + h), color, 2)
        cv2.putText(orig, f"{shape}:{conf:.2f}", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

    if visualize:
        plt.figure(figsize=(10, 10))
        plt.imshow(cv2.cvtColor(orig, cv2.COLOR_BGR2RGB))
        plt.title(f"Detected Boxes & Bubbles - {os.path.basename(image_path)}")
        plt.axis("off")
        plt.show()

    # === 7️⃣ Save Detections ===
    for i, ((x, y, w, h), shape) in enumerate(zip(candidates, shapes)):
        crop = img[y:y + h, x:x + w]
        out_name = f"{os.path.splitext(os.path.basename(image_path))[0]}_{shape}_{i + 1}.png"
        cv2.imwrite(os.path.join(OUTPUT_PATH, out_name), crop)

    return candidates, shapes, confidences


# === RUN ON A SINGLE IMAGE ===
files = [f for f in os.listdir(INPUT_PATH) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
if not files:
    print("⚠️ No image found in extraction folder.")
else:
    test_image = os.path.join(INPUT_PATH, files[0])
    print(f"Processing single image: {test_image}")
    boxes, shapes, confs = detect_boxes_and_bubbles(test_image)
    print(f"✅ Detected {len(boxes)} regions ({sum(s == 'circle' for s in shapes)} circles, {sum(s == 'square' for s in shapes)} squares)")
