from ultralytics import YOLO
import cv2

model = YOLO("yolo11n.yaml").load("./agent_files/obstacle_avoid/best.pt")  # 加载模型

# YOLO检测种类字典
yolo_classes = {
    0: 'person',
    1: 'bicycle',
    2: 'car',
    3: 'motorcycle',
    4: 'airplane',
    5: 'bus',
    6: 'train',
    7: 'truck',
    8: 'boat',
    9: 'traffic light',
    10: 'fire hydrant',
    11: 'stop sign',
    12: 'parking meter',
    13: 'bench',
    14: 'bird',
    15: 'cat',
    16: 'dog',
    17: 'horse',
    18: 'sheep',
    19: 'cow',
    20: 'elephant',
    21: 'bear',
    22: 'zebra',
    23: 'giraffe',
    24: 'backpack',
    25: 'umbrella',
    26: 'handbag',
    27: 'tie',
    28: 'suitcase',
    29: 'frisbee',
    30: 'skis',
    31: 'snowboard',
    32: 'sports ball',
    33: 'kite',
    34: 'baseball bat',
    35: 'baseball glove',
    36: 'skateboard',
    37: 'surfboard',
    38: 'tennis racket',
    39: 'bottle',
    40: 'wine glass',
    41: 'cup',
    42: 'fork',
    43: 'knife',
    44: 'spoon',
    45: 'bowl',
    46: 'banana',
    47: 'apple',
    48: 'sandwich',
    49: 'orange',
    50: 'broccoli',
    51: 'carrot',
    52: 'hot dog',
    53: 'pizza',
    54: 'donut',
    55: 'cake',
    56: 'chair',
    57: 'couch',
    58: 'potted plant',
    59: 'bed',
    60: 'dining table',
    61: 'toilet',
    62: 'tv',
    63: 'laptop',
    64: 'mouse',
    65: 'remote',
    66: 'keyboard',
    67: 'cell phone',
    68: 'microwave',
    69: 'oven',
    70: 'toaster',
    71: 'sink',
    72: 'refrigerator',
    73: 'book',
    74: 'clock',
    75: 'vase',
    76: 'scissors',
    77: 'teddy bear',
    78: 'hair dryer',
    79: 'toothbrush'
}

yolo_classes_en_to_zh = {
    'person': '人',
    'bicycle': '自行车',
    'car': '汽车',
    'motorcycle': '摩托车',
    'airplane': '飞机',
    'bus': '公共汽车',
    'train': '火车',
    'truck': '卡车',
    'boat': '船',
    'traffic light': '交通灯',
    'fire hydrant': '消防栓',
    'stop sign': '停车标志',
    'parking meter': '停车计时器',
    'bench': '长椅',
    'bird': '鸟',
    'cat': '猫',
    'dog': '狗',
    'horse': '马',
    'sheep': '羊',
    'cow': '牛',
    'elephant': '大象',
    'bear': '熊',
    'zebra': '斑马',
    'giraffe': '长颈鹿',
    'backpack': '背包',
    'umbrella': '雨伞',
    'handbag': '手提包',
    'tie': '领带',
    'suitcase': '行李箱',
    'frisbee': '飞盘',
    'skis': '滑雪板',
    'snowboard': '单板滑雪板',
    'sports ball': '运动球',
    'kite': '风筝',
    'baseball bat': '棒球棒',
    'baseball glove': '棒球手套',
    'skateboard': '滑板',
    'surfboard': '冲浪板',
    'tennis racket': '网球拍',
    'bottle': '瓶子',
    'wine glass': '酒杯',
    'cup': '杯子',
    'fork': '叉子',
    'knife': '刀子',
    'spoon': '勺子',
    'bowl': '碗',
    'banana': '香蕉',
    'apple': '苹果',
    'sandwich': '三明治',
    'orange': '橙子',
    'broccoli': '西兰花',
    'carrot': '胡萝卜',
    'hot dog': '热狗',
    'pizza': '比萨',
    'donut': '甜甜圈',
    'cake': '蛋糕',
    'chair': '椅子',
    'couch': '沙发',
    'potted plant': '盆栽',
    'bed': '床',
    'dining table': '餐桌',
    'toilet': '马桶',
    'tv': '电视',
    'laptop': '笔记本电脑',
    'mouse': '鼠标',
    'remote': '遥控器',
    'keyboard': '键盘',
    'cell phone': '手机',
    'microwave': '微波炉',
    'oven': '烤箱',
    'toaster': '烤面包机',
    'sink': '水槽',
    'refrigerator': '冰箱',
    'book': '书',
    'clock': '时钟',
    'vase': '花瓶',
    'scissors': '剪刀',
    'teddy bear': '泰迪熊',
    'hair dryer': '吹风机',
    'toothbrush': '牙刷',
    'unknown': '未知'
}

def detect(frame):
    """避障算法实现

    Args:
        frame (cv2.Mat): 用于检测的图片
    return: 
        返回标签、距离、位置信息
    """
    confidence_threshold = 0.35  # 设置置信度阈值
    results = model(frame)
    obstacle_info = []
    for i, (x, y, w, h) in enumerate(results[0].boxes.xywh):
        cls_id = int(results[0].boxes.cls[i])  # 获取类别ID
        confidence = results[0].boxes.conf[i]  # 获取置信度
        label = yolo_classes.get(cls_id, "unknow")  # 获取中文标签（默认未知）
        zh_label = yolo_classes_en_to_zh[label]
        if confidence > confidence_threshold:
            p = y + h / 2  # 像素坐标
            distance_real = -2.08054369e-12*p**4 + 6.25478630e-09*p**3 - 5.88280567e-06*p**2 + 1.07600182e-03*p + 9.74917750e-01
            # print(f"{label}:{distance_real}:{p}")  # 输出格式“种类：真实世界距离：像素距离”
            obstacle_info.append({"label": zh_label, "distant": distance_real.item(), "location": {"tl": (y - h / 2).item(), "w": w.item(), "h": h.item()}})
            # if distance_real < 1 and x > 180 and x < 320:
            #     print(f"{distance_real:.1f}米有{label}，请靠右")
            # elif distance_real < 1 and x > 320 and x < 460:
                # print(f"{distance_real:.1f}米有{label}，请靠左")
    return obstacle_info


def obstacle_avoid_realize(path):
    frame = cv2.imread(path)
    obstacle_info = detect(frame)
    return obstacle_info