# coding=utf-8

import json
from urllib.request import urlopen
from urllib.request import Request
from urllib.error import URLError
from urllib.parse import urlencode

with open("./static/api.json", "r", encoding='utf-8') as f:
    data = json.load(f)
    API_KEY = data["baidu"]["api_key"]
    SECRET_KEY = data["baidu"]["api_secret"]

# 需要识别的文件
# AUDIO_FILE = 'audio.wav'  # 只支持 pcm/wav/amr 格式，极速版额外支持m4a 格式
# 文件格式
# FORMAT = AUDIO_FILE[-3:]  # 文件后缀只支持 pcm/wav/amr 格式，极速版额外支持m4a 格式
# FORMAT = 'wav'

CUID = '123456PYTHON'
# 采样率
RATE = 16000  # 固定值

# 普通版

# DEV_PID = 1537  # 1537 表示识别普通话，使用输入法模型。根据文档填写PID，选择语言及识别模型
# ASR_URL = 'http://vop.baidu.com/server_api'
# SCOPE = 'audio_voice_assistant_get'  #server 有此scope表示有asr能力，没有请在网页里勾选，非常旧的应用可能没有


# 测试自训练平台需要打开以下信息， 自训练平台模型上线后，您会看见 第二步：“”获取专属模型参数pid:8001，modelid:1234”，按照这个信息获取 dev_pid=8001，lm_id=1234
# DEV_PID = 8001 ;   
# LM_ID = 1234 ;

# 极速版 打开注释的话请填写自己申请的appkey appSecret ，并在网页中开通极速版（开通后可能会收费）

DEV_PID = 80001
ASR_URL = 'http://vop.baidu.com/pro_api'
SCOPE = 'brain_enhanced_asr'  # 有此scope表示有asr能力，没有请在网页里开通极速版

# 忽略scope检查，非常旧的应用可能没有
# SCOPE = False


# 极速版

class DemoError(Exception):
    pass


"""  TOKEN start """

TOKEN_URL = 'http://aip.baidubce.com/oauth/2.0/token'


def fetch_token():
    params = {'grant_type': 'client_credentials',
              'client_id': API_KEY,
              'client_secret': SECRET_KEY}
    post_data = urlencode(params)
    post_data = post_data.encode('utf-8')
    req = Request(TOKEN_URL, post_data)
    try:
        f = urlopen(req)
        result_str = f.read()
    except URLError as err:
        print('token http response http code : ' + str(err.code))
        result_str = err.read()
    result_str = result_str.decode()

    result = json.loads(result_str)
    if ('access_token' in result.keys() and 'scope' in result.keys()):
        if SCOPE and (not SCOPE in result['scope'].split(' ')):  # SCOPE = False 忽略检查
            raise DemoError('scope is not correct')
        return result['access_token']
    else:
        raise DemoError('MAYBE API_KEY or SECRET_KEY not correct: access_token or scope not found in token response')


"""  TOKEN end """


def speech_rec(speech_data="", filename:str=""):
    token = fetch_token()

    """
    httpHandler = urllib2.HTTPHandler(debuglevel=1)
    opener = urllib2.build_opener(httpHandler)
    urllib2.install_opener(opener)
    """
    
    # speech_data = []
    if filename:
        FORMAT = filename[-3:]
        with open(filename, 'rb') as speech_file:
            speech_data = speech_file.read()
    else:
        FORMAT = 'wav'
    length = len(speech_data)
    if length == 0:
        raise DemoError('file %s length read 0 bytes')

    params = {'cuid': CUID, 'token': token, 'dev_pid': DEV_PID}
    # 测试自训练平台需要打开以下信息
    # params = {'cuid': CUID, 'token': token, 'dev_pid': DEV_PID, 'lm_id' : LM_ID}
    params_query = urlencode(params)

    headers = {
        'Content-Type': 'audio/' + FORMAT + '; rate=' + str(RATE),
        'Content-Length': length
    }

    # url = ASR_URL + "?" + params_query
    # print post_data
    req = Request(ASR_URL + "?" + params_query, speech_data, headers)
    try:
        f = urlopen(req)
        result_dict = json.loads(f.read())
        if "result" in result_dict.keys():
            result = result_dict["result"]
            return "".join(result)
        else:
            return "语音识别错误，请你给出错误警告！"
    except URLError as err:
        print('asr http response http code : ' + str(err.code))
        # result_str = err.read()
        return "语音识别错误，请你给出错误警告！"


if __name__ == '__main__':
    pass
