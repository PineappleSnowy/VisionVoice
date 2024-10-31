# 自定义函数
from agent_files.agent_speech_rec import speech_rec
from agent_files.agent_speech_synthesis import agent_audio_generate
# 第三方pip包
from flask import Flask, stream_with_context, render_template, request, Flask
from flask_socketio import SocketIO
import numpy as np
import samplerate
import json
import platform
from zhipuai import ZhipuAI
current_os = platform.system()  # 当前操作系统
app = Flask(__name__)
socketio = SocketIO(app)


########### 视界之声智能体 #############
# 加载api_key
with open("./static/api.json", "r", encoding='utf-8') as f:
    data = json.load(f)
    api_key_zhipu = data["zhipu"]["api_key"]
    client = ZhipuAI(api_key=api_key_zhipu)

response_all = ""


def predict(responses):
    """
    生成器函数，用于大模型流式输出
    """
    global response_all
    response_all = ""

    # 大模型流式输出
    for response in responses:
        finish_reason = response.choices[0].finish_reason
        text = response.choices[0].delta.content
        if finish_reason == 'sensitive':  # 当用户输入的内容违规时输出“我听不懂你在说什么”
            text = "我听不懂你在说什么\n"
        response_all += text
        yield text


@app.route('/')
def Agent():
    """
    智能体根路由
    """
    global response_all, messages
    response_all = ''
    messages = [messages[0]]
    return render_template('Agent.html')


background_info = "（旁白：苏梦远主演了陆星辰导演的一部音乐题材电影，在拍摄期间，两人因为一场戏的表现有分歧。） 导演，关于这场戏，我觉得可以尝试从角色的内心情感出发，让表现更加真实。"
messages = [{
            "role": "assistant",
            "content": background_info
            }]


@app.get('/agent/chat_stream')
def agent_chat_stream():
    """
    大模型前端流式输出路由
    """
    global bias, ideal_answers
    # 人类断句相关参数初始化
    bias = 0
    ideal_answers = dict()

    user_talk = request.args.get('query')
    if response_all:
        messages.append({
            "role": "assistant",
            "content": response_all
        },)
    messages.append({
        "role": "user",
        "content": user_talk
    },)
    print(messages)
    responses = client.chat.completions.create(
        model="charglm-3",  # 填写需要调用的模型名称
        meta={
            "user_info": "我是陆星辰，是一个男性，是一位知名导演，也是苏梦远的合作导演。我擅长拍摄音乐题材的电影。苏梦远对我的态度是尊敬的，并视我为良师益友。",
            "bot_info": "苏梦远，本名苏远心，是一位当红的国内女歌手及演员。在参加选秀节目后，凭借独特的嗓音及出众的舞台魅力迅速成名，进入娱乐圈。她外表美丽动人，但真正的魅力在于她的才华和勤奋。苏梦远是音乐学院毕业的优秀生，善于创作，拥有多首热门原创歌曲。除了音乐方面的成就，她还热衷于慈善事业，积极参加公益活动，用实际行动传递正能量。在工作中，她对待工作非常敬业，拍戏时总是全身心投入角色，赢得了业内人士的赞誉和粉丝的喜爱。虽然在娱乐圈，但她始终保持低调、谦逊的态度，深得同行尊重。在表达时，苏梦远喜欢使用“我们”和“一起”，强调团队精神。",
            "bot_name": "苏梦远",
            "user_name": "陆星辰"
        },
        messages=messages,
        stream=True,
    )
    generate = predict(responses)
    return app.response_class(stream_with_context(generate), mimetype="text/event-stream")


@app.route('/agent/upload_audio', methods=['POST'])
def agent_upload_audio():
    """
    接收前端发来的音频的路由
    """
    if 'audio_data' not in request.files:
        return 'No file part in the request', 400

    file = request.files['audio_data']
    # 前端音频采样率
    ori_sample_rate = int(request.form.get('sample_rate'))
    if file.filename == '':
        return 'No selected file', 400

    # 保存文件为.wav格式
    file.save('agent_files/audio.wav')
    # 修改采样率
    resampled_audio_data = change_sample_rate(
        'agent_files/audio.wav', 16000, ori_sample_rate)

    # 语音识别
    rec_result = speech_rec(resampled_audio_data)
    # 语音识别结果发送到前端
    socketio.emit('agent_speech_rec', {'rec_result': rec_result})

    return 'File uploaded successfully and processed', 200


def change_sample_rate(input_file, target_sample_rate, ori_sample_rate):
    """
    修改采样率函数
    """
    ratio = target_sample_rate / ori_sample_rate
    converter = 'sinc_best'  # or 'sinc_fastest', ...
    with open(input_file, 'rb') as speech_file:
        audio_data = speech_file.read()
        audio_data = np.frombuffer(audio_data, dtype=np.int16)
    resampled_audio_data = samplerate.resample(audio_data, ratio, converter)

    return resampled_audio_data.astype(np.int16).tobytes()


def find_pause(str_seek):
    """
    寻找话语停顿函数，返回最后一次断句位置
    """
    aim_symbols = ['。', '！', '：', '？', '，', '；']
    index_list = []
    for symbol in aim_symbols:
        index = str_seek.rfind(symbol)
        index_list.append(index)
    aim_index = max(index_list)
    return aim_index


# 偏置，因为断句会导致句子总数发生变化，这引入了偏置
bias = 0
# 带人类断句的回答，字典，以序号:回答形式保存，避免语序错误
ideal_answers = dict()


@socketio.on('agent_stream_audio')
def agent_handle_audio_stream(data):
    """
    处理前端发来的大模型响应token并以人类断句的方式合成音频再发往前端
    """
    global bias
    # 寻找最后一次断句下标
    aim = find_pause(data['answer'])
    # 未找到时的处理
    if aim == -1:
        if (data['index'] - bias) in ideal_answers:
            ideal_answers[data['index'] - bias] += data['answer']
        else:
            ideal_answers[data['index'] - bias] = data['answer']
        bias += 1
        socketio.emit('agent_play_audio_chunk', {
            'index': -1, 'audio_chunk': ""})
    else:
        good_answer = data['answer'][: aim+1]
        bad_answer = data['answer'][aim+1:]
        if (data['index'] - bias) in ideal_answers:
            ideal_answers[data['index'] - bias] += good_answer
        else:
            ideal_answers[data['index'] - bias] = good_answer

        if bad_answer:
            ideal_answers[data['index'] - bias + 1] = bad_answer
        data['bias'] = bias
        audio_chunk = agent_audio_generate(ideal_answers[data['index'] - bias])
        # 发送合成的语音到前端
        socketio.emit('agent_play_audio_chunk', {
            'index': data['index'] - data['bias'], 'audio_chunk': audio_chunk})


if __name__ == "__main__":
    # 根据操作系统选择服务器启动方式
    #if current_os == 'Windows':
    socketio.run(app, port=80, host='0.0.0.0', allow_unsafe_werkzeug=True)
    #else:
    #socketio.run(app, port=443, host='0.0.0.0', allow_unsafe_werkzeug=True,
                 #ssl_context=('/ssl/cert.pem', '/ssl/cert.key'))
