import cv2
import cvzone
import time
from detect import detector

# 打开相机
cap = cv2.VideoCapture(0)

# 获取初始目标物品图像
temp_1 = cv2.imread('agent_files/vision_seek/template.jpg', 1)
temp_2 = cv2.imread('agent_files/vision_seek/template2.jpg', 1)
temp_3 = cv2.imread('agent_files/vision_seek/template3.jpg', 1)
temp_4 = cv2.imread('agent_files/vision_seek/template4.jpg', 1)
temp_5 = cv2.imread('agent_files/vision_seek/template5.jpg', 1)

# 用于计算帧率
prev_frame_time = 0
new_frame_time = 0

# 提取出目标物品的分割图像
init_state = detector.detect_init(temp_1, temp_2, temp_3, temp_4, temp_5)
if init_state == -1:
    print('初始化失败')
    exit()

while True:
    new_frame_time = time.time()

    ret, frame = cap.read()
    result = detector.detect_main(frame)
    if result != -1:
        x = result['x']
        y = result['y']
        w = result['w']
        h = result['h']
        cvzone.cornerRect(frame, (x, y, w, h))
        # cvzone.putTextRect(frame, f'{classNames[cls]} {conf}', (max(0, x1), max(35, y1)), scale=1, thickness=1)

    cv2.imshow('Img', cv2.flip(frame, 1))

    fps = 1 / (new_frame_time - prev_frame_time)
    prev_frame_time = new_frame_time
    print(fps)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        cv2.destroyAllWindows()
        cap.release()
        detector.release()
        break