import os
from ultralytics import YOLO

# 加载模型
module_dir = os.path.dirname(__file__)
yolo_path = os.path.join(module_dir, 'yolo11x-seg.pt')
model = YOLO(yolo_path)