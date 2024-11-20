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
                    {"message": "Token has expired!",
                        "code": 401, "error": str(e)}
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
# 偏置，因为断句会导致句子总数发生变化，这引入了偏置
bias = 0
# 带人类断句的回答，字典，以序号:回答形式保存，避免语序错误
ideal_answers = dict()
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


def find_pause(str_seek):
    """
    寻找话语停顿函数，返回最后一次断句位置
    """
    aim_symbols = ["。", "！", "：", "？", "，", "；"]
    index_list = []
    for symbol in aim_symbols:
        index = str_seek.rfind(symbol)
        index_list.append(index)
    aim_index = max(index_list)
    return aim_index


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
        print(user["username"], user["password"])
        if user["username"] == username and user["password"] == password:
            print("登录成功")
            # 设置 local token
            access_token = create_access_token(
                identity=username, expires_delta=timedelta(hours=1))
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
        print("token 有效")
        # 获取当前 token 对应的用户
        current_user = get_jwt_identity()
        print("当前用户：", current_user)
        return jsonify({"valid": True, "user": current_user}), 200
    # 如果token无效，返回错误信息
    except:
        return jsonify({"valid": False, "message": "token has expired!"}), 400


@app.route("/get-chat-history")
def get_chat_history():
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()

        with open("./static/user.json", "r", encoding="utf-8") as f:
            users = json.load(f)
            for user in users:
                if user["username"] == current_user:
                    encoded_chat_history = user.get("chat_history", [])
                    decoded_chat_history = [
                        decode_message_content(msg.copy())
                        for msg in encoded_chat_history
                    ]
                    return jsonify(decoded_chat_history), 200

        return jsonify([]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@app.route("/agent/chat_stream")
def agent_chat_stream():
    """
    大模型前端流式输出路由
    """
    global bias, ideal_answers, response_all, messages, current_user
    # 人类断句相关参数初始化
    bias = 0
    ideal_answers = dict()

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
    messages = [decode_message_content(msg.copy())
                for msg in encoded_chat_history]

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
            "bot_info": "苏梦远，本名苏远心...（结尾一定要有句号等结尾符号）",
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
    if 'image' not in data:
        return jsonify({"error": "No image data in the request"}), 400

    image_data = data['image']

    # 去掉base64前缀
    if image_data.startswith('data:image'):
        image_data = image_data.split(',')[1]

    # 将图片保存为文件
    image_path = os.path.join('.cache', 'uploaded_image.png')
    with open(image_path, 'wb') as f:
        f.write(base64.b64decode(image_data))

    return jsonify({"message": "Image uploaded successfully"}), 200


@app.route("/agent/upload_audio", methods=["POST"])
def agent_upload_audio():
    """
    接收前端发来的音频的路由
    """
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

    # 语音识别结果发送到前端
    socketio.emit("agent_speech_rec", {"rec_result": rec_result})

    return jsonify({"message": "File uploaded successfully and processed"}), 200


# ----- socket 监听函数 -----
@socketio.on("agent_stream_audio")
def agent_handle_audio_stream(data):
    """
    处理音频流路由。

    Args:
        data: 包含大模型响应token的数据。

    Description:
        处理前端发来的大模型响应token，以人类断句的方式合成音频再发往前端。
    """
    global bias
    # 寻找最后一次断句下标
    aim = find_pause(data["answer"])
    # 未找到时的处理
    if aim == -1:
        if (data["index"] - bias) in ideal_answers:
            ideal_answers[data["index"] - bias] += data["answer"]
        else:
            ideal_answers[data["index"] - bias] = data["answer"]
        bias += 1
        socketio.emit("agent_play_audio_chunk", {
                      "index": -1, "audio_chunk": ""})
    else:
        good_answer = data["answer"][: aim + 1]
        bad_answer = data["answer"][aim + 1:]
        if (data["index"] - bias) in ideal_answers:
            ideal_answers[data["index"] - bias] += good_answer
        else:
            ideal_answers[data["index"] - bias] = good_answer

        if bad_answer:
            ideal_answers[data["index"] - bias + 1] = bad_answer
        data["bias"] = bias

        # 发送合成的语音到前端，对音频进行播放
        input_text = ideal_answers[data["index"] - bias]
        # print('data["index"] - data["bias"]:', data["index"] - data["bias"])
        # print('data["index"]', data["index"])
        # print('data["bias"]:', data["bias"])
        audio_chunk = agent_audio_generate(ideal_answers[data["index"] - bias])
        # 发送合成的语音到前端
        print("TTS 处理完毕:", input_text)

        socketio.emit(
            "agent_play_audio_chunk",
            {"index": data["index"] - data["bias"],
                "audio_chunk": audio_chunk},
        )


if __name__ == "__main__":
    # 根据操作系统选择服务器启动方式
    # if current_os == 'Windows':
    socketio.run(
        app,
        port=5000,
        host="0.0.0.0",
        allow_unsafe_werkzeug=True,
        debug=True,  # 调试模式（开发环境）
    )
    # else:
    # socketio.run(app, port=443, host='0.0.0.0', allow_unsafe_werkzeug=True,
    # ssl_context=('/ssl/cert.pem', '/ssl/cert.key'))
