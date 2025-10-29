import cv2
import numpy as np

# === 📂 PATH CONFIG ===
blank_path = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\input_images\2.jpg"   # Blank
filled_path = r"C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\extraction\2extraction.png"  # Filled

# === 🧠 LOAD IMAGES ===
blank = cv2.imread(blank_path)
filled = cv2.imread(filled_path)

if blank is None or filled is None:
    raise ValueError("❌ Error: Could not load one or both images. Check paths!")

filled = cv2.resize(filled, (blank.shape[1], blank.shape[0]))

# === 🧩 ALIGN IMAGES ===
orb = cv2.ORB_create(5000)
kp1, des1 = orb.detectAndCompute(blank, None)
kp2, des2 = orb.detectAndCompute(filled, None)
matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = matcher.match(des1, des2)
matches = sorted(matches, key=lambda x: x.distance)
pts1 = np.float32([kp1[m.queryIdx].pt for m in matches[:50]]).reshape(-1, 1, 2)
pts2 = np.float32([kp2[m.trainIdx].pt for m in matches[:50]]).reshape(-1, 1, 2)
H, _ = cv2.findHomography(pts2, pts1, cv2.RANSAC, 5.0)
aligned_filled = cv2.warpPerspective(filled, H, (blank.shape[1], blank.shape[0]))

# === ⚙️ PREPROCESS ===
gray_blank = cv2.cvtColor(blank, cv2.COLOR_BGR2GRAY)
gray_filled = cv2.cvtColor(aligned_filled, cv2.COLOR_BGR2GRAY)

gray_blank = cv2.equalizeHist(cv2.GaussianBlur(gray_blank, (5, 5), 0))
gray_filled = cv2.equalizeHist(cv2.GaussianBlur(gray_filled, (5, 5), 0))

# === 🔍 DIFFERENCE ===
diff = cv2.absdiff(gray_blank, gray_filled)
_, mask = cv2.threshold(diff, 35, 255, cv2.THRESH_BINARY)
kernel = np.ones((5, 5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

# === 🎨 EXTRACT ONLY FILLED AREA ===
filled_only = cv2.bitwise_and(aligned_filled, aligned_filled, mask=mask)

# Optional: white background instead of black
white_bg = np.ones_like(aligned_filled) * 255
output = np.where(mask[:, :, None] == 255, filled_only, white_bg)

# === 💾 SAVE & SHOW ===
cv2.imshow("Only Marked Area", output)
cv2.imwrite("only_filled_area.png", output)
print("✅ Saved: only_filled_area.png")

cv2.waitKey(0)
cv2.destroyAllWindows()