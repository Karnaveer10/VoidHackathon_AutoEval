import cv2
import pytesseract
import numpy as np
import re

# Set Tesseract OCR executable path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'

EAST_MODEL = 'frozen_east_text_detection.pb'  # Make sure this file is downloaded and present

def decode_predictions(scores, geometry, min_confidence):
    numRows, numCols = scores.shape[2:4]
    rects = []
    confidences = []
    for y in range(numRows):
        for x in range(numCols):
            score = scores[0, 0, y, x]
            if score < min_confidence:
                continue
            offsetX, offsetY = x * 4.0, y * 4.0
            angle = geometry[0, 4, y, x]
            cos, sin = np.cos(angle), np.sin(angle)
            h = geometry[0, 0, y, x]
            w = geometry[0, 1, y, x]
            endX = int(offsetX + (cos * w + sin * h))
            endY = int(offsetY - (sin * w + cos * h))
            startX = int(offsetX)
            startY = int(offsetY)
            rects.append((startX, startY, endX, endY))
            confidences.append(float(score))
    return rects, confidences

def detect_text_east(image_path, min_confidence=0.3, width=640, height=640, viz=False):
    # Load image and resize with multiples of 32 as EAST expects
    image = cv2.imread(image_path)
    orig = image.copy()
    (H, W) = image.shape[:2]

    newW, newH = (width, height)
    rW = W / float(newW)
    rH = H / float(newH)

    image = cv2.resize(image, (newW, newH))

    blob = cv2.dnn.blobFromImage(image, 1.0, (newW, newH),
                                 (123.68, 116.78, 103.94), swapRB=True, crop=False)

    net = cv2.dnn.readNet(EAST_MODEL)
    net.setInput(blob)
    (scores, geometry) = net.forward(['feature_fusion/Conv_7/Sigmoid',
                                      'feature_fusion/concat_3'])

    rects, confidences = decode_predictions(scores, geometry, min_confidence)

    print(f"[DEBUG] Boxes detected before NMS: {len(rects)}")

    indices = cv2.dnn.NMSBoxes(rects, confidences, min_confidence, 0.4)

    boxes = []
    if len(indices) > 0:
        if hasattr(indices[0], '__iter__'):
            boxes = [rects[i[0]] for i in indices]
        else:
            boxes = [rects[i] for i in indices]

    print(f"[DEBUG] Boxes detected after NMS: {len(boxes)}")

    results = []
    for (startX, startY, endX, endY) in boxes:
        sx, sy, ex, ey = int(startX * rW), int(startY * rH), int(endX * rW), int(endY * rH)
        w, h = ex - sx, ey - sy
        if w > 20 and h > 10:
            results.append((sx, sy, w, h))
            if viz:
                cv2.rectangle(orig, (sx, sy), (ex, ey), (0, 255, 0), 2)

    if viz:
        cv2.imshow('Text Detection', orig)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    return orig, results

def extract_texts_from_boxes(img, boxes):
    texts = []
    for (x, y, w, h) in boxes:
        roi = img[y:y+h, x:x+w]
        roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        roi_thresh = cv2.threshold(roi_gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        txt = pytesseract.image_to_string(roi_thresh, config='--psm 7').strip()
        print(f"[DEBUG OCR] Box @({x},{y},{w},{h}) text: '{txt}'")
        if txt:
            texts.append({'bbox': (x, y, w, h), 'text': txt})
    return texts

def visualize_text_boxes_and_text(img, text_regions):
    output = img.copy()
    for region in text_regions:
        x, y, w, h = region['bbox']
        cv2.rectangle(output, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(output, region['text'][:15], (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    cv2.imshow("Detected text with OCR", output)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

def classify_text_regions(text_regions, img_width):
    questions, answers = [], []
    for region in text_regions:
        txt = region['text']
        # Heuristic: questions contain keywords or numbered list format
        if re.search(r'(choose|write|fill|match|minus|correct|question|true|false|circle|pair|sentence|draw|number|box|blank|equals)', txt.lower()) or re.match(r'^[0-9]+[).]', txt):
            questions.append(region)
        elif len(txt) <= 4 and any([c.isalnum() for c in txt]):
            answers.append(region)
        else:
            # Fallback positional: assume answers more right side
            if region['bbox'][0] > 0.4 * img_width:
                answers.append(region)
            else:
                questions.append(region)
    return questions, answers

def scan_exam_sheet(image_path, show_viz=False):
    img, boxes = detect_text_east(image_path, viz=show_viz)
    if not boxes:
        print("[INFO] No text boxes detected.")
        return []

    regions = extract_texts_from_boxes(img, boxes)
    if not regions:
        print("[INFO] No readable text extracted from detected regions.")
        return []

    questions, answers = classify_text_regions(regions, img.shape[1])

    print("\n--- Questions Detected ---")
    for q in questions:
        print(f"Q@{q['bbox']}: {q['text']}")

    print("\n--- Answers Detected ---")
    for a in answers:
        print(f"A@{a['bbox']}: {a['text']}")

    result_set = []
    for a in answers:
        closest_q = min(questions, key=lambda q: abs(q['bbox'][1] - a['bbox'][1]))
        result_set.append({'question': closest_q['text'], 'answer': a['text'], 'location': a['bbox']})
        print(f"Matched Q: {closest_q['text']} --> A: {a['text']} at {a['bbox']}")

    return result_set

# Example usage
if __name__ == "__main__":
    image_file = "Images/Paper.png"  # Update path accordingly
    results = scan_exam_sheet(image_file, show_viz=True)
    # optionally visualize the OCR texts again
    img, boxes = detect_text_east(image_file, viz=True)
    texts = extract_texts_from_boxes(img, boxes)
    visualize_text_boxes_and_text(img, texts)
