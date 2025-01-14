import os, sys, cv2
os.environ['CUDA_VISIBLE_DEVICES'] = '-1' # 禁用GPU
import numpy as np
import tensorflow as tf
# from concurrent.futures import ThreadPoolExecutor
# from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications import EfficientNetB0
# from tensorflow.keras.preprocessing import image
# from tensorflow.keras.applications.resnet50 import preprocess_input
from sklearn.metrics.pairwise import cosine_similarity

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)
from yolo_model import model


# 参数设置
SIMILARITY_SCORE_THRESHOLD = 0.37
MIN_DETECT_COUNT = 1
GOOD_MATCHES_DIFF = 1.95
MIN_MATCH_COUNT = 1

# 读取类别名称
module_dir = os.path.dirname(__file__)
class_path = os.path.join(module_dir, 'class.txt')
with open(class_path, 'r') as f:
    classNames = f.read().strip().split('\n')

# 创建特征点检测器
# feature_detector = cv2.SIFT_create()
# feature_detector = cv2.ORB_create(nfeatures=10000)

# 加载预训练的 ResNet50 模型（去掉最后的全连接层，以获得高维特征向量）
# ResNet_Model = ResNet50(weights='imagenet', include_top=False, pooling='avg')
# 加载预训练的 EfficientNetB0 模型（去掉最后的全连接层，以获得高维特征向量）
EffNet_Model = EfficientNetB0(weights='imagenet', include_top=False, pooling='avg')


# 读取和预处理图像
# def preprocess_image(img, target_size=(224, 224), rotation_angle=0):
#     """读取和预处理图像"""
#     img = image.img_to_array(img)
#     img = image.array_to_img(img)
#     if rotation_angle != 0:
#         img = img.rotate(rotation_angle, expand=True)  # expand=True 以保持旋转后图像完整
#     img = img.resize(target_size)
#     img_array = image.img_to_array(img)
#     img_array = np.expand_dims(img_array, axis=0)
#     img_array = preprocess_input(img_array)
#     return img_array

# 提取图像的特征向量
# def extract_features(img, rotation_angle=0):
#     """提取图像的特征向量"""
#     img_array = preprocess_image(img, (224, 224), rotation_angle)
#     # features = ResNet_Model.predict(img_array)
#     features = EffNet_Model.predict(img_array)
#     return features.flatten()

# 计算两张图片特征的余弦相似度
def compute_similarity(feature1, feature2):
    """计算两张图片特征的余弦相似度"""
    similarity = cosine_similarity([feature1], [feature2])
    return similarity[0][0]

# 提取深度学习特征
def extract_deep_features(img):
    """提取深度学习特征"""
    img = tf.image.resize(img, (224, 224))
    img = tf.keras.applications.efficientnet.preprocess_input(img)
    img = tf.expand_dims(img, 0)
    features = EffNet_Model.predict(img)
    return features.flatten()


# 目标物品检测器
class ObjectDetector:
    def __init__(self):
        self.templates = []
        # self.templates_features_0 = []    # 0°
        # self.templates_features_1 = []    # 45°
        # self.templates_features_2 = []    # 90°
        # self.templates_features_3 = []    # 135°
        # self.templates_features_4 = []    # 180°
        # self.templates_features_5 = []    # 225°
        # self.templates_features_6 = []    # 270°
        # self.templates_features_7 = []    # 315°
        self.templates_features = []
        
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
        # self.templates_features_0 = []
        # self.templates_features_1 = []
        # self.templates_features_2 = []
        # self.templates_features_3 = []
        # self.templates_features_4 = []
        # self.templates_features_5 = []
        # self.templates_features_6 = []
        # self.templates_features_7 = []
        self.templates_features = []
        for temp in templates:
            result, result_origin = get_target_img(temp)
            if result is not None and result_origin is not None:
                self.templates.append(result)
                # self.templates_features_0.append(extract_features(result_origin, 0))
                # self.templates_features_1.append(extract_features(result_origin, 45))
                # self.templates_features_2.append(extract_features(result_origin, 90))
                # self.templates_features_3.append(extract_features(result_origin, 135))
                # self.templates_features_4.append(extract_features(result_origin, 180))
                # self.templates_features_5.append(extract_features(result_origin, 225))
                # self.templates_features_6.append(extract_features(result_origin, 270))
                # self.templates_features_7.append(extract_features(result_origin, 315))
                deep_features = extract_deep_features(result_origin)
                self.templates_features.append({'deep_features': deep_features})
            else:
                self.templates.append(None)
                break
        
        i = 1
        for template in self.templates:
            if template is None:
                self.templates = []
                # self.templates_features_0 = []
                # self.templates_features_1 = []
                # self.templates_features_2 = []
                # self.templates_features_3 = []
                # self.templates_features_4 = []
                # self.templates_features_5 = []
                # self.templates_features_6 = []
                # self.templates_features_7 = []
                self.templates_features = []
                # print(f'未检测到第 {i} 张图片中的目标物品, 请重新上传目标物品图片')
                return i
            i += 1

        return 0

    # 目标物品检测
    def detect_main(self, img):
        # 获取图像的宽高
        img_height, img_width, _ = img.shape

        # 物体检测
        results = model.predict(img, conf=0.2)

        def compute_object_similarity(roi_origin, template_features):
            """计算相似度"""
            roi_deep_features = extract_deep_features(roi_origin)
            deep_similarity = compute_similarity(template_features['deep_features'], roi_deep_features)
            return deep_similarity

        for result in results:
            if result.masks is not None:
                boxes_ = []
                for mask, box in zip(result.masks.xy, result.boxes):
                    # 排除掉一些不可能的事物
                    cls = int(box.cls[0])
                    if classNames[cls] in ['person', 'tv', 'laptop', 'bench', 'chair', 'couch', 'bed', 'dining table', 'refrigerator', 'toilet', 'book', 'sink', 'microwave', 'oven', 'potted plant', 'traffic light', 'stop sign', 'parking meter']:
                        continue

                    # 获取识别框的位置信息
                    x1, y1, x2, y2 = box.xyxy[0]
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    w, h = x2 - x1, y2 - y1

                    # 物体分割提取
                    # points = np.int32([mask])
                    # mask_ = np.zeros_like(img, dtype=np.uint8)
                    # cv2.fillPoly(mask_, points, 255)

                    # cur_img = img.copy()
                    # outer_color = [0, 0, 0]
                    # cur_img[mask_[..., 0] != 255] = outer_color

                    # roi = cur_img[y1:y2, x1:x2]
                    roi_origin = img[y1:y2, x1:x2]

                    if w * h < 20000:
                        roi_origin = cv2.resize(roi_origin, (0, 0), fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
                        # 使用锐化滤波增强图像清晰度
                        kernel = np.array([[0, -1, 0],
                                           [-1, 5, -1],
                                           [0, -1, 0]])
                        roi_origin = cv2.filter2D(roi_origin, -1, kernel)

                    # similarity_score = 0
                    # roi_features = extract_features(roi_origin, 0)
                    # for template_feature_ in self.templates_features_0:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_1:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_2:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_3:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_4:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_5:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_6:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # for template_feature_ in self.templates_features_7:
                    #     similarity_score_cur = compute_similarity(template_feature_, roi_features)
                    #     if similarity_score_cur > similarity_score:
                    #         similarity_score = similarity_score_cur
                    # print(f'相似度: {similarity_score}')
                    # if similarity_score < SIMILARITY_SCORE_THRESHOLD:
                    #     continue

                    # 计算相似度分数
                    max_similarity = 0
                    for template_features in self.templates_features:
                        similarity = compute_object_similarity(roi_origin, template_features)
                        max_similarity = max(max_similarity, similarity)
                    # print(f'相似度: {max_similarity}')
                    if max_similarity < 0.09:
                        continue

                    # # 放大图像, 去噪处理, 增强对比度
                    # if w * h < 20000:
                    #     # 使用双三次插值放大图像
                    #     roi = cv2.resize(roi, (0, 0), fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
                    #     # 去噪处理
                    #     denoised_image = cv2.fastNlMeansDenoisingColored(roi, None, 10, 10, 7, 21)
                    #     # 增强对比度
                    #     gray_image = cv2.cvtColor(denoised_image, cv2.COLOR_BGR2GRAY)
                    #     roi = cv2.equalizeHist(gray_image)

                    # # 特征点匹配
                    # def get_matches(template, roi):
                    #     kp1, des1 = feature_detector.detectAndCompute(
                    #         template, None)
                    #     kp2, des2 = feature_detector.detectAndCompute(
                    #         roi, None)
                    #     if (des1 is None) or (des2 is None) or len(des2) < 2:
                    #         return None    # 未检测到特征点或特征点数小于2
                    #     if des1.dtype != des2.dtype:
                    #         des1 = des1.astype(np.float32)
                    #         des2 = des2.astype(np.float32)

                    #     bf = cv2.BFMatcher()
                    #     matches_ = bf.knnMatch(des1, des2, k=2)
                    #     return matches_

                    # matches_results = []
                    # with ThreadPoolExecutor(max_workers = len(self.templates)) as executor:
                    #     future_matches = {executor.submit(get_matches, template, roi): idx for idx, template in enumerate(self.templates)}

                    # for future in future_matches.keys():
                    #     matches_ = future.result()
                    #     matches_results.append(matches_)

                    # matches = ()

                    # none_count = 0
                    # for matches_ in matches_results:
                    #     if matches_ == None:
                    #         none_count += 1
                    #     else:
                    #         matches += matches_
                    # detect_num_thres_ = max(len(self.templates) - MIN_DETECT_COUNT, 0)
                    # if none_count > detect_num_thres_:
                    #     continue    # 未检测到足够的匹配点, 跳过该物体

                    # # 筛选匹配结果
                    # good = []
                    # for m_list in matches:
                    #     if len(m_list) == 2:
                    #         m, n = m_list
                    #         if m.distance < GOOD_MATCHES_DIFF * n.distance:
                    #             good.append([m])

                    # if len(good) > MIN_MATCH_COUNT:
                    
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
                    # print(f'x: {x_min}, y: {y_min}, w: {w_min}, h: {h_min} !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

                    left = (x_min + w_min / 2) / img_width
                    top = (y_min + h_min / 2) / img_height

                    # result = [{'x': x_min, 'y': y_min, 'w': w_min, 'h': h_min}]     # 测试用
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
        # self.templates_features_0 = []
        # self.templates_features_1 = []
        # self.templates_features_2 = []
        # self.templates_features_3 = []
        # self.templates_features_4 = []
        # self.templates_features_5 = []
        # self.templates_features_6 = []
        # self.templates_features_7 = []
        self.templates_features = []
        print("[detect.py][detector.release]寻物检测器资源释放完毕")


# 创建目标物品检测器
detector = ObjectDetector()