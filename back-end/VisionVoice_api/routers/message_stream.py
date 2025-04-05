from flask import (
    Blueprint,
    jsonify,
    request,
    stream_with_context
)
import cv2
import random

from ..app import *
from ..lib import logging
from ..lib.utils import *
from chat_history import save_chat_history
from ..lib.agent_speech_rec import speech_rec
from ..lib.agent_speech_synthesis import agent_audio_generate
from ..lib.obstacle_avoid.detect import obstacle_avoid_realize
from ..lib.vision_seek.detect import detector
message_stream_bp = Blueprint("message_stream", __name__)


@message_stream_bp.route("/messageStream", methods=["GET"])
def get_message_stream():
    """
    大模型前端流式输出路由
    """
    user_talk = request.args.get("query", "（消息为空，发生了错误，请你给出错误警告）")
    agent_name = request.args.get("agent", "defaultAgent")  # 获取选择的智能体
    video_open = request.args.get("videoOpen", "false") == "true"  # 是否进行图片对话
    multi_image_talk = (
        request.args.get("multi_image_talk", "false") == "true"
    )  # 是否开启多轮对话
    current_user = "StarsAC"

    try:
        responses, messages = build_response(
            current_user, agent_name, user_talk, video_open, multi_image_talk
        )
        generate = predict(current_user, agent_name, messages, responses)
        return app.response_class(
            stream_with_context(generate), mimetype="text/event-stream"
        )
    except Exception as e:
        print("[run.py][agent_chat_stream] error:", str(e))
        generate = error_generator("发生错误，请重试。")
        return app.response_class(
            stream_with_context(generate), mimetype="text/event-stream"
        )


def predict(current_user, agent_name, messages, responses):
    """
    生成器函数，用于大模型流式输出
    """
    response_all = ""

    # 大模型流式输出
    for response in responses:
        finish_reason = response.choices[0].finish_reason
        text = response.choices[0].delta.content
        # 当用户输入的内容违规时输出"我听不懂你在说什么"
        if finish_reason == "sensitive":
            text = "我听不懂你在说什么\n"
        response_all += text
        yield text
    messages.append({"role": "assistant", "content": response_all})
    print("[run.py][predict] response_all:", response_all)
    save_chat_history(current_user, agent_name, messages)

    # 结束标志，用于判断大模型说话结束，后续语音合成需要该标志
    yield "<END>"


@app.route("/agent/upload_image", methods=["POST"])
def upload_image():
    """
    接收前端发来的图片的路由
    """
    try:
        data = request.get_json()
        if "image" not in data or not data["image"]:
            return jsonify({"message": "No image data in the request"}), 400

        image_data = data["image"]
        current_user = "StarsAC"
        user_cache_dir = os.path.join(".cache", current_user)
        if not os.path.exists(user_cache_dir):
            os.makedirs(user_cache_dir)

        # 去掉base64前缀
        image_data = image_data.split(",")[1]

        # 获取当前是否是多图片对话
        if "multi_image_index" in data:
            multi_image_dir = os.path.join(user_cache_dir, MULTI_IMAGE_DIRECTORY)
            if not os.path.exists(multi_image_dir):
                os.makedirs(multi_image_dir)
            print(data["multi_image_index"])
            if data["multi_image_index"] == 0:
                # 清空历史图片
                delete_file_from_dir(multi_image_dir)
            # 以8位随机数加上图片序号作为文件名，图片序号使大模型能知道图片次序
            image_save_path = os.path.join(
                multi_image_dir,
                f'{data["multi_image_index"]}{random.randint(10000000, 99999999)}.jpg',
            )
        else:
            image_save_path = os.path.join(user_cache_dir, IMAGE_SAVE_NAME)

        # 将图片保存为文件
        with open(image_save_path, "wb") as f:
            f.write(base64.b64decode(image_data))
        with open(image_save_path, "rb") as img_file:
            img_base = base64.b64encode(img_file.read()).decode("utf-8")
            if not img_base:
                return {"message": "Image url is empty"}, 400

        if "state" in data:
            state = data["state"]
        else:
            return {"message": "Image upload success"}

        try:
            mat_image = cv2.imread(image_save_path)
        except Exception:
            return jsonify({"message": "Image is empty"}), 400

        if state == 1:
            try:
                obstacle_info = obstacle_avoid_realize(mat_image)
                print("[run.py][upload_image] obstacle_info:", obstacle_info)
                return (
                    jsonify({"message": "Success", "obstacle_info": obstacle_info}),
                    200,
                )
            except Exception as e:
                print("[run.py][upload_image] error:", e)
                return jsonify({"message": "Error", "obstacle_info": []}), 400

        elif state == 2:
            try:
                detect_result = detector.detect_main(mat_image)
                item_info = [] if detect_result == -1 else detect_result
                print("[run.py][upload_image] item_info:", item_info)
                return jsonify({"message": "Success", "item_info": item_info}), 200
            except Exception as e:
                print("[run.py][upload_image] error:", e)
                return jsonify({"message": "Error", "item_info": []}), 400

        return jsonify({"message": "Success"}), 200
    except Exception:
        return jsonify({"message": "Error"}), 400



@message_stream_bp.get("/gaode_api")
def gaode_api():
    """返回高德 API 相关信息"""
    gaode_info = api_data.get("gaode", {})
    return jsonify(gaode_info)
