import base64
import samplerate
import numpy as np
import os
import time
import random

from ..app import *
from ..routers.chat_history import init_chat_history

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
        ".",
        "!",
        ":",
        "?",
        ",",
        ";",  # 半角符号
    ]

    # 记录目标符号的位置
    index_list = []

    for symbol in target_symbols:
        index = sentence.rfind(symbol)
        index_list.append(index)
    pause_index = max(index_list)
    return pause_index


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
        responses = CLIENT.chat.completions.create(
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
            content.append({"type": "image_url", "image_url": {"url": img_base}})
        delete_file_from_dir(multi_image_dir)  # 及时清空图片缓存

        content.append(
            {
                "type": "text",
                "text": f"{user_talk}（请完全用文本格式回答，直接给我相应描述）",
            }
        )

        dst_messages.append({"role": "user", "content": content})

        messages.append({"role": "user", "content": user_talk})

        responses = CLIENT.chat.completions.create(
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
            responses = CLIENT.chat.completions.create(
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
            responses = CLIENT.chat.completions.create(
                model=model_name,
                messages=messages[-MAX_HISTORY:],
                stream=True,
            )

    return responses, messages


def error_generator(text):
    yield text


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


def delete_file_from_dir(directory):
    # 删除文件夹下的所有文件
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            os.remove(file_path)
        except Exception as e:
            print("[run.py][delete_file_from_dir]删除文件时出错：", e)


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



def gen_time_random_name():
    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    random_number = random.randint(100000, 999999)
    return f"{timestamp}{random_number}"
