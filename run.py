"""
该文件的主要模块是视界之声智能体
"""

# 第三方库
import os
from datetime import timedelta
from flask import Flask, stream_with_context, render_template, request, jsonify
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

# 自定义函数
from agent_files.agent_speech_rec import speech_rec
from agent_files.agent_speech_synthesis import agent_audio_generate
from lib.debugger import *

# ----- 加载全局应用 -----
app = Flask(__name__)
socketio = SocketIO(app)
JWTManager(app)
CORS(app)
# 设置 JWT 密钥
app.config["JWT_SECRET_KEY"] = "s96cae35ce8a9b0244178bf28e4966c2ce1b83"

# ----- 路由 -----


# 使用 verify_jwt_in_request 进行 JWT 验证
@app.before_request
def before_request():
    # 排除 GET 请求的 JWT 验证
    if request.path == "/agent/chat_stream" or request.path == "/agent/upload_audio":
        try:
            verify_jwt_in_request()
        except Exception as e:
            return (
                jsonify(
                    {"message": "Token has expired!", "code": 401, "error": str(e)}
                ),
                401,
            )


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/agent", methods=["GET"])
def Agent():
    """智能体根路由"""
    global response_all, messages
    response_all = ""
    messages = []
    return render_template("agent.html")


@app.route("/chat", methods=["GET"])
def chat():
    """消息路由"""
    return render_template("chat.html")


@app.route("/phone", methods=["GET"])
def phone():
    """消息路由"""
    return render_template("phone.html")


@app.route("/create", methods=["GET"])
def create():
    """创作路由"""
    return render_template("create.html")


@app.route("/square", methods=["GET"])
def square():
    """广场路由"""
    return render_template("square.html")


@app.route("/mine", methods=["GET"])
def mine():
    """我的路由"""
    return render_template("mine.html")


# ----- 加载全局变量 -----
# 加载 api_key
with open("./static/api.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    api_key_zhipu = data["zhipu"]["api_key"]
    client = ZhipuAI(api_key=api_key_zhipu)

# 当前操作系统
current_os = platform.system()
# 聊天记录最大长度
MAX_HISTORY = 50


# ----- 预定义函数 -----
def predict(responses):
    """
    生成器函数，用于大模型流式输出
    """
    global response_all, messages
    response_all = ""

    # 大模型流式输出
    for response in responses:
        finish_reason = response.choices[0].finish_reason
        text = response.choices[0].delta.content
        if (
            finish_reason == "sensitive"
        ):  # 当用户输入的内容违规时输出“我听不懂你在说什么”
            text = "我听不懂你在说什么\n"
        response_all += text
        yield text

    # 结束标志
    # if text[-1] != "。":
    yield "<END>"

    messages.append({"role": "assistant", "content": response_all})

    # 对聊天记录进行编码
    encoded_messages = [encode_message_content(msg.copy()) for msg in messages]

    # 更新用户聊天记录
    with open("./static/user.json", "r+", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                user["chat_history"] = encoded_messages
                break
        f.seek(0)
        json.dump(users, f, indent=4, ensure_ascii=False)
        f.truncate()


def change_sample_rate(input_file, target_sample_rate, ori_sample_rate):
    """
    修改采样率函数
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
        # ".", "!", ":", "?", ",", ";",  # 半角符号
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
        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
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

    print("注册信息：\n用户名：{}\n密码：{}".format(username, password))

    # 验证用户名和密码格式
    if not username or not password:
        return jsonify({"message": "用户名和密码不能为空", "code": 400}), 400

    if len(username) < 3 or len(password) < 6:
        return (
            jsonify({"message": "用户名长度至少3位,密码长度至少6位", "code": 400}),
            400,
        )

    try:
        # 读取现有用户
        with open("./static/user.json", "r+", encoding="utf-8") as f:
            users = json.load(f)

            # 检查用户名是否存在
            if any(user["username"] == username for user in users):
                return jsonify({"message": "用户名已存在", "code": 400}), 400

            users.append({"username": username, "password": password})

            print("用户注册成功：\n用户名：{}\n密码：{}".format(username, password))

            # 写回文件
            f.seek(0)
            json.dump(users, f, indent=4, ensure_ascii=False)
            f.truncate()

        return jsonify({"message": "注册成功", "code": 200}), 200

    except Exception as e:
        return jsonify({"message": f"注册失败: {str(e)}", "code": 500}), 500


@app.post("/login")
def login():
    """登录路由"""
    # 读取用户信息
    with open("./static/user.json", "r", encoding="utf-8") as f:
        users = json.load(f)

    # 获取前端传来的用户名和密码
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    print("登录信息：\n用户名：{}\n密码：{}".format(username, password))

    # 对比用户信息
    for user in users:
        info(
            "run.py",
            "login",
            "用户名：" + user["username"] + "密码：" + user["password"],
        )
        if user["username"] == username and user["password"] == password:
            print("登录成功")
            # 设置 local token
            access_token = create_access_token(
                identity=username, expires_delta=timedelta(hours=1)
            )
            return (
                jsonify(
                    {"message": "登录成功", "code": 200, "access_token": access_token}
                ),
                200,
            )
    return jsonify({"message": "账号或密码错误", "code": 400}), 400


@app.route("/verify-token", methods=["POST"])
def verify_token():
    """
    验证登录用户的 token 是否有效
    """
    try:
        # 验证 token 是否有效
        verify_jwt_in_request()
        # 获取当前 token 对应的用户
        current_user = get_jwt_identity()
        success("run.py", "verify_token", "token 有效，当前用户：" + current_user)
        return jsonify({"valid": True, "user": current_user}), 200
    # 如果token无效，返回错误信息
    except:
        return jsonify({"valid": False, "message": "token has expired!"}), 200


@app.route("/get-chat-history", methods=["GET"])
def get_chat_history():
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        success(
            "run.py",
            "get_chat_history",
            "token 有效，当前用户：" + current_user + "，开始获取聊天记录...",
        )

        with open("./static/user.json", "r", encoding="utf-8") as f:
            users = json.load(f)
            for user in users:
                if user["username"] == current_user:
                    encoded_chat_history = user.get("chat_history", [])
                    decoded_chat_history = [
                        decode_message_content(msg.copy())
                        for msg in encoded_chat_history
                    ]
                    success("run.py", "get_chat_history", "获取聊天记录成功")
                    return jsonify(decoded_chat_history), 200

        return jsonify([]), 200
    except Exception as e:
        error("run.py", "get_chat_history", "获取聊天记录失败: " + str(e))
        return jsonify({"error": str(e)}), 401


@app.route("/agent/chat_stream")
def agent_chat_stream():
    """
    大模型前端流式输出路由
    """
    global response_all, messages, current_user

    user_talk = request.args.get("query")
    current_user = get_jwt_identity()

    # 从用户聊天记录获取历史消息，如果没有则初始化
    background_info = "（旁白：苏梦远主演了陆星辰导演的一部音乐题材电影，在拍摄期间，两人因为一场戏的表现有分歧。） 导演，关于这场戏，我觉得可以尝试从角色的内心情感出发，让表现更加真实。"

    # 读取用户的加密聊天记录
    with open("./static/user.json", "r", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                if "chat_history" not in user:
                    user["chat_history"] = [
                        {"role": "assistant", "content": background_info}
                    ]
                encoded_chat_history = user["chat_history"]
                break

    # 对聊天记录进行解码
    messages = [decode_message_content(msg.copy()) for msg in encoded_chat_history]

    # 添加用户消息
    messages.append({"role": "user", "content": user_talk})

    # 限制消息历史长度
    if len(messages) > MAX_HISTORY:
        messages = messages[-MAX_HISTORY:]

    # 调用大模型
    responses = client.chat.completions.create(
        model="charglm-3",
        meta={
            "user_info": "我是陆星辰，是一个男性...",
            "bot_info": "苏梦远，本名苏远心...（每句话结尾都要加句号）",
            "bot_name": "苏梦远",
            "user_name": "陆星辰",
        },
        messages=messages,
        stream=True,
    )

    generate = predict(responses)
    return app.response_class(
        stream_with_context(generate), mimetype="text/event-stream"
    )


@app.route("/agent/upload_image", methods=["POST"])
def upload_image():
    """
    接收前端发来的图片的路由
    """
    data = request.get_json()
    if "image" not in data:
        return jsonify({"error": "No image data in the request"}), 400

    image_data = data["image"]

    # 去掉base64前缀
    if image_data.startswith("data:image"):
        image_data = image_data.split(",")[1]

    # 将图片保存为文件
    image_path = os.path.join(".cache", "uploaded_image.png")
    with open(image_path, "wb") as f:
        f.write(base64.b64decode(image_data))

    return jsonify({"message": "Image uploaded successfully"}), 200


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
    info("run.py", "agent_upload_audio", "开始音频处理...")
    if "audio_data" not in request.files:
        return "No file part in the request", 400

    file = request.files["audio_data"]

    # 前端原始文件的音频采样率
    ori_sample_rate = int(request.form.get("sample_rate"))

    if file.filename == "":
        return "file is empty", 400

    # 保存文件为.wav格式
    file.save("agent_files/audio.wav")

    # 修改采样率
    resampled_audio_data = change_sample_rate(
        "agent_files/audio.wav", 16000, ori_sample_rate
    )

    # 语音识别
    rec_result = speech_rec(resampled_audio_data)

    print("音频识别结果：", rec_result)

    # 音频识别结果发送到前端
    socketio.emit("agent_speech_recognition_finished", {"rec_result": rec_result})

    return jsonify({"message": "File uploaded successfully and processed"}), 200


# 用于累积 token 的缓冲区
sentence_buffer = ""

# 标记是否正在处理流式响应
is_streaming = False

# 用于标记当前是第几句
sentence_index = 0


@socketio.on("agent_stream_audio")
def agent_stream_audio(current_token: str):
    """
    对音频进行断句处理。

    Args:
        current_token {str} 从前端发来的当前 token

    Description:
        将前端发来的大模型响应 token 持续添加到缓冲区中,
        当发现断句符号时,将断句符号之前的内容合成音频发往前端。
    """
    global is_streaming, sentence_buffer, sentence_index

    if not is_streaming:
        is_streaming = True
        sentence_buffer = ""

    # 如果收到结束标记
    if "<END>" in current_token:
        info("run.py", "agent_stream_audio", "大模型响应结束", color="red")

        # 处理缓冲区中剩余的内容
        if sentence_buffer:
            audio_chunk = agent_audio_generate(sentence_buffer)
            socketio.emit(
                "agent_play_audio_chunk",
                {"index": sentence_index, "audio_chunk": audio_chunk},
            )

        # 重置状态
        is_streaming = False
        sentence_buffer = ""
        sentence_index = 0
        return

    # 寻找断句符号的下标（下标从 0 开始）
    pause_index = find_pause(current_token)

    # 如果没有找到断句符号，则继续将 token 累积到缓冲区中
    if pause_index == -1:
        sentence_buffer += current_token
        return

    # 如果找到断句符号，则 '将缓冲区中的内容' 和 '当前 token 的断句符号前的文字' 拼接成完整的句子，并生成音频
    complete_sentence = sentence_buffer + current_token[:pause_index]

    # 更新缓冲区，更新缓冲区的代码应该放在 agent_audio_generate 之前，防止线程阻塞导致缓冲区未及时更新
    sentence_buffer = current_token[pause_index + 1 :]

    # 生成音频
    audio_chunk = agent_audio_generate(complete_sentence)

    # 发送音频
    socketio.emit(
        "agent_play_audio_chunk", {"index": sentence_index, "audio_chunk": audio_chunk}
    )
    sentence_index += 1


if __name__ == "__main__":
    # 根据操作系统选择服务器启动方式
    # if current_os == 'Windows':
    socketio.run(
        app,
        port=80,
        host="0.0.0.0",
        allow_unsafe_werkzeug=True,
        debug=True,  # 调试模式（开发环境）
    )
    # else:
    # socketio.run(app, port=443, host='0.0.0.0', allow_unsafe_werkzeug=True,
    # ssl_context=('/ssl/cert.pem', '/ssl/cert.key'))
