# coding=utf-8
import sys
import json
import numpy as np

with open("./static/api.json", "r", encoding='utf-8') as f:
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

# 发音人选择, 基础音库：度小宇=1，度小美=0，度逍遥（基础）=3，度丫丫=4，
# 精品音库：度逍遥（精品）=5003，度小鹿=5118，度博文=106，度小童=110，度小萌=111，度米朵=103，度小娇=5，默认为度小美
PER = 111
# 语速，取值0-15，默认为5中语速
SPD = 6
# 音调，取值0-15，默认为5中语调
PIT = 5
# 音量，取值0-9，默认为5中音量
VOL = 9
# 下载的文件格式, 3：mp3(default) 4： pcm-16k 5： pcm-8k 6. wav
AUE = 3

FORMATS = {3: "mp3", 4: "pcm", 5: "pcm", 6: "wav"}
FORMAT = FORMATS[AUE]

CUID = "123456PYTHON"

TTS_URL = 'http://tsn.baidu.com/text2audio'


class DemoError(Exception):
    pass


"""  TOKEN start """

TOKEN_URL = 'http://aip.baidubce.com/oauth/2.0/token'
SCOPE = 'audio_tts_post'  # 有此scope表示有tts能力，没有请在网页里勾选


def fetch_token():
    params = {'grant_type': 'client_credentials',
              'client_id': api_key,
              'client_secret': api_secret}
    post_data = urlencode(params)
    if (IS_PY3):
        post_data = post_data.encode('utf-8')
    req = Request(TOKEN_URL, post_data)
    try:
        f = urlopen(req, timeout=5)
        result_str = f.read()
    except URLError as err:
        print('token http response http code : ' + str(err.code))
        result_str = err.read()
    if (IS_PY3):
        result_str = result_str.decode()

    # print(result_str)
    result = json.loads(result_str)
    # print(result)
    if 'access_token' in result.keys() and 'scope' in result.keys():
        if not SCOPE in result['scope'].split(' '):
            raise DemoError('scope is not correct')
        return result['access_token']
    else:
        raise DemoError('MAYBE api_key or api_secret not correct: access_token or scope not found in token response')


"""  TOKEN end """


def agent_audio_generate(TEXT):
    token = fetch_token()
    tex = quote_plus(TEXT)  # 此处TEXT需要两次urlencode
    # print(tex)
    params = {'tok': token, 'tex': tex, 'per': PER, 'spd': SPD, 'pit': PIT, 'vol': VOL, 'aue': AUE, 'cuid': CUID,
              'lan': 'zh', 'ctp': 1}  # lan ctp 固定参数

    data = urlencode(params)
    # print('test on Web Browser' + TTS_URL + '?' + data)

    req = Request(TTS_URL, data.encode('utf-8'))
    try:
        f = urlopen(req)
        result_str = f.read()

    except URLError as err:
        print('asr http response http code : ' + str(err.code))

    # audio_np = np.frombuffer(result_str, dtype=np.int16)

    return result_str


if __name__ == "__main__":
    pass
