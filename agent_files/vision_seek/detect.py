import numpy as np
import cv2
from concurrent.futures import ThreadPoolExecutor

from ultralytics import YOLO
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.resnet50 import preprocess_input
from sklearn.metrics.pairwise import cosine_similarity


SIMILARITY_SCORE_THRESHOLD = 0.3
MIN_DETECT_COUNT = 1
GOOD_MATCHES_DIFF = 0.95
MIN_MATCH_COUNT = 1

# 加载模型
model = YOLO("agent_files/vision_seek/yolo11x-seg.pt")
with open('agent_files/vision_seek/class.txt', 'r') as f:
    classNames = f.read().strip().split('\n')

# 创建特征点检测器
# feature_detector = cv2.SIFT_create()
feature_detector = cv2.ORB_create(nfeatures=10000)

# 加载预训练的ResNet50模型（去掉最后的全连接层，以获得高维特征向量）
ResNet_Model = ResNet50(weights='imagenet', include_top=False, pooling='avg')


# 读取和预处理图像
def preprocess_image(img, target_size=(224, 224)):
    img = image.img_to_array(img)
    img = image.array_to_img(img)
    img = img.resize(target_size)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    return img_array

# 提取图像的特征向量
def extract_features(img):
    img_array = preprocess_image(img)
    features = ResNet_Model.predict(img_array)
    return features.flatten()

# 计算两张图片特征的余弦相似度
def compute_similarity(feature1, feature2):
    similarity = cosine_similarity([feature1], [feature2])
    return similarity[0][0]


# # 用于计算像素平均颜色
# def calculate_pixel_average(image):
#     image_array = np.array(image)
#     height, width, _ = image_array.shape

#     total_pixels = 0
#     total_sum = np.zeros(3)
#     for y in range(height):
#         for x in range(width):
#             pixel = image_array[y, x]
#             if not np.array_equal(pixel, [0, 0, 0]):
#                 total_pixels += 1
#                 total_sum += pixel

#     if total_pixels == 0:
#         return None

#     average_color = total_sum / total_pixels
#     return average_color.tolist()


# 目标物品检测器
class ObjectDetector:
    def __init__(self):
        self.templates = []
        self.templates_features = []
        # self.template_average_color_R = 0
        # self.template_average_color_G = 0
        # self.template_average_color_B = 0

    # 提取出目标物品的分割图像和特征向量
    def detect_init(self, *templates):
        # 获取经分割后的目标图像和未分割的目标图像
        def get_target_img(template):
            template_results_ = model.predict(template, conf=0.3)

            targets = []
            targets_origin = []
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
                        roi_ = template[y1:y2, x1:x2]
                        targets.append(roi)
                        targets_origin.append(roi_)
                else:
                    return None, None

            areas = []
            for t in targets:
                if len(t.shape) == 3:
                    t_gray = cv2.cvtColor(t, cv2.COLOR_BGR2GRAY)
                else:
                    t_gray = t
                areas.append(np.sum(cv2.countNonZero(t_gray)))

            max_index = np.argmax(areas)
            template_r = targets[max_index]
            template_r_origin = targets_origin[max_index]
            return template_r, template_r_origin

        self.templates = []
        self.templates_features = []
        for temp in templates:
            result, result_origin = get_target_img(temp)
            if result is not None and result_origin is not None:
                self.templates.append(result)
                # self.templates_features.append(extract_features(result))
                self.templates_features.append(extract_features(result_origin))
            else:
                self.templates.append(None)
                self.templates_features.append(None)
                break
        
        i = 1
        for template in self.templates:
            if template is None:
                self.templates = []
                self.templates_features = []
                # print(f'未检测到第 {i} 张图片中的目标物品, 请重新上传目标物品图片')
                return i
            i += 1

        # self.template_average_color_R = 0
        # self.template_average_color_G = 0
        # self.template_average_color_B = 0

        # non_pixels_count = 0

        # with ThreadPoolExecutor(max_workers = len(self.templates)) as executor:
        #     future_r = {executor.submit(calculate_pixel_average, template): idx for idx, template in enumerate(self.templates)}

        # for future in future_r.keys():
        #     if future.result() == None:
        #         non_pixels_count += 1
        #     else:
        #         self.template_average_color_R += future.result()[0]
        #         self.template_average_color_G += future.result()[1]
        #         self.template_average_color_B += future.result()[2]

        # self.template_average_color_R /= (len(self.templates) - non_pixels_count)
        # self.template_average_color_G /= (len(self.templates) - non_pixels_count)
        # self.template_average_color_B /= (len(self.templates) - non_pixels_count)

        return 0

    # 目标物品检测
    def detect_main(self, img):
        # 获取图像的宽高
        img_height, img_width, _ = img.shape

        # 物体检测
        results = model.predict(img, conf=0.3)

        for result in results:
            if result.masks is not None:
                boxes_ = []
                for mask, box in zip(result.masks.xy, result.boxes):
                    # 排除掉一些不可能的事物
                    cls = int(box.cls[0])
                    if classNames[cls] in ['person', 'tv', 'book', 'laptop', 'bench', 'chair', 'couch', 'bed', 'dining table', 'refrigerator', 'toilet']:
                        continue

                    # 获取识别框的位置信息
                    x1, y1, x2, y2 = box.xyxy[0]
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    w, h = x2 - x1, y2 - y1

                    # 物体分割提取
                    points = np.int32([mask])
                    mask_ = np.zeros_like(img, dtype=np.uint8)
                    cv2.fillPoly(mask_, points, 255)

                    cur_img = img.copy()
                    outer_color = [0, 0, 0]
                    cur_img[mask_[..., 0] != 255] = outer_color

                    roi = cur_img[y1:y2, x1:x2]

                    # 排除掉长宽比不一致的物体
                    # height, width = self.template_1.shape[:2]
                    # template_ratio_1 = width / height
                    # template_ratio_2 = height / width
                    # template_ratio_max = max(template_ratio_1, template_ratio_2)
                    # template_ratio_min = min(template_ratio_1, template_ratio_2)
                    # object_ratio = w / h
                    # if object_ratio > template_ratio_max * 1.5 or object_ratio < template_ratio_min / 1.5:
                    #     continue

                    # 若总体颜色差异过大, 跳过该物体
                    # roi_average_color_results = calculate_pixel_average(roi)
                    # if roi_average_color_results != None:
                    #     roi_average_color_R, roi_average_color_G, roi_average_color_B = roi_average_color_results

                    #     if abs(roi_average_color_R - self.template_average_color_R) > 60 or \
                    #        abs(roi_average_color_G - self.template_average_color_G) > 60 or \
                    #        abs(roi_average_color_B - self.template_average_color_B) > 60:
                    #         continue

                    # 若余弦相似度过低, 跳过该物体
                    roi_features = extract_features(img[y1:y2, x1:x2])
                    # roi_features = extract_features(roi)

                    similarity_score = 0
                    for template_feature_ in self.templates_features:
                        similarity_score_cur = compute_similarity(template_feature_, roi_features)
                        if similarity_score_cur > similarity_score:
                            similarity_score = similarity_score_cur
                    print(f'相似度: {similarity_score}')

                    if similarity_score < SIMILARITY_SCORE_THRESHOLD:
                        continue

                    # 放大图像, 去噪处理, 增强对比度
                    if w * h < 10000:
                        # 使用双三次插值放大图像
                        roi = cv2.resize(roi, (0, 0), fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
                        # 去噪处理
                        denoised_image = cv2.fastNlMeansDenoisingColored(roi, None, 10, 10, 7, 21)
                        # 增强对比度
                        gray_image = cv2.cvtColor(denoised_image, cv2.COLOR_BGR2GRAY)
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
                    with ThreadPoolExecutor(max_workers = len(self.templates)) as executor:
                        future_matches = {executor.submit(get_matches, template, roi): idx for idx, template in enumerate(self.templates)}

                    for future in future_matches.keys():
                        matches_ = future.result()
                        matches_results.append(matches_)

                    matches = ()

                    none_count = 0
                    for matches_ in matches_results:
                        if matches_ == None:
                            none_count += 1
                        else:
                            matches += matches_
                    detect_num_thres_ = max(len(self.templates) - MIN_DETECT_COUNT, 0)
                    if none_count > detect_num_thres_:
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

                    left = (x_min + w_min / 2) / img_width
                    top = (y_min + h_min / 2) / img_height

                    # result = [{'x': x_min, 'y': y_min, 'w': w_min, 'h': h_min}]
                    result = [{'left': left, 'top': top}]
                    return result
                else:
                    # print('未检测到该物品!')
                    return []
            else:
                # print('未检测到该物品!')
                return []

    # 释放资源
    def release(self):
        self.templates = []
        self.templates_features = []
        # self.template_average_color_R = 0
        # self.template_average_color_G = 0
        # self.template_average_color_B = 0


# 创建目标物品检测器
detector = ObjectDetector()