"""
该文件的主要模块是视界之声智能体
"""

# 第三方库
import random
import cv2
import time
import os
from flask import (
    Flask,
    send_file,
    send_from_directory,
    stream_with_context,
    render_template,
    request,
    jsonify,
    redirect,
    session,
)
from flask_socketio import SocketIO
from flask_cors import CORS
import numpy as np
import samplerate
import json
import platform
from zhipuai import ZhipuAI
from flask_jwt_extended import (
    create_access_token,
    verify_jwt_in_request,
    get_jwt_identity,
    JWTManager,
)
import base64

# 自定义工具
from agent_files.agent_speech_rec import speech_rec
from agent_files.agent_speech_synthesis import agent_audio_generate
from lib import logging
from agent_files.async_task_queue import AsyncTaskQueue
from agent_files.obstacle_avoid.detect import obstacle_avoid_realize
from agent_files.vision_seek.detect import detector
from service.sms.sms import send_verification_code, verify_code, store_verification_code

# ----- 加载全局应用 -----
app = Flask(__name__)
app.secret_key = "s96cae35ce8a9b0244178bf28e4966c2ce1b83"
socketio = SocketIO(
    app, async_mode="threading", ping_timeout=600, ping_interval=300
)  # 设置较大的 pingTimeout 和 pingInterval
JWTManager(app)
CORS(app)
# 设置 JWT 密钥
app.config["JWT_SECRET_KEY"] = "s96cae35ce8a9b0244178bf28e4966c2ce1b83"


"""user_var 保存用户变量的字典，字典格式为:
{"<username>": {
"is_streaming": false, 
"sentence_buffer": "", 
"sentence_index": 0, 
"task_queue": AsyncTaskQueue()}
}
"""
USER_VAR = dict()

# 处理user.json不存在的情况
if not os.path.exists("./static/user.json"):
    with open("./static/user.json", "w") as f:
        f.write("[]")

# 处理user_images目录不存在的情况
if not os.path.exists("./user_images"):
    os.mkdir("./user_images")

# ----- 路由 -----

# 使用 verify_jwt_in_request 进行 JWT 验证


@app.before_request
def before_request():
    # 排除 GET 请求的 JWT 验证
    if (
        request.path == "/agent/chat_stream"
        or request.path == "/agent/upload_audio"
        or request.path == "/agent/upload_image"
        or request.path == "/rename_image"
        or request.path == "/save_item_image"
        or request.path == "/delete_image"
        or request.path == "/images"
        or request.path == "/save_album_images"
        or request.path == "/get_audio"
        or request.path == "/get_image_des"
        or request.path == "/album_talk"
        or request.path == "/delete-chat-history"
    ):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return (
                jsonify(
                    {"message": "Token has expired!",
                        "code": 401, "error": str(e)}
                ),
                401,
            )

    # 允许访问的静态资源路径
    allowed_paths = [
        "/static/css",
        "/static/js",
        "/static/images",
        "/image",
        "/static/favicon.ico",
        "/static/manifest.json",
        "/static/models",
        "/static/service-worker.js",
    ]

    # 获取所有已注册的路由
    registered_routes = [rule.rule for rule in app.url_map.iter_rules()]

    # 检查请求路径是否在允许的静态资源路径或已注册的路由中
    if (
        not any(request.path.startswith(path) for path in allowed_paths)
        and request.path not in registered_routes
    ):
        return jsonify({"message": "Forbidden", "code": 403}), 403


# 断开连接时删除用户变量
@socketio.on("disconnect")
def handle_disconnect():
    token = request.args.get("token")
    if token:
        request.headers = {"Authorization": f"Bearer {token}"}
        try:
            verify_jwt_in_request()
            user = get_jwt_identity()
            print(f"[run.py][handle_disconnect] User {user} disconnected")
            # 偶尔会发生客户端连接超时导致user被意外删除
            # try:
            #     del USER_VAR[user]
            #     print(
            #         f"[run.py][handle_disconnect] Remove user {user} varieties")
            # except Exception as e:
            #     print(
            #         f"[run.py][handle_disconnect] Fail to remove user {user} varieties: {e}")
        except Exception as e:
            print(f"[run.py][handle_disconnect] JWT verification failed: {e}")
    else:
        print("[run.py][handle_disconnect] Missing token")


@app.route("/", methods=["GET"])
def index():
    cookie_value = request.cookies.get("token")
    username = request.cookies.get("username")
    nickname = request.cookies.get("nickname")

    if cookie_value:
        logging.success(
            "index",
            "index",
            f"[run.py][index] cookie: {cookie_value[:5]}...{cookie_value[-5:]}",
        )
        # logging.success("index", "index", f"[run.py][index] username: {username[:5]}...{username[-5:]}")
        # logging.success("index", "index", f"[run.py][index] nickname: {nickname[:5]}...{nickname[-5:]}")
    else:
        logging.error("run.py", "index", "cookie_value is None")
    return render_template("index.html")


@app.route("/agent", methods=["GET"])
def agent():
    """智能体根路由"""
    return render_template("agent.html")


@app.route("/chat", methods=["GET"])
def chat():
    """消息路由"""
    return render_template("chat.html")


@app.route("/phone", methods=["GET"])
def phone():
    """消息路由"""
    return render_template("phone.html")


@app.route("/album", methods=["GET"])
def album():
    """相册路由"""
    return render_template("album.html")


@app.route("/skills", methods=["GET"])
def skills():
    """广场路由"""
    return render_template("skills.html")


@app.route("/mine", methods=["GET"])
def mine():
    """我的路由"""
    return render_template("mine.html")


@app.route("/logout", methods=["GET"])
def logout():
    session.clear()
    return redirect("/login")


"""寻物画廊路由"""

# 设置图片文件夹路径
USER_IMAGE_FOLDER = "./user_images/"


@app.route("/photo_manage", methods=["GET"])
def photo_manage():
    """画廊路由"""
    return render_template("photo_manage.html")


@app.route("/contact", methods=["GET"])
def contact():
    """联系我们路由"""
    return render_template("contact.html")


@app.route("/user_agreement", methods=["GET"])
def user_agreement():
    """用户须知路由"""
    return render_template("user_agreement.html")


@app.route("/get_user_agreement_text")
def get_user_agreement_text():
    file_path = "./configs/user_announcement.txt"
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content.replace("\n", "<br>")
    except FileNotFoundError:
        return "File not found", 404


@app.route("/settings", methods=["GET"])
def settings():
    """用户须知路由"""
    return render_template("settings.html")


@app.route("/images", methods=["GET"])
def get_images():
    images = []
    curr_user = get_jwt_identity()
    user_image_folder = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "item_images")
    user_album_folder = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "album", "images")

    if not os.path.exists(user_image_folder):
        os.makedirs(user_image_folder)
    if not os.path.exists(user_album_folder):
        os.makedirs(user_album_folder)

    mode = request.args.get("mode", "find_item")

    if mode == "album":
        target_folder = user_album_folder

        talk_speed_config_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "talk_speed_config.json"
        )

        if not os.path.exists(talk_speed_config_path):  # 初始化语速配置文件
            with open(talk_speed_config_path, "w") as f:
                album_images = os.listdir(
                    os.path.join(USER_IMAGE_FOLDER,
                                 curr_user, "album", "images")
                )
                album_images_withot_ext = [
                    os.path.splitext(image)[0] for image in album_images
                ]
                talk_speed_config = {
                    image: 8 for image in album_images_withot_ext}
                json.dump(talk_speed_config, f)
    else:
        target_folder = user_image_folder

    # 获取文件列表并按文件名逆序排序
    file_list = sorted(os.listdir(target_folder), reverse=True)

    for filename in file_list:
        if filename.endswith((".jpg")):
            name, ext = os.path.splitext(filename)
            images.append(
                {
                    "name": name,
                    "url": f"/image/{curr_user}/{filename}?mode={mode}",
                    "finish_des": os.path.exists(
                        os.path.join(
                            USER_IMAGE_FOLDER,
                            curr_user,
                            "album",
                            "audios",
                            name + ".mp3",
                        )
                    ),
                }
            )

    return jsonify(images)


@app.route("/image/<user>/<filename>", methods=["GET"])
def get_image(user, filename):
    mode = request.args.get("mode", "find_item")
    if mode == "album":
        user_image_folder = os.path.join(
            USER_IMAGE_FOLDER, user, "album", "images")
    else:
        user_image_folder = os.path.join(
            USER_IMAGE_FOLDER, user, "item_images")
    return send_from_directory(user_image_folder, filename)


@app.route("/rename_image", methods=["POST"])
def rename_image():
    curr_user = get_jwt_identity()
    user_image_folder = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "item_images")

    data = request.get_json()
    old_name = data["oldName"]
    new_name = data["newName"]

    # 查找旧文件名对应的文件
    old_file = None
    for filename in os.listdir(user_image_folder):
        name, ext = os.path.splitext(filename)
        if name == old_name:
            old_file = filename
            break

    if old_file is None:
        print(f"Old file not found: {old_name}")
        return jsonify({"success": False, "error": "Old file not found"}), 400

    old_path = os.path.join(user_image_folder, old_file)
    new_file = new_name + os.path.splitext(old_file)[1]
    new_path = os.path.join(user_image_folder, new_file)

    try:
        os.rename(old_path, new_path)
        return jsonify({"success": True, "url": f"/image/{curr_user}/{new_file}"}), 200
    except Exception as e:
        print(f"Rename failed: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 400


def gen_time_random_name():
    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    random_number = random.randint(100000, 999999)
    return f"{timestamp}{random_number}"


@app.route("/save_item_image", methods=["POST"])
def save_item_image():
    curr_user = get_jwt_identity()
    user_image_folder = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "item_images")

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    file = request.files["file"]
    filename = file.filename
    if filename == "":
        return jsonify({"success": False, "error": "No selected file"}), 400
    if file:
        name, ext = os.path.splitext(filename)
        new_filename = name + ".jpg"
        if os.path.exists(os.path.join(user_image_folder, new_filename)):
            return jsonify({"success": False, "error": "该图片已存在！"}), 400
        try:
            file.save(os.path.join(user_image_folder, new_filename))
        except Exception as e:
            return jsonify({"success": False, "error": "图片保存失败！"}), 400
        return (
            jsonify(
                {
                    "success": True,
                    "image_name": name,
                    "image_url": f"/image/{curr_user}/{new_filename}?mode=find_item",
                }
            ),
            200,
        )
    return jsonify({"success": False, "error": "File upload failed"}), 400


def describe_image(client, img_path, curr_user):
    with open(img_path, "rb") as img_file:
        img_base = base64.b64encode(img_file.read()).decode("utf-8")

    prompt = "你是一名乐于助人的盲人助手，请你充分捕捉照片信息，用生动的语言向你的盲人朋友描述这张照片。"

    if curr_user == "CaraLin":
        prompt_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "caralin_prompt.txt"
        )
        if os.path.exists(prompt_path):
            with open(prompt_path, "r", encoding="utf-8") as f:
                prompt = f.read()

    response = client.chat.completions.create(
        model="glm-4v-plus-0111",  # 填写需要调用的模型名称
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": img_base}},
                ],
            }
        ],
    )
    return response.choices[0].message.content


@app.route("/save_album_images", methods=["POST"])
def save_album_images():
    curr_user = get_jwt_identity()
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
                image_folder = os.path.join(
                    user_image_folder, "album", "images")
                image_save_path = os.path.join(image_folder, image_filename)
                file.save(image_save_path)
                saved_images.append(
                    {
                        "name": filename,
                        "url": f"/image/{curr_user}/{image_filename}?mode=album",
                    }
                )

                image_des = describe_image(client, image_save_path, curr_user)
                des_audio, _ = agent_audio_generate(image_des, talk_speed)

                audio_file_name = filename + ".mp3"
                audio_folder = os.path.join(
                    user_image_folder, "album", "audios")
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


@app.route("/get_image_des", methods=["POST"])
def get_image_des():
    curr_user = get_jwt_identity()
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


@app.route("/get_audio", methods=["GET"])
def get_audio():
    curr_user = get_jwt_identity()
    # 有声相册音频路由
    audio_name = request.args.get("audio_name")
    audio_file = audio_name + ".mp3"
    audio_path = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "album", "audios", audio_file
    )
    if not os.path.exists(audio_path):
        return jsonify({"error": "Audio file not found"}), 404

    talk_speed = request.args.get("talk_speed", 8)
    talk_speed_config_path = os.path.join(
        USER_IMAGE_FOLDER, curr_user, "album", "talk_speed_config.json"
    )

    with open(talk_speed_config_path, "r") as f:
        talk_speed_config = json.load(f)
        talk_speed_pre = talk_speed_config.get(audio_name, 8)
    if talk_speed != talk_speed_pre:  # 当前请求的语速与之前不同，重新生成音频
        image_des_text_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "texts", audio_name + ".txt"
        )
        with open(image_des_text_path, "r", encoding="utf-8") as f:
            image_des = f.read()
        audio_data, _ = agent_audio_generate(image_des, talk_speed)
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        talk_speed_config[audio_name] = talk_speed
        with open(talk_speed_config_path, "w") as f:
            json.dump(talk_speed_config, f)

    return send_file(audio_path, mimetype="audio/mp3")


# 构建上下文信息进行照片对话
@app.route("/album_talk", methods=["POST"])
def album_talk():
    curr_user = get_jwt_identity()
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
    responses = client.chat.completions.create(
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


@app.route("/delete_image", methods=["POST"])
def delete_image():
    curr_user = get_jwt_identity()
    mode = request.args.get("mode", "find_item")
    data = request.get_json()
    image_name = data["image_name"]
    # 查找文件名对应的文件
    file_to_delete = None
    if mode == "album":
        talk_speed_config_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "talk_speed_config.json"
        )
        with open(talk_speed_config_path, "r") as f:
            talk_speed_config = json.load(f)
        if image_name in talk_speed_config:
            del talk_speed_config[image_name]
            with open(talk_speed_config_path, "w") as f:
                json.dump(talk_speed_config, f)
        delete_folders = ["album/images", "album/audios", "album/texts"]
    else:
        delete_folders = ["item_images"]
    for folder in delete_folders:
        user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user, folder)
        for filename in os.listdir(user_image_folder):
            name_without_ext, ext = os.path.splitext(filename)
            if name_without_ext == image_name:
                file_to_delete = filename
                file_path = os.path.join(user_image_folder, file_to_delete)
                try:
                    os.remove(file_path)
                    break
                except Exception as e:
                    return jsonify({"success": False, "error": str(e)}), 400
    if file_to_delete is None:
        return jsonify({"success": False, "error": "File not found"}), 400
    return (
        jsonify(
            {"success": True, "url": f"/image/{curr_user}/{file_to_delete}?mode={mode}"}
        ),
        200,
    )


# ----- 加载全局变量 -----
# 加载 api_key
module_dir = os.path.dirname(__file__)
json_path = os.path.join(module_dir, "static", "api.json")
with open(json_path, "r", encoding="utf-8") as f:
    api_data = json.load(f)
    api_key_zhipu = api_data["zhipu"]["api_key"]
    client = ZhipuAI(api_key=api_key_zhipu)


# 聊天记录最大长度
MAX_HISTORY = 10  # 较多的聊天记录长度会导致较多的token消耗


# ----- 预定义函数 -----


def save_chat_history(current_user, agent_name, messages):
    # 对聊天记录进行编码
    encoded_messages = [encode_message_content(msg.copy()) for msg in messages]

    # 更新用户聊天记录
    user_path = os.path.join(module_dir, "static", "user.json")
    with open(user_path, "r+", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                user["agents"][agent_name]["chat_history"] = encoded_messages
                break
        f.seek(0)
        json.dump(users, f, indent=4, ensure_ascii=False)
        f.truncate()


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


def change_sample_rate(input_file, target_sample_rate, ori_sample_rate):
    """
    修改采样率函数

    Args:
        input_file {str} 输入文件路径
        target_sample_rate {int} 目标采样率
        ori_sample_rate {int} 原始采样率

    Returns:
        resampled_audio_data {bytes} 修改后的音频数据
    """
    ratio = target_sample_rate / ori_sample_rate
    converter = "sinc_best"  # or 'sinc_fastest', ...
    with open(input_file, "rb") as speech_file:
        audio_data = speech_file.read()
        audio_data = np.frombuffer(audio_data, dtype=np.int16)

    resampled_audio_data = samplerate.resample(audio_data, ratio, converter)

    return resampled_audio_data.astype(np.int16).tobytes()


def find_pause(sentence: str) -> int:
    """
    寻找话语停顿函数，返回最后一次断句位置

    Args:
        sentence {str} 一句话

    Example:
        sentence = "你好，我是小明。今天天气真好！"
        rfind 会找到：
        "，" 的位置是 2
        "。" 的位置是 7
        "！" 的位置是 14
        未找到时返回 -1
        最终返回 14，即最后的感叹号位置

    Returns:
        pause_index {int} 最后一次断句位置
    """

    # 断句的目标符号
    target_symbols = [
        "。",
        "！",
        "：",
        "？",
        "，",
        "；",  # 全角符号
        ".", "!", ":", "?", ",", ";",  # 半角符号
    ]

    # 记录目标符号的位置
    index_list = []

    for symbol in target_symbols:
        index = sentence.rfind(symbol)
        index_list.append(index)
    pause_index = max(index_list)
    return pause_index


def encode_message_content(message):
    """对消息内容进行 Base64 编码"""
    if isinstance(message, dict) and "content" in message:
        content = message["content"]
        encoded_content = base64.b64encode(
            content.encode("utf-8")).decode("utf-8")
        message["content"] = encoded_content
    return message


def decode_message_content(message):
    """对消息内容进行 Base64 解码"""
    if isinstance(message, dict) and "content" in message:
        encoded_content = message["content"]
        try:
            decoded_content = base64.b64decode(encoded_content).decode("utf-8")
            message["content"] = decoded_content
        except:
            pass  # 如果解码失败则保持原样
    return message


# ----- 处理前端请求的路由 -----
@app.post("/register")
def register():
    """注册路由"""
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    nickname = data.get("nickname")
    phone = data.get("phone")
    code = data.get("code")
    usage = data.get("usage")

    print(
        "注册信息：\n用户名：{}\n密码：{}\n昵称：{}\n手机号：{}".format(
            username, password, nickname, phone
        )
    )

    if len(username) < 3:
        return (
            jsonify({"message": "用户名长度至少3位", "code": 400}),
            400,
        )

    if len(phone) != 11:
        return (
            jsonify({"message": "手机号长度为11位", "code": 400}),
            400,
        )

    try:
        # 读取现有用户
        try:
            with open("./static/user.json", "r+", encoding="utf-8") as f:
                users = json.load(f)
        except Exception as e:
            logging.error("run.py", "register", f"用户文件读取失败: {str(e)}")
            users = []

        # 检查用户名是否存在
        if any(user.get("username") == username for user in users):
            return jsonify({"message": "用户名已存在", "code": 400}), 400

        # 检查手机号是否存在
        if any(user.get("phone") == phone for user in users):
            return jsonify({"message": "手机号已存在", "code": 400}), 400

        # 检查验证码是否正确
        try:
            with open("./configs/verification_code_dict.json", "r") as f:
                verification_code_dict = json.load(f)
        except Exception as e:
            logging.error("run.py", "register", f"验证码文件读取失败: {str(e)}")
            verification_code_dict = {}

        # 级联判断验证码是否匹配
        phone_number = verification_code_dict.get(phone)
        if not phone_number:
            return jsonify({"message": "发送验证码失败", "code": 400}), 400

        timestamp = phone_number.get("timestamp")
        if not timestamp:
            return jsonify({"message": "发送验证码失败", "code": 400}), 400

        if int(timestamp) + 5 * 60 < int(time.time()):
            return jsonify({"message": "验证码已过期", "code": 400}), 400

        verify_code = phone_number.get("code")
        if verify_code != code:
            return jsonify({"message": "验证码错误", "code": 400}), 400

        # 注册完后向用户信息中添加预设智能体，此处可以后续智能体定制兼容
        sys_prompt = "你是视界之声，一位乐于助人的对话助手。为了能让用户能尽快解决问题，你的话语总是十分简洁而概要。"

        background_info = "嗨，亲爱的朋友，我是小天，很高兴能和你在这心灵的角落相遇。不管你眼前的世界是怎样的，我都在这儿陪着你，准备好和你一起聊聊内心的喜怒哀乐啦。"
        users.append(
            {
                "username": username,
                "password": password,
                "nickname": nickname,
                "phone": phone,
                "agents": {
                    "defaultAgent": {
                        "chat_history": [
                            {"role": "system", "content": sys_prompt},
                            {
                                "role": "assistant",
                                "content": "我是视界之声，你的生活助手，有什么我可以帮你的么？",
                            },
                        ]
                    },
                    "psychologicalAgent": {
                        "chat_history": [
                            {"role": "assistant", "content": background_info}
                        ]
                    },
                },
            }
        )

        print("用户注册成功：\n用户名：{}\n密码：{}".format(username, password))

        # 写回文件
        with open("./static/user.json", "w", encoding="utf-8") as f:
            json.dump(users, f, indent=4, ensure_ascii=False)

        # 注册成功后直接生成 token
        access_token = create_access_token(
            identity=username, expires_delta=False)
        session["username"] = username
        session["nickname"] = nickname

        return (
            jsonify({"message": "注册成功", "code": 200,
                    "access_token": access_token}),
            200,
        )

    except Exception as e:
        return jsonify({"message": f"注册失败: {str(e)}", "code": 500}), 500


@app.post("/login")
def login():
    """登录路由"""
    # 获取前端传来的用户名和密码
    data = request.get_json()
    login_type = data.get("login_type")
    phone = data.get("phone")
    code = data.get("code")
    username = data.get("username")
    password = data.get("password")
    usage = data.get("usage")

    try:
        # 读取用户信息
        try:
            with open("./static/user.json", "r", encoding="utf-8") as f:
                users = json.load(f)
        except Exception as e:
            logging.error("run.py", "login", f"用户文件读取失败: {str(e)}")
            users = []

        # 检查用户是否存在
        user_exists = False
        for user in users:
            if (
                user.get("username") == username
                and login_type == "password"
                and usage == "login"
            ):
                user_exists = True
                # 检查密码是否正确
                if user.get("password") == password:

                    print("登录成功")
                    # 设置 local token
                    access_token = create_access_token(
                        identity=username, expires_delta=False
                    )
                    return (
                        jsonify(
                            {
                                "message": "登录成功",
                                "code": 200,
                                "access_token": access_token,
                                "user_info": {
                                    "username": username,
                                    "nickname": user.get("nickname"),
                                    "phone": user.get("phone"),
                                },
                            }
                        ),
                        200,
                    )
                else:
                    return jsonify({"message": "密码错误", "code": 400}), 400

            elif (
                user.get("phone") == phone
                and login_type == "phone"
                and usage == "login"
            ):
                user_exists = True
                try:
                    with open("./configs/verification_code_dict.json", "r") as f:
                        verification_code_dict = json.load(f)
                except Exception as e:
                    logging.error("run.py", "login", f"验证码文件读取失败: {str(e)}")
                    verification_code_dict = {}

                # 级联判断验证码是否匹配
                phone_number = verification_code_dict.get(phone)
                if not phone_number:
                    return jsonify({"message": "发送验证码失败", "code": 400}), 400

                timestamp = phone_number.get("timestamp")
                if not timestamp:
                    return jsonify({"message": "发送验证码失败", "code": 400}), 400

                if int(timestamp) + 5 * 60 < int(time.time()):
                    return jsonify({"message": "验证码已过期", "code": 400}), 400

                verify_code = phone_number.get("code")
                if int(verify_code) != int(code):
                    return jsonify({"message": "验证码错误", "code": 400}), 400

                print("登录成功")

                # 设置 local token
                access_token = create_access_token(
                    identity=user.get("username"), expires_delta=False
                )
                return (
                    jsonify(
                        {
                            "message": "登录成功",
                            "code": 200,
                            "access_token": access_token,
                            "user_info": {
                                "username": user.get("username"),
                                "nickname": user.get("nickname"),
                                "phone": phone,
                            },
                        }
                    ),
                    200,
                )

        if not user_exists:
            return jsonify({"message": "用户不存在", "code": 400}), 400
        else:
            return jsonify({"message": "出错啦，请联系工作人员", "code": 400}), 400

    except Exception as e:
        logging.error("run.py", "login", f"登录失败: {str(e)}")
        return jsonify({"message": f"出错了，请联系工作人员！", "code": 500}), 500


@app.route("/verify-token", methods=["POST"])
def verify_token():
    """
    验证登录用户的 token 是否有效
    """
    try:
        # 获取请求头中的 token
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else None

        # 验证 token 是否有效
        verify_jwt_in_request()
        # 获取当前 token 对应的用户
        current_user = get_jwt_identity()

        if current_user != "" and token != None:
            logging.success(
                "run.py",
                "verify_token",
                f"token 有效，当前用户：{current_user}，token：{token[:5]}...{token[-5:]}",
            )

        # 初始化用户变量
        USER_VAR[current_user] = dict()
        USER_VAR[current_user]["is_streaming"] = False  # 标记是否正在处理流式响应
        USER_VAR[current_user]["sentence_buffer"] = ""  # 用于累积 token 的缓冲区
        USER_VAR[current_user]["sentence_index"] = 0  # 用于标记当前是第几句
        USER_VAR[current_user]["task_queue"] = AsyncTaskQueue()  # 任务队列
        USER_VAR[current_user]["task_id"] = 0  # 任务队列

        return jsonify({"valid": True, "user": current_user}), 200
    # 如果token无效，返回错误信息
    except Exception as e:
        logging.error("run.py", "verify_token", "token 无效: " + str(e))
        return jsonify({"valid": False, "message": str(e)}), 200


@app.route("/get-chat-history", methods=["GET"])
def get_chat_history():
    agent_name = request.args.get("agent", "defaultAgent")  # 获取智能体名称
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        logging.success(
            "run.py",
            "get_chat_history",
            "token 有效，当前用户：" + current_user + "，开始获取聊天记录...",
        )

        # 从用户聊天记录获取历史消息，如果没有则初始化
        with open("./static/user.json", "r", encoding="utf-8") as f:
            users = json.load(f)
            for user in users:
                if user["username"] == current_user:
                    encoded_chat_history = user["agents"][agent_name]["chat_history"]
                    break
    except Exception as e:
        logging.error("run.py", "get_chat_history", "获取聊天记录失败: " + str(e))
        return jsonify({"error": str(e)}), 401

    # 对聊天记录进行解码
    chat_history = [decode_message_content(
        msg.copy()) for msg in encoded_chat_history]

    return jsonify(chat_history)


# 图片保存地址
IMAGE_SAVE_NAME = "uploaded_image.jpg"
# 多图片对话保存目录
MULTI_IMAGE_DIRECTORY = "multi_image/"


def init_chat_history(current_user, agent_name, messages):
    with open("./static/user.json", "r", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                encoded_chat_history = user["agents"][agent_name]["chat_history"]
                break
    # 对聊天记录进行解码
    messages = [decode_message_content(msg.copy())
                for msg in encoded_chat_history]

    return messages


def get_image_filenames(directory):
    # 支持的图片扩展名
    image_extensions = (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff")

    # 获取目录下的所有文件
    all_files = os.listdir(directory)

    # 过滤出图片文件
    image_files = [
        file for file in all_files if file.lower().endswith(image_extensions)
    ]

    return image_files


def build_response(current_user, agent_name, user_talk, video_open, multi_image_talk):
    messages = []
    user_cache_dir = os.path.join(".cache", current_user)
    multi_image_dir = os.path.join(user_cache_dir, MULTI_IMAGE_DIRECTORY)
    user_image_path = os.path.join(user_cache_dir, IMAGE_SAVE_NAME)

    if video_open:
        model_name = "glm-4v-plus-0111"
        messages = init_chat_history(current_user, agent_name, messages)

        dst_messages = message_format_tran(messages[-MAX_HISTORY:])
        if os.path.exists(user_image_path):
            with open(user_image_path, "rb") as img_file:
                img_base = base64.b64encode(img_file.read()).decode("utf-8")

            dst_messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": img_base}},
                        {
                            "type": "text",
                            "text": f"{user_talk}（请完全用文本格式回答，直接给我相应描述）",
                        },
                    ],
                }
            )
        else:
            dst_messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"{user_talk}（请完全用文本格式回答）"}
                    ],
                }
            )
            print(f"未找到图片{user_image_path}！")
        # 保存和多模态大模型的聊天
        messages.append({"role": "user", "content": user_talk})
        # 调用大模型
        responses = client.chat.completions.create(
            model=model_name,
            messages=dst_messages,
            stream=True,
        )

    elif multi_image_talk:
        if user_talk == "":
            user_talk = "请描述图片内容"
        if os.path.exists(multi_image_dir):
            image_path_list = get_image_filenames(multi_image_dir)
        else:
            image_path_list = []
        model_name = (
            "glm-4v-plus-0111" if len(image_path_list) == 1 else "glm-4v-plus-0111"
        )  # 选择模型类别

        messages = init_chat_history(current_user, agent_name, messages)
        dst_messages = message_format_tran(messages[-MAX_HISTORY:])

        content = []
        for image_file in image_path_list:
            img_path = os.path.join(multi_image_dir, image_file)
            with open(img_path, "rb") as f:
                img_base = base64.b64encode(f.read()).decode("utf-8")
            content.append(
                {"type": "image_url", "image_url": {"url": img_base}})
        delete_file_from_dir(multi_image_dir)  # 及时清空图片缓存

        content.append(
            {
                "type": "text",
                "text": f"{user_talk}（请完全用文本格式回答，直接给我相应描述）",
            }
        )

        dst_messages.append({"role": "user", "content": content})

        messages.append({"role": "user", "content": user_talk})

        responses = client.chat.completions.create(
            model=model_name,
            messages=dst_messages,
            stream=True,
        )

    else:
        if agent_name == "psychologicalAgent":
            model_name = "emohaa"
            messages = init_chat_history(current_user, agent_name, messages)

            # 添加用户消息
            messages.append({"role": "user", "content": user_talk})

            meta = {
                "user_info": "一位视障人士，失去光明，心情沉重",
                "bot_info": "一位阳光开朗而耐心的年轻女孩，是视障朋友的心灵树洞，乐于帮助他们走出心灵的阴霾",
                "bot_name": "盲人朋友",
                "user_name": "小天",
            }
            # 调用大模型
            responses = client.chat.completions.create(
                model=model_name,
                meta=meta,
                messages=messages[-MAX_HISTORY:],
                stream=True,
            )

        else:
            # 根据选择的模型调用大模型
            model_name = "glm-4-plus-0111"
            messages = init_chat_history(current_user, agent_name, messages)
            # 添加用户消息
            messages.append({"role": "user", "content": user_talk})

            # 调用大模型
            responses = client.chat.completions.create(
                model=model_name,
                messages=messages[-MAX_HISTORY:],
                stream=True,
            )

    return responses, messages


def error_generator(text):
    yield text


@app.route("/agent/chat_stream")
def agent_chat_stream():
    """
    大模型前端流式输出路由
    """
    user_talk = request.args.get("query", "（消息为空，发生了错误，请你给出错误警告）")
    agent_name = request.args.get("agent", "defaultAgent")  # 获取选择的智能体
    video_open = request.args.get("videoOpen", "false") == "true"  # 是否进行图片对话
    multi_image_talk = (
        request.args.get("multi_image_talk", "false") == "true"
    )  # 是否开启多轮对话
    current_user = get_jwt_identity()

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


def message_format_tran(src_messages: list):
    """
    转换message格式，用于多模态大模型的历史聊天
    """
    dst_messages = []
    for msg in src_messages[-10:]:  # 多模态聊天记录保存轮数
        talk = msg["content"]
        temp_msg = msg.copy()
        temp_msg["content"] = [{"text": talk, "type": "text"}]
        dst_messages.append(temp_msg)
    return dst_messages


@app.route("/gaode_api", methods=["GET"])
def gaode_api():
    """返回高德 API 相关信息"""
    gaode_info = api_data.get("gaode", {})
    return jsonify(gaode_info)


def delete_file_from_dir(directory):
    # 删除文件夹下的所有文件
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            os.remove(file_path)
        except Exception as e:
            print("[run.py][delete_file_from_dir]删除文件时出错：", e)


verification_code_dict = {}


@app.route("/send-code", methods=["POST"])
def send_code():
    data = request.get_json()
    phone = data.get("phone")
    usage = data.get("usage")

    if not phone:
        return jsonify({"message": "手机号不能为空", "code": 400}), 400

    # 检查是否频繁发送
    if verification_code_dict:  # 只在字典非空时检查
        stored_data = verification_code_dict.get(phone)
        if stored_data:
            time_passed = time.time() - stored_data["timestamp"]
            if time_passed < 60:

                return (
                    jsonify(
                        {
                            "message": f"请求太频繁，请在{60 - int(time_passed)}秒后重试",
                            "code": 400,
                        }
                    ),
                    400,
                )

    try:
        code = send_verification_code(phone)
        # 存储验证码
        store_verification_code(phone, code, usage, verification_code_dict)
        return jsonify({"message": "验证码发送成功", "code": 200}), 200

    except Exception as e:
        return jsonify({"message": str(e), "code": 500}), 500


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
        current_user = get_jwt_identity()
        user_cache_dir = os.path.join(".cache", current_user)
        if not os.path.exists(user_cache_dir):
            os.makedirs(user_cache_dir)

        # 去掉base64前缀
        image_data = image_data.split(",")[1]

        # 获取当前是否是多图片对话
        if "multi_image_index" in data:
            multi_image_dir = os.path.join(
                user_cache_dir, MULTI_IMAGE_DIRECTORY)
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

        if not image_data:
            return {"message": "Image is empty"}, 400
        with open(image_save_path, "wb") as f:
            f.write(base64.b64decode(image_data))
        # 再次检测图片是否为空
        try:
            mat_image = cv2.imread(image_save_path)
        except Exception:
            return jsonify({"message": "Image is empty again"}), 400

        return jsonify({"message": "Success"}), 200
    except Exception:
        return jsonify({"message": "Error"}), 400


@app.route("/agent/upload_audio", methods=["POST"])
def agent_upload_audio():
    """
    接收前端发来的音频的路由

    Args:
        audio_data {wav} 一次完整的音频数据
        sample_rate {int} 音频采样率

    socketio.emit:
        agent_speech_recognition_finished {string} 本次音频数据的完整语音识别结果
    """
    user = get_jwt_identity()
    user_cache_dir = os.path.join(".cache", user)
    if not os.path.exists(user_cache_dir):
        os.makedirs(user_cache_dir)

    logging.info("run.py", "agent_upload_audio", "开始音频处理...")
    if "audio_data" not in request.files:
        return "No file part in the request", 400

    file = request.files["audio_data"]

    # 前端原始文件的音频采样率
    ori_sample_rate = int(request.form.get("sample_rate"))

    if file.filename == "":
        return "file is empty", 400

    # 保存文件为.wav格式
    audio_file_path = os.path.join(user_cache_dir, "audio.wav")
    file.save(audio_file_path)

    # 修改采样率
    resampled_audio_data = change_sample_rate(
        audio_file_path, 16000, ori_sample_rate)

    # 语音识别
    rec_result = speech_rec(resampled_audio_data)
    print("音频识别结果：", rec_result)

    # 音频识别结果发送到前端
    socketio.emit(
        "agent_speech_recognition_finished", {
            "user": user, "rec_result": rec_result}
    )

    return jsonify({"message": "File uploaded successfully and processed"}), 200


@socketio.on("agent_stream_audio")
def agent_stream_audio(current_token: str, talk_speed: int = 8, task_id : int = 0):
    """
    对音频进行断句处理。

    Args:
        current_token {str} 从前端发来的当前 token
        talk_speed {int} 语速，默认 8
    """
    # 检测socket的token，为了可以调用get_jwt_identity()
    token = request.args.get("token")
    if token:
        request.headers = {"Authorization": f"Bearer {token}"}
        try:
            verify_jwt_in_request()
            user = get_jwt_identity()
            if user not in USER_VAR:
                print(f"[run.py][agent_stream_audio] user {user} not exist")
                return
        except Exception as e:
            print(f"[run.py][agent_stream_audio] JWT verification failed: {e}")
            return
    else:
        print("[run.py][agent_stream_audio] Missing token")
        return
    
    # task_id处理，如果task_id不同，则重置状态
    if USER_VAR[user]["task_id"] != task_id:
        USER_VAR[user]["task_id"] = task_id
        # 重置状态
        USER_VAR[user]["is_streaming"] = False
        USER_VAR[user]["sentence_buffer"] = ""

    # 功能性处理
    if "##" in current_token:
        # 状态1处理
        if current_token == "##<state=1>":
            audio_file_path = "./agent_files/obstacle_start.wav"
            with open(audio_file_path, "rb") as audio_file:
                audio_chunk = audio_file.read()
            socketio.emit(
                "agent_play_audio_chunk",
                {"user": user, "index": 0, "audio_chunk": audio_chunk, "task_id": task_id},
            )
        # 状态2处理
        elif "##<state=2>" in current_token:
            audio_chunk, task_id = agent_audio_generate(
                "开始寻找" + current_token[current_token.find(">") + 1:],
                talk_speed,
                task_id,
            )
            socketio.emit(
                "agent_play_audio_chunk",
                {"user": user, "index": 0, "audio_chunk": audio_chunk, "task_id": task_id},
            )

    else:
        if not USER_VAR[user]["is_streaming"]:
            # 标记正在处理流式响应
            USER_VAR[user]["is_streaming"] = True

            # 重置缓冲区和任务队列
            USER_VAR[user]["sentence_buffer"] = ""
            USER_VAR[user]["task_queue"].reset()
            USER_VAR[user]["sentence_index"] = 0

            # 启动异步任务处理循环
            socketio.start_background_task(process_audio_stream, user)

        # 如果收到结束标记
        if "<END>" in current_token:
            logging.info("run.py", "agent_stream_audio",
                         "大模型响应结束", color="red")

            # 处理缓冲区中剩余的内容
            if USER_VAR[user]["sentence_buffer"]:
                # 将剩余内容加入任务队列
                USER_VAR[user]["task_queue"].add_task_sync(
                    agent_audio_generate, USER_VAR[user]["sentence_buffer"], talk_speed, task_id
                )

            # 重置状态
            USER_VAR[user]["is_streaming"] = False
            USER_VAR[user]["sentence_buffer"] = ""
            return

        # 寻找断句符号的下标
        pause_index = find_pause(current_token)

        # 如果没有找到断句符号，则继续累积
        if pause_index == -1:
            USER_VAR[user]["sentence_buffer"] += current_token
            return

        # 如果找到断句符号，则生成完整句子
        complete_sentence = (
            USER_VAR[user]["sentence_buffer"] +
            current_token[: pause_index + 1]
        )

        # 更新缓冲区
        USER_VAR[user]["sentence_buffer"] = current_token[pause_index + 1:]

        # 将音频生成任务加入队列
        USER_VAR[user]["task_queue"].add_task_sync(
            agent_audio_generate, complete_sentence, talk_speed, task_id
        )


def process_audio_stream(user):
    """处理音频流的后台任务"""
    while True:
        try:
            # 获取下一个音频结果
            audio_chunk, task_id = USER_VAR[user]["task_queue"].get_next_result_sync()

            if audio_chunk is not None:
                # 发送到前端
                socketio.emit(
                    "agent_play_audio_chunk",
                    {
                        "user": user,
                        "index": USER_VAR[user]["sentence_index"],
                        "audio_chunk": audio_chunk,
                        "task_id": task_id,
                    },
                )
                USER_VAR[user]["sentence_index"] += 1

            # 如果流式响应结束且没有更多任务，退出循环
            if (
                not USER_VAR[user]["is_streaming"]
                and USER_VAR[user]["task_queue"].is_empty()
            ):
                break

        except Exception as e:
            logging.error("run.py", "process_audio_stream", f"处理音频流错误: {e}")
            break

# 删除聊天记录


@app.route("/delete-chat-history", methods=["POST"])
def delete_chat_history():
    data = request.get_json()
    curr_user = get_jwt_identity()
    agent_name = data.get("agent_name")

    with open("./static/user.json", "r", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == curr_user:
                if agent_name == 'defaultAgent':
                    user["agents"][agent_name]["chat_history"] = [
                        {"role": "system", "content": "你是视界之声，一位乐于助人的对话助手。为了能让用户能尽快解决问题，你的话语总是十分简洁而概要。"}]
                else:
                    user["agents"][agent_name]["chat_history"] = []
                break
    with open("./static/user.json", "w", encoding="utf-8") as f:
        json.dump(users, f, indent=4, ensure_ascii=False)

    return jsonify({"message": "success"}), 200


def run_server():
    # 当前操作系统
    current_os = platform.system()
    if current_os == "Windows":
        socketio.run(
            app,
            host="0.0.0.0",
            port=80,
            allow_unsafe_werkzeug=True,
            debug=True,  # 调试模式（开发环境）
        )
    else:
        socketio.run(
            app,
            port=443,
            host="0.0.0.0",
            allow_unsafe_werkzeug=True,
            ssl_context=("/ssl/cert.pem", "/ssl/cert.key"),
        )


def forever_run_server():
    """确保服务器不意外终止"""
    while True:
        try:
            run_server()
        except Exception as e:
            logging.error(f"服务器意外终止: {e}")
            time.sleep(5)  # 等待5秒后重启服务器


if __name__ == "__main__":
    # forever_run_server()
    run_server()
