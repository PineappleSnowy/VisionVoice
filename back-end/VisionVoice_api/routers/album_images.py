from flask import (
    Blueprint,
    jsonify,
    request,
)

import os



from ..app import *
from ..lib import logging

album_images_bp = Blueprint("album_images", __name__)

@app.route("/get_image_des", methods=["POST"])
def get_image_des():
    curr_user = "StarsAC"
    user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user)

    data = request.get_json()
    image_name = data["image_name"]
    image_des_path = os.path.join(
        user_image_folder, "album", "texts", image_name + ".txt"
    )
    if not os.path.exists(image_des_path):
        return jsonify({"success": False, "error": "Image description not found"}), 400
    with open(image_des_path, "r", encoding="utf-8") as f:
        image_des = f.read()
    return jsonify({"success": True, "image_des": image_des}), 200


# 构建上下文信息进行照片对话
@app.route("/album_talk", methods=["POST"])
def album_talk():
    curr_user = "StarsAC"
    data = request.get_json()
    album_chat_history = data["album_chat_history"]
    image_name = data["image_name"]
    user_album_img_path = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "album", "images", image_name + ".jpg"
    )
    with open(user_album_img_path, "rb") as img_file:
        img_base = base64.b64encode(img_file.read()).decode("utf-8")

    prompt = "你是一名乐于助人的助手，请你充分捕捉照片信息，用生动的语言向你的盲人朋友描述这张照片。"

    if curr_user == "CaraLin":
        prompt_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "caralin_prompt.txt"
        )
        if os.path.exists(prompt_path):
            with open(prompt_path, "r", encoding="utf-8") as f:
                prompt = f.read()

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": img_base}},
            ],
        }
    ]
    for chat in album_chat_history:
        if chat["role"] == "assistant":
            message = {
                "role": "assistant",
                "content": [{"type": "text", "text": chat["text"]}],
            }
            messages.append(message)
        elif chat["role"] == "user":
            message = {
                "role": "user",
                "content": [{"type": "text", "text": chat["text"]}],
            }
            messages.append(message)

    model_name = "glm-4v-plus-0111"
    responses = CLIENT.chat.completions.create(
        model=model_name,
        messages=messages,
        stream=True,
    )

    def generate_response():
        for response in responses:
            finish_reason = response.choices[0].finish_reason
            text = response.choices[0].delta.content
            # 当用户输入的内容违规时输出"我听不懂你在说什么"
            if finish_reason == "sensitive":
                text = "我听不懂你在说什么\n"
            yield text

    generate = generate_response()
    return app.response_class(
        stream_with_context(generate), mimetype="text/event-stream"
    )


@app.route("/save_album_images", methods=["POST"])
def save_album_images():
    curr_user = "StarsAC"
    user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user)

    if "files" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    files = request.files.getlist("files")
    if not files:
        return jsonify({"success": False, "error": "No selected files"}), 400

    talk_speed = request.args.get("talk_speed", 8)

    talk_speed_config_path = os.path.join(
        user_image_folder, "album", "talk_speed_config.json"
    )
    with open(talk_speed_config_path, "r") as f:  # 读取语速配置
        talk_speed_config = json.load(f)

    saved_images = []  # 保存成功的图片

    for file in files:
        filename = file.filename
        if filename:
            try:
                image_filename = filename + ".jpg"
                image_folder = os.path.join(user_image_folder, "album", "images")
                image_save_path = os.path.join(image_folder, image_filename)
                file.save(image_save_path)
                saved_images.append(
                    {
                        "name": filename,
                        "url": f"/image/{curr_user}/{image_filename}?mode=album",
                    }
                )

                image_des = describe_image(CLIENT, image_save_path, curr_user)
                des_audio, _ = agent_audio_generate(image_des, talk_speed)

                audio_file_name = filename + ".mp3"
                audio_folder = os.path.join(user_image_folder, "album", "audios")
                audio_file_path = os.path.join(audio_folder, audio_file_name)
                if not os.path.exists(audio_folder):
                    os.makedirs(audio_folder)
                with open(audio_file_path, "wb") as f:
                    f.write(des_audio)

                # 保存语速配置
                talk_speed_config[filename] = talk_speed
                with open(talk_speed_config_path, "w") as f:
                    json.dump(talk_speed_config, f)

                # 保存语速配置
                talk_speed_config[filename] = talk_speed
                with open(talk_speed_config_path, "w") as f:
                    json.dump(talk_speed_config, f)

                text_file_name = filename + ".txt"
                text_folder = os.path.join(user_image_folder, "album", "texts")
                text_file_path = os.path.join(text_folder, text_file_name)
                if not os.path.exists(text_folder):
                    os.makedirs(text_folder)
                with open(text_file_path, "w", encoding="utf-8") as f:
                    f.write(image_des)

                socketio.emit("image_talk_finished", {"image_name": filename})
            except Exception as e:
                return jsonify({"success": False, "error": "图片解析失败！"}), 400

    if saved_images:
        return jsonify({"success": True, "images": saved_images}), 200
    else:
        return jsonify({"success": False, "error": "No images saved"}), 400
