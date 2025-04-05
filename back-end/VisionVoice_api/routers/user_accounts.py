from flask import (
    Blueprint,
    jsonify,
    request,
    session,
)
from flask_jwt_extended import (
    create_access_token,
    verify_jwt_in_request,
)

from ..app import *
from ..lib import logging
from ..lib.async_task_queue import AsyncTaskQueue
user_accounts_bp = Blueprint("user_accounts", __name__)
from ..lib.sms import send_verification_code, verify_code, store_verification_code

@user_accounts_bp.post("/register")
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
        access_token = create_access_token(identity=username, expires_delta=False)
        session["username"] = username
        session["nickname"] = nickname

        return (
            jsonify({"message": "注册成功", "code": 200, "access_token": access_token}),
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
        current_user = "StarsAC"

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


@app.get("/userAgreement")
def get_user_agreement():
    file_path = os.path.join(ROOT_DIR,'config','user_agreement.txt')
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content.replace("\n", "<br>")
    except FileNotFoundError:
        return "File not found", 404



