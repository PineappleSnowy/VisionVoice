from zhipuai import ZhipuAI
import base64

client = ZhipuAI(api_key="c0f4c4e1ba81db454375418d085e29aa.8H9MDrsb1wS4NxXw") # 填写您自己的APIKey
img_path = r"back-end\user_images\CaraLin\album\images\20250206125847_0_26363.jpg"
with open(img_path, 'rb') as img_file:
        img_base = base64.b64encode(img_file.read()).decode('utf-8')
prompt = "你是一名乐于助人的助手，请你充分捕捉照片信息，用生动的语言向你的盲人朋友描述这张照片。"
response = client.chat.completions.create(
    model="glm-4v",  # 填写需要调用的模型名称
    messages=[
       {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": prompt
          },
          {
            "type": "image_url",
            "image_url": {
                "url" : img_base
            }
          }
        ]
      }
    ]
)
print(response.choices[0].message.content)