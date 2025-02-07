import os, time, cv2
import cvzone
from detect import detector

# 打开相机
cap = cv2.VideoCapture(0)

# 获取初始目标物品图
module_dir = os.path.dirname(__file__)
pic_path_1 = os.path.join(module_dir, 'templates/template7.jpg')
# pic_path_2 = os.path.join(module_dir, 'templates/template2.jpg')
# pic_path_3 = os.path.join(module_dir, 'templates/template3.jpg')
# pic_path_4 = os.path.join(module_dir, 'templates/template4.jpg')
# pic_path_5 = os.path.join(module_dir, 'templates/template5.jpg')
temp_1 = cv2.imread(pic_path_1, 1)
# temp_2 = cv2.imread(pic_path_2, 1)
# temp_3 = cv2.imread(pic_path_3, 1)
# temp_4 = cv2.imread(pic_path_4, 1)
# temp_5 = cv2.imread(pic_path_5, 1)

# 用于计算帧率
prev_frame_time = 0
new_frame_time = 0

# 提取出目标物品的分割图像
init_state = detector.detect_init(temp_1)
if init_state != 0:
    print(f'未检测到第 {init_state} 张图片中的目标物品, 请重新上传目标物品图片')
    print('初始化失败')
    exit()

while True:
    new_frame_time = time.time()

    ret, frame = cap.read()
    result_list = detector.detect_main(frame)
    if result_list != []:
        result = result_list[0]
        x = result['x']
        y = result['y']
        w = result['w']
        h = result['h']
        cvzone.cornerRect(frame, (x, y, w, h))
        # cvzone.putTextRect(frame, f'{classNames[cls]} {conf}', (max(0, x1), max(35, y1)), scale=1, thickness=1)
    else:
        print('未检测到该物品!')

    cv2.imshow('Img', cv2.flip(frame, 1))

    fps = 1 / (new_frame_time - prev_frame_time)
    prev_frame_time = new_frame_time
    print(fps)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        cv2.destroyAllWindows()
        cap.release()
        detector.release()
        break