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

# 自定义工具
from agent_files.agent_speech_rec import speech_rec
from agent_files.agent_speech_synthesis import agent_audio_generate
from lib import logging
from agent_files.async_task_queue import AsyncTaskQueue

# ----- 加载全局应用 -----
app = Flask(__name__)
socketio = SocketIO(app, async_mode="threading")
JWTManager(app)
CORS(app)
# 设置 JWT 密钥
app.config["JWT_SECRET_KEY"] = "s96cae35ce8a9b0244178bf28e4966c2ce1b83"
messages = {"defaultAgent": [], "psychologicalAgent": []}
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
    messages = {"defaultAgent": [], "psychologicalAgent": []}
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

def save_chat_history(agent_name):
    # 对聊天记录进行编码
    encoded_messages = [encode_message_content(
        msg.copy()) for msg in messages[agent_name]]

    # 更新用户聊天记录
    with open("./static/user.json", "r+", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                user[agent_name]["chat_history"] = encoded_messages
                break
        f.seek(0)
        json.dump(users, f, indent=4, ensure_ascii=False)
        f.truncate()


def predict(responses, agent_name):
    """
    生成器函数，用于大模型流式输出
    """
    global response_all
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
    messages[agent_name].append({"role": "assistant", "content": response_all})
    print(f"response_all: {response_all}")
    save_chat_history(agent_name)
    # 结束标志
    # if text[-1] != "。":
    yield "<END>"


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
        logging.info(
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
        logging.success(
            "run.py", "verify_token", "token 有效，当前用户：" + current_user
        )
        return jsonify({"valid": True, "user": current_user}), 200
    # 如果token无效，返回错误信息
    except:
        return jsonify({"valid": False, "message": "token has expired!"}), 200


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
                    if agent_name not in user:
                        user[agent_name] = {"chat_history": []}
                    encoded_chat_history = user[agent_name]["chat_history"]
                    break
    except Exception as e:
        logging.error("run.py", "get_chat_history", "获取聊天记录失败: " + str(e))
        return jsonify({"error": str(e)}), 401

    # 对聊天记录进行解码
    chat_history = [decode_message_content(
        msg.copy()) for msg in encoded_chat_history]

    return jsonify(chat_history)

## 图片保存地址
IAMGE_SAVE_PATH = ".cache/uploaded_image.jpg"


def build_response(agent_name, user_talk, current_user, video_open):
    if video_open:
        model_name = "glm-4v"
        # 读取用户的加密聊天记录
        with open("./static/user.json", "r", encoding="utf-8") as f:
            users = json.load(f)
            for user in users:
                if user["username"] == current_user:
                    if "chat_history" not in user[agent_name]:
                        user[agent_name]["chat_history"] = []
                    encoded_chat_history = user[agent_name]["chat_history"]
                    break

        # 对聊天记录进行解码
        messages[agent_name] = [decode_message_content(msg.copy())
                                for msg in encoded_chat_history]

        dst_messages = message_format_tran(messages[agent_name])
        if os.path.exists(IAMGE_SAVE_PATH):
            with open(IAMGE_SAVE_PATH, 'rb') as img_file:
                img_base = base64.b64encode(img_file.read()).decode('utf-8')
            dst_messages.append({"role": "user",
                                "content": [{"type": "image_url", "image_url": {"url": img_base}},
                                            {"type": "text", "text": "请描述这个图片"}]})
        else:
            dst_messages.append({"role": "user",
                                "content": [{"type": "text", "text": user_talk}]})
            print(f"未找到图片{IAMGE_SAVE_PATH}！")
        # 保存和多模态大模型的聊天
        messages[agent_name].append({"role": "user", "content": user_talk})
        # 限制消息历史长度
        if len(messages[agent_name]) > MAX_HISTORY:
            messages[agent_name] = messages[agent_name][-MAX_HISTORY:]

        # 调用大模型
        responses = client.chat.completions.create(
            model=model_name,
            messages=dst_messages,
            stream=True,
        )
    else:
        if agent_name == "defaultAgent":
            # 根据选择的模型调用大模型
            model_name = "glm-4-flash"
            sys_prompt = "你是视界之声，一位乐于助人的对话助手。为了能让用户能尽快解决问题，你的话语总是十分简洁而概要。"
            # 读取用户的加密聊天记录
            with open("./static/user.json", "r", encoding="utf-8") as f:
                users = json.load(f)
                for user in users:
                    if user["username"] == current_user:
                        if "chat_history" not in user[agent_name]:
                            user[agent_name]["chat_history"] = [
                                {"role": "system", "content": sys_prompt}
                            ]
                        encoded_chat_history = user[agent_name]["chat_history"]
                        break

            # 对聊天记录进行解码
            messages[agent_name] = [decode_message_content(msg.copy())
                                    for msg in encoded_chat_history]

            # 添加用户消息
            messages[agent_name].append({"role": "user", "content": user_talk})

            # 限制消息历史长度
            if len(messages[agent_name]) > MAX_HISTORY:
                messages[agent_name] = messages[agent_name][-MAX_HISTORY:]

            # 调用大模型
            responses = client.chat.completions.create(
                model=model_name,
                messages=messages[agent_name],
                stream=True,
            )

        else:
            model_name = "charglm-3"
            # 从用户聊天记录获取历史消息，如果没有则初始化
            background_info = "（旁白：苏梦远主演了陆星辰导演的一部音乐题材电影，在拍摄期间，两人因为一场戏的表现有分歧。） 导演，关于这场戏，我觉得可以尝试从角色的内心情感出发，让表现更加真实。"

            # 读取用户的加密聊天记录
            with open("./static/user.json", "r", encoding="utf-8") as f:
                users = json.load(f)
                for user in users:
                    if user["username"] == current_user:
                        if "chat_history" not in user[agent_name]:
                            user[agent_name]["chat_history"] = [
                                {"role": "assistant", "content": background_info}
                            ]
                        encoded_chat_history = user[agent_name]["chat_history"]
                        break

            # 对聊天记录进行解码
            messages[agent_name] = [decode_message_content(msg.copy())
                                    for msg in encoded_chat_history]

            # 添加用户消息
            messages[agent_name].append({"role": "user", "content": user_talk})

            # 限制消息历史长度
            if len(messages[agent_name]) > MAX_HISTORY:
                messages[agent_name] = messages[agent_name][-MAX_HISTORY:]

            # 调用大模型
            responses = client.chat.completions.create(
                model=model_name,
                meta={
                    "user_info": "我是陆星辰，是一个男性...",
                    "bot_info": "苏梦远，本名苏远心...（说话的结尾一定有句号等结尾符号）",
                    "bot_name": "苏梦远",
                    "user_name": "陆星辰",
                },
                messages=messages[agent_name],
                stream=True,
            )
    return responses


@app.route("/agent/chat_stream")
def agent_chat_stream():
    """
    大模型前端流式输出路由
    """
    global response_all, current_user

    user_talk = request.args.get("query")
    agent_name = request.args.get("agent", "defaultAgent")  # 获取选择的智能体
    video_open = request.args.get("videoOpen", "false") == "true"  # 获取选择的智能体
    current_user = get_jwt_identity()
    # messages[agent_name].append({"role": "user", "content": user_talk})

    responses = build_response(agent_name, user_talk, current_user, video_open)

    generate = predict(responses, agent_name)
    return app.response_class(
        stream_with_context(generate), mimetype="text/event-stream"
    )


def message_format_tran(src_messages: list):
    """
    转换message格式，用于多模态大模型的历史聊天
    """
    dst_messages = []
    for msg in src_messages[-10:]:  ## 多模态聊天记录保存轮数
        talk = msg["content"]
        temp_msg = msg.copy()
        temp_msg["content"] = [{"text": talk, "type": "text"}]
        dst_messages.append(temp_msg)
    return dst_messages


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
    image_data = image_data.split(",")[1]

    # 将图片保存为文件
    with open(IAMGE_SAVE_PATH, "wb") as f:
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
    logging.info("run.py", "agent_upload_audio", "开始音频处理...")
    if "audio_data" not in request.files:
        return "No file part in the request", 400

    file = request.files["audio_data"]

    # 前端原始文件的音频采样率
    ori_sample_rate = int(request.form.get("sample_rate"))

    if file.filename == "":
        return "file is empty", 400

    # 保存文件为.wav格式
    file.save(".cache/audio.wav")

    # 修改采样率
    resampled_audio_data = change_sample_rate(
        ".cache/audio.wav", 16000, ori_sample_rate
    )

    # 语音识别
    rec_result = speech_rec(resampled_audio_data)

    print("音频识别结果：", rec_result)

    # 音频识别结果发送到前端
    socketio.emit("agent_speech_recognition_finished",
                  {"rec_result": rec_result})

    return jsonify({"message": "File uploaded successfully and processed"}), 200


# 用于累积 token 的缓冲区
sentence_buffer = ""

# 标记是否正在处理流式响应
is_streaming = False

# 用于标记当前是第几句
sentence_index = 0

# 任务队列
task_queue = AsyncTaskQueue()


@socketio.on("agent_stream_audio")
def agent_stream_audio(current_token: str):
    """
    对音频进行断句处理。

    Args:
        current_token {str} 从前端发来的当前 token
    """
    global is_streaming, sentence_buffer, sentence_index

    if not is_streaming:
        # 标记正在处理流式响应
        is_streaming = True

        # 重置缓冲区和任务队列
        sentence_buffer = ""
        task_queue.reset()
        sentence_index = 0

        # 启动异步任务处理循环
        socketio.start_background_task(process_audio_stream)

    # 如果收到结束标记
    if "<END>" in current_token:
        logging.info("run.py", "agent_stream_audio", "大模型响应结束", color="red")

        # 处理缓冲区中剩余的内容
        if sentence_buffer:
            # 将剩余内容加入任务队列
            task_queue.add_task_sync(agent_audio_generate, sentence_buffer)

        # 重置状态
        is_streaming = False
        sentence_buffer = ""
        return

    # 寻找断句符号的下标
    pause_index = find_pause(current_token)

    # 如果没有找到断句符号，则继续累积
    if pause_index == -1:
        sentence_buffer += current_token
        return

    # 如果找到断句符号，则生成完整句子
    complete_sentence = sentence_buffer + current_token[:pause_index + 1]

    # 更新缓冲区
    sentence_buffer = current_token[pause_index + 1:]

    # 将音频生成任务加入队列
    task_queue.add_task_sync(agent_audio_generate, complete_sentence)


def process_audio_stream():
    """处理音频流的后台任务"""
    global sentence_index

    while True:
        try:
            # 获取下一个音频结果
            audio_chunk = task_queue.get_next_result_sync()

            if audio_chunk is not None:
                # 发送到前端
                socketio.emit(
                    "agent_play_audio_chunk",
                    {"index": sentence_index, "audio_chunk": audio_chunk}
                )
                sentence_index += 1

            # 如果流式响应结束且没有更多任务，退出循环
            if not is_streaming and task_queue.is_empty():
                break

        except Exception as e:
            logging.error("run.py", "process_audio_stream", f"处理音频流错误: {e}")
            break


if __name__ == "__main__":
    # 根据操作系统选择服务器启动方式
    if current_os == "Windows":
        socketio.run(
            app,
            port=80,
            host="0.0.0.0",
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
