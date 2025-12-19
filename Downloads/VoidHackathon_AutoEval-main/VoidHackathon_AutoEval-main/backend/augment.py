import cv2
import numpy as np
import os
import random
from PIL import Image, ImageEnhance, ImageFilter
from noise import pnoise2

# Input and output directories
input_dir = "input_images"
output_dir = "augmented_images"
os.makedirs(output_dir, exist_ok=True)

# ======= BASIC TRANSFORMATIONS =======

def random_skew(image):
    rows, cols, _ = image.shape
    angle = random.uniform(-15, 15)
    M = cv2.getRotationMatrix2D((cols/2, rows/2), angle, 1)
    return cv2.warpAffine(image, M, (cols, rows), borderValue=(255, 255, 255))

def random_perspective(image):
    rows, cols, _ = image.shape
    margin = 60
    pts1 = np.float32([[margin, margin], [cols-margin, margin],
                       [margin, rows-margin], [cols-margin, rows-margin]])
    shift = random.randint(10, 50)
    pts2 = np.float32([
        [margin + random.randint(-shift, shift), margin + random.randint(-shift, shift)],
        [cols - margin + random.randint(-shift, shift), margin + random.randint(-shift, shift)],
        [margin + random.randint(-shift, shift), rows - margin + random.randint(-shift, shift)],
        [cols - margin + random.randint(-shift, shift), rows - margin + random.randint(-shift, shift)]
    ])
    M = cv2.getPerspectiveTransform(pts1, pts2)
    return cv2.warpPerspective(image, M, (cols, rows), borderValue=(255, 255, 255))

def random_scale(image):
    scale = random.uniform(0.9, 1.1)
    return cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)

def random_translate(image):
    rows, cols, _ = image.shape
    tx = random.randint(-20, 20)
    ty = random.randint(-20, 20)
    M = np.float32([[1, 0, tx], [0, 1, ty]])
    return cv2.warpAffine(image, M, (cols, rows), borderValue=(255, 255, 255))

def add_noise(image):
    row, col, ch = image.shape
    mean = 0
    var = random.uniform(10, 30)
    sigma = var ** 0.5
    gauss = np.random.normal(mean, sigma, (row, col, ch))
    noisy = image + gauss
    return np.clip(noisy, 0, 255).astype(np.uint8)

def adjust_contrast_brightness(image):
    pil_img = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    enhancer = ImageEnhance.Contrast(pil_img)
    image_enhanced = enhancer.enhance(random.uniform(0.7, 1.3))
    enhancer_brightness = ImageEnhance.Brightness(image_enhanced)
    final = enhancer_brightness.enhance(random.uniform(0.8, 1.2))
    return cv2.cvtColor(np.array(final), cv2.COLOR_RGB2BGR)

def blur_or_wrinkle(image):
    pil_img = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if random.random() > 0.5:
        pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

# ======= ADVANCED AUGMENTATIONS =======

def generate_wrinkle_texture(width, height, scale=100):
    wrinkle_map = np.zeros((height, width), np.float32)
    for y in range(height):
        for x in range(width):
            wrinkle_map[y][x] = pnoise2(x / scale, y / scale, octaves=6)
    wrinkle_map = cv2.normalize(wrinkle_map, None, 0, 255, cv2.NORM_MINMAX)
    wrinkle_map = cv2.GaussianBlur(wrinkle_map, (9,9), 0)
    return wrinkle_map.astype(np.uint8)

def apply_wrinkle_effect(image):
    h, w, _ = image.shape
    wrinkle_map = generate_wrinkle_texture(w, h, scale=random.randint(60, 150))
    wrinkle_colored = cv2.cvtColor(wrinkle_map, cv2.COLOR_GRAY2BGR)
    alpha = random.uniform(0.15, 0.35)
    blended = cv2.addWeighted(image, 1 - alpha, wrinkle_colored, alpha, 0)
    return blended

def apply_shadow(image):
    h, w, _ = image.shape
    mask = np.ones((h, w), np.float32)
    x_start = random.randint(0, w//2)
    y_start = random.randint(0, h//2)
    direction = random.choice(["horizontal", "vertical", "diagonal"])

    if direction == "horizontal":
        for i in range(w):
            mask[:, i] *= 1 - (i - x_start) / w * random.uniform(0.3, 0.6)
    elif direction == "vertical":
        for i in range(h):
            mask[i, :] *= 1 - (i - y_start) / h * random.uniform(0.3, 0.6)
    else:
        for i in range(h):
            for j in range(w):
                mask[i, j] *= 1 - ((i + j) / (h + w)) * random.uniform(0.3, 0.6)

    mask = np.clip(mask, 0.6, 1.0)
    shadowed = (image * mask[..., np.newaxis]).astype(np.uint8)
    return shadowed

# ======= MAIN LOOP =======

for filename in os.listdir(input_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        img_path = os.path.join(input_dir, filename)
        image = cv2.imread(img_path)

        for i in range(10):  # number of distorted versions per image
            aug_img = image.copy()

            # Choose random distortions
            operations = [
                random_skew, random_perspective, random_scale,
                random_translate, add_noise, adjust_contrast_brightness,
                blur_or_wrinkle, apply_wrinkle_effect, apply_shadow
            ]

            num_ops = random.randint(3, 6)
            chosen_ops = random.sample(operations, num_ops)

            for op in chosen_ops:
                aug_img = op(aug_img)

            save_name = f"{os.path.splitext(filename)[0]}_aug_{i+1}.jpg"
            cv2.imwrite(os.path.join(output_dir, save_name), aug_img)

print("✅ Full distorted dataset (with wrinkles + shadows) generated successfully!")
