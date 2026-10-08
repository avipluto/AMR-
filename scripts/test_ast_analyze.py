import urllib.request
import numpy as np
import cv2

# Create synthetic AST plate image
img = np.full((300, 300, 3), 70, dtype=np.uint8)
cv2.circle(img, (150, 150), 120, (40, 40, 40), -1)
cv2.circle(img, (150, 150), 15, (240, 240, 240), -1)
_, buf = cv2.imencode('.png', img)

boundary = 'testboundary456'
body = (
    b'--' + boundary.encode() + b'\r\n'
    b'Content-Disposition: form-data; name="file"; filename="plate.png"\r\n'
    b'Content-Type: image/png\r\n\r\n'
    + buf.tobytes() + b'\r\n'
    b'--' + boundary.encode() + b'\r\n'
    b'Content-Disposition: form-data; name="organism"\r\n\r\n'
    b'Escherichia coli\r\n'
    b'--' + boundary.encode() + b'--\r\n'
)

req = urllib.request.Request(
    'http://127.0.0.1:8001/api/ast/analyze',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=' + boundary}
)

res = urllib.request.urlopen(req)
print("HTTP Status:", res.getcode())
print("Response preview:", res.read().decode()[:250])
