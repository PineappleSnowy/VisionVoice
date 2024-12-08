from ultralytics import YOLO
import numpy as np
import cv2
from concurrent.futures import ThreadPoolExecutor, as_completed

MIN_MATCH_COUNT = 2
GOOD_MATCHES_DIFF = 0.95
MAX_NON_DETECT_COUNT = 4

# 加载模型
model = YOLO("agent_files/vision_seek/yolo11x-seg.pt")
with open('agent_files/vision_seek/class.txt', 'r') as f:
    classNames = f.read().strip().split('\n')

# 创建特征点检测器
# feature_detector = cv2.SIFT_create()
feature_detector = cv2.ORB_create(nfeatures=10000)

# 目标物品检测器


class ObjectDetector:
    def __init__(self):
        # 目标物品
        self.template_1 = np.array([])
        self.template_2 = np.array([])
        self.template_3 = np.array([])
        self.template_4 = np.array([])
        self.template_5 = np.array([])

    # 提取出目标物品的分割图像
    def detect_init(self, temp_1, temp_2, temp_3, temp_4, temp_5):
        # 获取经分割后的目标图像
        def get_target_img(template):
            template_results_ = model.predict(template, conf=0.3)

            targets = []
            for result in template_results_:
                if result.masks is not None:
                    for mask, box in zip(result.masks.xy, result.boxes):
                        points = np.int32([mask])

                        mask_ = np.zeros_like(template, dtype=np.uint8)
                        cv2.fillPoly(mask_, points, 255)

                        cur_img = template.copy()
                        outer_color = [0, 0, 0]
                        cur_img[mask_[..., 0] != 255] = outer_color

                        x1, y1, x2, y2 = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                        roi = cur_img[y1:y2, x1:x2]
                        targets.append(roi)
                else:
                    return None

            areas = []
            for t in targets:
                if len(t.shape) == 3:
                    t_gray = cv2.cvtColor(t, cv2.COLOR_BGR2GRAY)
                else:
                    t_gray = t
                areas.append(np.sum(cv2.countNonZero(t_gray)))

            max_index = np.argmax(areas)
            template_r = targets[max_index]
            return template_r

        # template_results = []

        # with ThreadPoolExecutor(max_workers=5) as executor:
        #     future_template_1 = executor.submit(get_target_img, temp_1)
        #     future_template_2 = executor.submit(get_target_img, temp_2)
        #     future_template_3 = executor.submit(get_target_img, temp_3)
        #     future_template_4 = executor.submit(get_target_img, temp_4)
        #     future_template_5 = executor.submit(get_target_img, temp_5)

        # for future in as_completed([future_template_1, future_template_2, future_template_3, future_template_4, future_template_5]):
        #     template_ = future.result()
        #     template_results.append(template_)

        # self.template_1, self.template_2, self.template_3, self.template_4, self.template_5 = template_results

        self.template_1 = get_target_img(temp_1)
        self.template_2 = get_target_img(temp_2)
        self.template_3 = get_target_img(temp_3)
        self.template_4 = get_target_img(temp_4)
        self.template_5 = get_target_img(temp_5)
        # cv2.imshow('template_1', template_1)
        # cv2.imshow('template_2', template_2)
        # cv2.imshow('template_3', template_3)
        # cv2.imshow('template_4', template_4)
        # cv2.imshow('template_5', template_5)
        if self.template_1 is None or self.template_2 is None or self.template_3 is None or self.template_4 is None or self.template_5 is None:
            print('未检测到目标物品, 请重新上传目标物品图片')
            return -1
        else:
            return 0

    # 目标物品检测
    def detect_main(self, img):
        # 获得图像宽高
        height, width = img.shape[:2]
        # 物体检测
        results = model.predict(img, conf=0.3)

        for result in results:
            if result.masks is not None:
                boxes_ = []
                for mask, box in zip(result.masks.xy, result.boxes):
                    # 排除掉一些不可能的事物
                    cls = int(box.cls[0])
                    if classNames[cls] in ['person', 'tv', 'book', 'laptop']:
                        continue

                    # 物体分割提取
                    points = np.int32([mask])

                    mask_ = np.zeros_like(img, dtype=np.uint8)
                    cv2.fillPoly(mask_, points, 255)

                    cur_img = img.copy()
                    outer_color = [0, 0, 0]
                    cur_img[mask_[..., 0] != 255] = outer_color

                    x1, y1, x2, y2 = box.xyxy[0]
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    w, h = x2 - x1, y2 - y1
                    roi = cur_img[y1:y2, x1:x2]

                    # 排除掉长宽比不一致的物体
                    height, width = self.template_1.shape[:2]
                    template_ratio_1 = width / height
                    template_ratio_2 = height / width
                    template_ratio_max = max(
                        template_ratio_1, template_ratio_2)
                    template_ratio_min = min(
                        template_ratio_1, template_ratio_2)
                    object_ratio = w / h
                    if object_ratio > template_ratio_max * 1.5 or object_ratio < template_ratio_min / 1.5:
                        continue

                    # 使用双三次插值放大图像
                    roi = cv2.resize(roi, (0, 0), fx=2, fy=2,
                                     interpolation=cv2.INTER_CUBIC)
                    # 去噪处理
                    denoised_image = cv2.fastNlMeansDenoisingColored(
                        roi, None, 10, 10, 7, 21)
                    # 增强对比度
                    gray_image = cv2.cvtColor(
                        denoised_image, cv2.COLOR_BGR2GRAY)
                    roi = cv2.equalizeHist(gray_image)

                    # 特征点匹配
                    def get_matches(template, roi):
                        kp1, des1 = feature_detector.detectAndCompute(
                            template, None)
                        kp2, des2 = feature_detector.detectAndCompute(
                            roi, None)
                        if (des1 is None) or (des2 is None) or len(des2) < 2:
                            return None    # 未检测到特征点或特征点数小于2
                        if des1.dtype != des2.dtype:
                            des1 = des1.astype(np.float32)
                            des2 = des2.astype(np.float32)

                        bf = cv2.BFMatcher()
                        matches_ = bf.knnMatch(des1, des2, k=2)
                        return matches_

                    matches_results = []

                    with ThreadPoolExecutor(max_workers=5) as executor:
                        future_matches_1 = executor.submit(
                            get_matches, self.template_1, roi)
                        future_matches_2 = executor.submit(
                            get_matches, self.template_2, roi)
                        future_matches_3 = executor.submit(
                            get_matches, self.template_3, roi)
                        future_matches_4 = executor.submit(
                            get_matches, self.template_4, roi)
                        future_matches_5 = executor.submit(
                            get_matches, self.template_5, roi)

                        for future in as_completed([future_matches_1, future_matches_2, future_matches_3, future_matches_4, future_matches_5]):
                            matches_ = future.result()
                            matches_results.append(matches_)

                    matches = ()

                    none_count = 0
                    for matches_ in matches_results:
                        if matches_ == None:
                            none_count += 1
                        else:
                            matches += matches_
                    if none_count >= MAX_NON_DETECT_COUNT:
                        continue    # 未检测到足够的匹配点, 跳过该物体

                    # 筛选匹配结果
                    good = []
                    for m_list in matches:
                        if len(m_list) == 2:
                            m, n = m_list
                            if m.distance < GOOD_MATCHES_DIFF * n.distance:
                                good.append([m])

                    if len(good) > MIN_MATCH_COUNT:
                        boxes_.append((x1, y1, w, h))

                # 获取最小的目标框作为最终结果
                if len(boxes_) > 0:
                    size_min = 100000000
                    x_min, y_min, w_min, h_min = 0, 0, 0, 0
                    for box in boxes_:
                        x1, y1, w, h = box
                        size = w * h
                        if size < size_min:
                            size_min = size
                            x_min, y_min, w_min, h_min = x1, y1, w, h
                    print(f'x: {x_min}, y: {y_min}, w: {w_min}, h: {h_min}')

                    left = (x_min + w / 2) / width
                    top = (y_min + h / 2) / height

                    # result = [{'x': x_min, 'y': y_min, 'w': w_min, 'h': h_min}]
                    # result = [{'left': left, 'top': top}]
                    result = [{'left': 0.5, 'top': 0.5}]

                    return result
                else:
                    print('未检测到该物品!')
                    return -1
            else:
                print('未检测到该物品!')
                return -1

    # 释放资源
    def release(self):
        self.template_1 = np.array([])
        self.template_2 = np.array([])
        self.template_3 = np.array([])
        self.template_4 = np.array([])
        self.template_5 = np.array([])


# 创建目标物品检测器
detector = ObjectDetector()
