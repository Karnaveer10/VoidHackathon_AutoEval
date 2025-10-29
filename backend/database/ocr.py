from paddleocr import PaddleOCR

ocr = PaddleOCR(lang='en')
result = ocr.ocr('C:\Users\Karnaveer Singh\Desktop\VoidHackathon\backend\database\filled_only_area.png.png', cls=True)
for line in result[0]:
    print(line[1][0])  # prints recognized text
