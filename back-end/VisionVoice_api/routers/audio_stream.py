from flask import (
    Blueprint,
    jsonify,
    request,
    send_file,
)


from ..app import *
from ..lib import logging
from ..lib.utils import *
from ..lib.agent_speech_synthesis import agent_audio_generate
from ..lib.agent_speech_rec import speech_rec


audio_stream_bp = Blueprint("audio_stream", __name__)
@socketio.on("audioStream")
def audio_stream_handler(current_token: str, talk_speed: int = 8, task_id: int = 0):
    """
    对音频进行断句处理。

    Args:
        current_token {str} 从前端发来的当前 token
        talk_speed {int} 语速，默认 8
    """
    # 检测socket的token
    token = request.args.get("token")
    if token:
        request.headers = {"Authorization": f"Bearer {token}"}
        try:
            # verify_jwt_in_request()
            user = "StarsAC"
            if user not in USER_VAR:
                print(f"[audio_stream.py][agent_stream_handler] user {user} not exist")
                return
        except Exception as e:
            print(f"[audio_stream.py][agent_stream_handler] JWT verification failed: {e}")
            return
    else:
        print("[audio_stream.py][agent_stream_handler] Missing token")
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
                "agentAudioChunk",
                {
                    "user": user,
                    "index": 0,
                    "audioChunk": audio_chunk,
                    "taskId": task_id,
                },
            )
        # 状态2处理
        elif "##<state=2>" in current_token:
            audio_chunk, task_id = agent_audio_generate(
                "开始寻找" + current_token[current_token.find(">") + 1 :],
                talk_speed,
                task_id,
            )
            socketio.emit(
                "agentAudioChunk",
                {
                    "user": user,
                    "index": 0,
                    "audioChunk": audio_chunk,
                    "taskId": task_id,
                },
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
            logging.info("run.py", "agent_stream_audio", "大模型响应结束", color="red")

            # 处理缓冲区中剩余的内容
            if USER_VAR[user]["sentence_buffer"]:
                # 将剩余内容加入任务队列
                USER_VAR[user]["task_queue"].add_task_sync(
                    agent_audio_generate,
                    USER_VAR[user]["sentence_buffer"],
                    talk_speed,
                    task_id,
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
            USER_VAR[user]["sentence_buffer"] + current_token[: pause_index + 1]
        )

        # 更新缓冲区
        USER_VAR[user]["sentence_buffer"] = current_token[pause_index + 1 :]

        # 将音频生成任务加入队列
        USER_VAR[user]["task_queue"].add_task_sync(
            agent_audio_generate, complete_sentence, talk_speed, task_id
        )


@audio_stream_bp.route("/agent/upload_audio", methods=["POST"])
def agent_upload_audio():
    """
    接收前端发来的音频的路由

    Args:
        audio_data {wav} 一次完整的音频数据
        sample_rate {int} 音频采样率

    socketio.emit:
        agent_speech_recognition_finished {string} 本次音频数据的完整语音识别结果
    """
    user = "StarsAC"
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


@app.route("/get_audio", methods=["GET"])
def get_audio():
    curr_user = "StarsAC"
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







def process_audio_stream(user):
    """处理音频流的后台任务"""
    while True:
        try:
            # 获取下一个音频结果
            audio_chunk, task_id = USER_VAR[user]["task_queue"].get_next_result_sync()

            if audio_chunk is not None:
                # 发送到前端
                socketio.emit(
                    "agentAudioChunk",
                    {
                        "user": user,
                        "index": USER_VAR[user]["sentence_index"],
                        "audioChunk": audio_chunk,
                        "taskId": task_id,
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


