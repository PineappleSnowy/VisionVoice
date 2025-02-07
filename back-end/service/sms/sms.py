import os
from typing import List

from alibabacloud_dysmsapi20170525.client import Client as Dysmsapi20170525Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dysmsapi20170525 import models as dysmsapi_20170525_models
from alibabacloud_tea_util import models as util_models
from alibabacloud_tea_util.client import Client as UtilClient

import random
import json
import dotenv
import time
try:
    dotenv.load_dotenv()
except Exception as e:
    print(f"加载环境变量失败: {e}")


def create_client() -> Dysmsapi20170525Client:
    """
    使用AK&SK初始化账号Client
    @return: Client
    """
    # 工程代码泄露可能会导致 AccessKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考。
    # 建议使用更安全的 STS 方式，更多鉴权访问方式请参见：https://help.aliyun.com/document_detail/378659.html。
    config = open_api_models.Config(
        # 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID
        access_key_id=os.environ["ALIBABA_CLOUD_ACCESS_KEY_ID"],
        # 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_SECRET
        access_key_secret=os.environ["ALIBABA_CLOUD_ACCESS_KEY_SECRET"],
    )
    # Endpoint 请参考 https://api.aliyun.com/product/Dysmsapi
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


def store_verification_code(phone_number: str, code: str, verification_code_dict: dict):
    """存储验证码和时间戳"""
    verification_code_dict[phone_number] = {
        "code": code,
        "timestamp": time.time(),  # 当前时间戳
    }



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
