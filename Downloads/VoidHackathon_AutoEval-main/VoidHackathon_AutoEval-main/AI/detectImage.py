from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image

# Load processor and model once globally to avoid reloading
processor = TrOCRProcessor.from_pretrained('fhswf/TrOCR_Math_handwritten')
model = VisionEncoderDecoderModel.from_pretrained('fhswf/TrOCR_Math_handwritten')

def recognize_math_text(image_path):
    """
    Runs math-specialized Transformer OCR on a local image file.
    Args:
        image_path (str): Path to the image file to OCR.
    Returns:
        str: Recognized text including math symbols.
    """
    image = Image.open(image_path).convert("RGB")
    pixel_values = processor(images=image, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values)
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return generated_text

# Example usage
result = recognize_math_text("image.jpg")
print("OCR Result:", result)
