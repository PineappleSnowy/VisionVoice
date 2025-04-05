from flask import (
    Blueprint,
    jsonify,
    request,
)

import json
import os

from ..app import *
from ..lib.utils import *
from ..lib import logging


chat_history_bp = Blueprint("chat_history", __name__)

# 聊天记录相关API


@chat_history_bp.get("/chatHistory")
def get_chat_history():
    agent_name = request.args.get("agent", "defaultAgent")  # 获取智能体名称
    try:
        # verify_jwt_in_request()
        current_user = "StarsAC"
        logging.success(
            "run.py",
            "get_chat_history",
            "token 有效，当前用户：" + current_user + "，开始获取聊天记录...",
        )
        user_path = os.path.join(ROOT_DIR, "data", "user.json")
        # 从用户聊天记录获取历史消息，如果没有则初始化
        with open(user_path, "r", encoding="utf-8") as f:
            users = json.load(f)
            for user in users:
                if user["username"] == current_user:
                    encoded_chat_history = user["agents"][agent_name]["chat_history"]
                    break
    except Exception as e:
        logging.error("run.py", "get_chat_history", "获取聊天记录失败: " + str(e))
        return jsonify({"error": str(e)}), 401

    # 对聊天记录进行解码
    chat_history = [decode_message_content(msg.copy()) for msg in encoded_chat_history]

    return jsonify(chat_history)


@chat_history_bp.delete("/chatHistory")
def delete_chat_history():
    data = request.get_json()
    curr_user = "StarsAC"
    agent_name = data.get("agent_name")

    user_path = os.path.join(ROOT_DIR, "data", "user.json")
    with open(user_path, "r", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == curr_user:
                if agent_name == "defaultAgent":
                    user["agents"][agent_name]["chat_history"] = [
                        {
                            "role": "system",
                            "content": "你是视界之声，一位乐于助人的对话助手。为了能让用户能尽快解决问题，你的话语总是十分简洁而概要。",
                        }
                    ]
                else:
                    user["agents"][agent_name]["chat_history"] = []
                break
    with open(user_path, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=4, ensure_ascii=False)

    return jsonify({"message": "success"}), 200




def init_chat_history(current_user, agent_name, messages):
    user_path = os.path.join(ROOT_DIR, "data", "user.json")
    with open(user_path, "r", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                encoded_chat_history = user["agents"][agent_name]["chat_history"]
                break
    # 对聊天记录进行解码
    messages = [decode_message_content(msg.copy())
                for msg in encoded_chat_history]

    return messages


def save_chat_history(current_user, agent_name, messages):
    # 对聊天记录进行编码
    encoded_messages = [encode_message_content(msg.copy()) for msg in messages]

    # 更新用户聊天记录
    user_path = os.path.join(ROOT_DIR, "data", "user.json")
    with open(user_path, "r+", encoding="utf-8") as f:
        users = json.load(f)
        for user in users:
            if user["username"] == current_user:
                user["agents"][agent_name]["chat_history"] = encoded_messages
                break
        f.seek(0)
        json.dump(users, f, indent=4, ensure_ascii=False)
        f.truncate()
