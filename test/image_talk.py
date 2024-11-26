"""智谱视觉模型测试"""

from zhipuai import ZhipuAI
import json

with open("./static/api.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    api_key_zhipu = data["zhipu"]["api_key"]
    client = ZhipuAI(api_key=api_key_zhipu)

response = client.chat.completions.create(
    model="glm-4v-plus",  # 填写需要调用的模型名称
    messages=[
      {
          "content": [
              {
                  "image_url": {
                      "url": "https://swanhub.co/Dawn/MyImageSource/blob/master/IRobotWinterStudyReport/md_d2l.jpg"
                  },
                  "type": "image_url"
              },
              {
                  "text": "图中有什么",
                  "type": "text"
              }
          ],
          "role": "user"
      },
      {
          "content": [
              {
                  "text": "这是一幅描绘自然风景的画，展现了一片宁静的湖泊，湖水呈现出深浅不一的蓝绿色调。湖边长着一棵盛开的樱花树，粉白色的花朵在阳光下显得格外鲜艳。树下有一位身穿蓝色衣服的人坐在船上，似乎正在享受这美好的时光。\n\n背景是连绵起伏的山脉，山体被绿色的植被覆盖，山顶则被云雾缭绕，增添了几分神秘感。远处还可以看到一座小亭子，它坐落在湖边的岩石上，与周围的自然环境和谐相融。\n\n整个画面给人一种宁静、和谐的感觉，仿佛置身于一个世外桃源之中。",
                  "type": "text"
              }
          ],
          "role": "assistant"
      },
      {
          "content": [
              {
                  "image_url": {
                      "url": "https://swanhub.co/Dawn/MyImageSource/blob/master/IRobotWinterStudyReport/md_Infantry-main.png"
                  },
                  "type": "image_url"
              },
              {
                  "text": "这个图与上面图有什么不一样",
                  "type": "text"
              }
          ],
          "role": "user"
      }
    ]
)
print(response.choices[0].message)