# coding=utf-8
import sys
import json
import os
from lib import logging
import re

with open("./static/api.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    api_key = data["baidu"]["api_key"]
    api_secret = data["baidu"]["api_secret"]

IS_PY3 = sys.version_info.major == 3
if IS_PY3:
    from urllib.request import urlopen
    from urllib.request import Request
    from urllib.error import URLError
    from urllib.parse import urlencode
    from urllib.parse import quote_plus
# else:
#     import urllib2
#     from urllib import quote_plus
#     from urllib2 import urlopen
#     from urllib2 import Request
#     from urllib2 import URLError
#     from urllib import urlencode

# 基础音库：度小宇=1，度小美=0，度逍遥=3，度丫丫=4，
# 精品音库：度逍遥=5003，度小鹿=5118，度博文=106，度小童=110，度小萌=111，度米朵=103，度小娇=5，默认为度小美
PER = 5118
# 语速，取值0-15，默认为5中语速
SPD = 8
# 音调，取值0-15，默认为5中语调
PIT = 7
# 音量，取值0-9，默认为5中音量
VOL = 9
# 下载的文件格式, 3:mp3(default) 4:pcm-16k 5:pcm-8k 6:wav
AUE = 3
# 用户唯一标识
CUID = "123456PYTHON"
# 语音合成的请求地址
TTS_URL = "https://tsn.baidu.com/text2audio"

# FORMATS = {3: "mp3", 4: "pcm", 5: "pcm", 6: "wav"}
# FORMAT = FORMATS[AUE]


# 初始化语音设置
init_params = {
    "tok": "",
    "tex": "",
    "per": PER,
    "spd": SPD,
    "pit": PIT,
    "vol": VOL,
    "aue": AUE,
    "cuid": CUID,
    "lan": "zh",
    "ctp": 1,
}  # lan ctp 固定参数

with open("./configs/audio_settings.json", "w", encoding="utf-8") as f:
    json.dump(init_params, f, ensure_ascii=False, indent=4)


class DemoError(Exception):
    pass


"""  TOKEN start """

TOKEN_URL = "http://aip.baidubce.com/oauth/2.0/token"
SCOPE = "audio_tts_post"  # 有此scope表示有tts能力，没有请在网页里勾选


def fetch_token() -> str:
    params = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": api_secret,
    }
    post_data = urlencode(params)
    if IS_PY3:
        post_data = post_data.encode("utf-8")
    req = Request(TOKEN_URL, post_data)
    try:
        f = urlopen(req, timeout=5)
        result_str = f.read()
    except URLError as err:
        print("token http response http code : " + str(err.code))
        result_str = err.read()
    if IS_PY3:
        result_str = result_str.decode()

    result = json.loads(result_str)
    if "access_token" in result.keys() and "scope" in result.keys():
        if not SCOPE in result["scope"].split(" "):
            raise DemoError("scope is not correct")
        return result["access_token"]
    else:
        raise DemoError(
            "MAYBE api_key or api_secret not correct: access_token or scope not found in token response"
        )


"""  TOKEN end """


def agent_audio_generate(text: str) -> str:
    """
    根据文本生成音频
    """
    token = fetch_token()
    logging.info("agent_speech_synthesis.py", "agent_audio_generate", "输入:" + text)

    # 利用正则匹配去除括号及括号中的内容
    # 如果文本中有一对括号，则括号内的文字是描写，不属于人物的回答
    if "（" in text and "）" in text:
        text = re.sub(r"\（.*?\）", "", text)
    if "(" in text and ")" in text:
        text = re.sub(r"\(.*?\)", "", text)
    
    # 如果文本中只有左括号，说明这段文字是描写，不属于人物的回答，返回空字符串
    if "（" in text and "）" not in text:
        return ""
    
    # 如果文本中只有右括号，则取出右括号右侧的内容
    if "）" in text and "（" not in text:
        text = text.split("）")[1].strip()

    # 去除换行符
    text = text.replace("\n", "")

    if len(text) == 0:
        return ""

    # 对文本进行 URL 编码
    url_encoded_text = quote_plus(text)

    if os.path.exists(
        "./configs/audio_settings.json"
    ):  # 此处路径没有问题, app 启动后, 运行程序路径不在此文件
        try:
            with open("./configs/audio_settings.json", "r", encoding="utf-8") as f:
                params = json.load(f)
                f.close()
        except Exception as e:
            return e
    else:
        print("TTS 输出失败：配置文件丢失")
        exit(0)

    params.update({"tok": token, "tex": url_encoded_text})

    # print('语音请求参数:', params)
    data = urlencode(params)

    req = Request(TTS_URL, data.encode("utf-8"))
    try:
        f = urlopen(req)
        result_str = f.read()

    except URLError as err:
        print("asr http response http code : " + str(err.code))
    
    logging.success(
        "agent_speech_synthesis.py",
        "agent_audio_generate",
        "音频 '{}' 生成成功".format(text),
    )
    return result_str


if __name__ == "__main__":
    pass
