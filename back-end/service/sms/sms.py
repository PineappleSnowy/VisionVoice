import os

from alibabacloud_dysmsapi20170525.client import Client as Dysmsapi20170525Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dysmsapi20170525 import models as dysmsapi_20170525_models
from alibabacloud_tea_util import models as util_models

import random
import json
import time

try:
    module_dir = os.path.dirname(__file__)
    json_path = os.path.join(module_dir, '..', '..', 'static', 'api.json')
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        ALIBABA_CLOUD_ACCESS_KEY_ID = data["alibaba"]["access_key_id"]
        ALIBABA_CLOUD_ACCESS_KEY_SECRET = data["alibaba"]["access_key_secret"]
except Exception as e:
    print(f"加载sms配置失败: {e}")


def create_client() -> Dysmsapi20170525Client:
    """
    使用AK&SK初始化账号Client
    @return: Client
    """
    config = open_api_models.Config(
        access_key_id=ALIBABA_CLOUD_ACCESS_KEY_ID,
        access_key_secret=ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    )
    config.endpoint = "dysmsapi.aliyuncs.com"
    return Dysmsapi20170525Client(config)


def send_verification_code(phone_number: str) -> str:
    """
    发送验证码到指定手机号
    @return: 验证码
    """
    client = create_client()
    code = str(random.randint(100000, 999999))


    template_param = {"code": code}

    send_sms_request = dysmsapi_20170525_models.SendSmsRequest(
        phone_numbers=phone_number,
        sign_name="视界之声",
        template_code="SMS_311655442",
        template_param=json.dumps(template_param),
    )

    try:
        response = client.send_sms_with_options(
            send_sms_request, util_models.RuntimeOptions()
        )
        if response.body.code == "OK":
            return code
        else:
            raise Exception(response.body.message)
    except Exception as error:
        raise Exception(f"验证码发送失败: {str(error)}")


def store_verification_code(phone_number: str, code: str, usage: str, verification_code_dict: dict):
    """存储验证码和时间戳"""
    try:
        with open("./configs/verification_code_dict.json", "r") as f:
            verification_code_dict = json.load(f)
    except Exception as e:
        verification_code_dict = {}

    verification_code_dict[phone_number] = {
        "code": code,
        "timestamp": time.time(),  # 当前时间戳
        "usage": usage,
    }

    with open("./configs/verification_code_dict.json", "w") as f:
        json.dump(verification_code_dict, f)


def verify_code(phone_number: str, code: str, verification_code_dict: dict) -> bool:

    """
    验证手机验证码
    返回: (bool) 验证是否通过
    """
    stored_data = verification_code_dict.get(phone_number)
    if not stored_data:
        return False


    # 检查是否在5分钟内
    if time.time() - stored_data["timestamp"] > 300:  # 300秒 = 5分钟
        # 删除过期验证码
        verification_code_dict.pop(phone_number, None)
        return False


    return stored_data["code"] == code
