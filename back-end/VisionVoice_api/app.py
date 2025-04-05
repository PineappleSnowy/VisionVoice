"""
该文件的主要模块是视界之声智能体
"""

# 第三方库

import time
import os
from flask import (
    Flask,
    request,
    jsonify,
)
from flask_socketio import SocketIO
from flask_cors import CORS
import json
import platform
from zhipuai import ZhipuAI
from flask_jwt_extended import (
    verify_jwt_in_request,
    JWTManager,
)
from .lib import logging


# 自定义工具

# from agent_files.async_task_queue import AsyncTaskQueue

# from service.sms.sms import send_verification_code, verify_code, store_verification_code


from routers import (
    chat_history,
    gallery_images,
    album_images,
    audio_stream,
    message_stream,
    user_accounts,
)


# ----- 加载全局应用 -----
app = Flask(__name__)
app.secret_key = "s96cae35ce8a9b0244178bf28e4966c2ce1b83"
socketio = SocketIO(
    app,
    async_mode="threading",
    ping_timeout=600,
    ping_interval=300,
    cors_allowed_origins="*",
)  # 设置较大的 pingTimeout 和 pingInterval
JWTManager(app)
CORS(app)
# 设置 JWT 密钥
app.config["JWT_SECRET_KEY"] = "s96cae35ce8a9b0244178bf28e4966c2ce1b83"


app.register_blueprint(chat_history)
app.register_blueprint(gallery_images)
app.register_blueprint(album_images)
app.register_blueprint(audio_stream)
app.register_blueprint(message_stream)
app.register_blueprint(user_accounts)

# 设置后端根路径：与app.py同级
ROOT_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(ROOT_DIR, "data")
"""user_var 保存用户变量的字典，字典格式为:
{"<username>": {
"is_streaming": false, 
"sentence_buffer": "", 
"sentence_index": 0, 
"task_queue": AsyncTaskQueue()}
}
"""
USER_VAR = dict()

# 设置图片文件夹路径
USER_IMAGE_FOLDER = os.path.join(ROOT_DIR, "data", "user_images")


# 处理user.json不存在的情况
if not os.path.exists(os.path.join(DATA_DIR, "user.json")):
    with open(os.path.join(DATA_DIR, "user.json"), "w") as f:
        f.write("[]")

# 处理user_images目录不存在的情况
if not os.path.exists(os.path.join(DATA_DIR, "user_images")):
    os.mkdir(os.path.join(ROOT_DIR, "data", "user_images"))



# 使用 verify_jwt_in_request 进行 JWT 验证
@app.before_request
def before_request():

    # try:
    #     verify_jwt_in_request()
    # except Exception as e:
    #     return (
    #         jsonify({"message": "Token has expired!", "code": 401, "error": str(e)}),
    #         401,
    #     )

    # 获取所有已注册的路由
    registered_routes = [rule.rule for rule in app.url_map.iter_rules()]

    # 检查请求路径是否在允许的静态资源路径或已注册的路由中
    if request.path not in registered_routes:
        return jsonify({"message": "Forbidden", "code": 403}), 403


# 断开连接时删除用户变量
@socketio.on("disconnect")
def handle_disconnect():
    token = request.args.get("token")
    if token:
        request.headers = {"Authorization": f"Bearer {token}"}
        try:
            verify_jwt_in_request()
            user = "StarsAC"
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




# ----- 加载全局变量 -----
# 加载 api_key

with open(os.path.join(ROOT_DIR, "configs", "api.json"), "r", encoding="utf-8") as f:
    api_data = json.load(f)
    api_key_zhipu = api_data["zhipu"]["api_key"]
    CLIENT = ZhipuAI(api_key=api_key_zhipu)


# 聊天记录最大长度
MAX_HISTORY = 10  # 较多的聊天记录长度会导致较多的token消耗
# 图片保存地址
IMAGE_SAVE_NAME = "uploaded_image.jpg"
# 多图片对话保存目录
MULTI_IMAGE_DIRECTORY = "multi_image/"




verification_code_dict = {}


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
