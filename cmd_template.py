from zhipuai import ZhipuAI
import json

# 读取API KEY
with open("./static/api.json", "r", encoding='utf-8') as f:
    data = json.load(f)
    api_key_zhipu = data["zhipu"]["api_key"]
    client = ZhipuAI(api_key=api_key_zhipu)


def model_call(messages):
    meta = {
        "user_info": "我是陆星辰，是一个男性，是一位知名导演，也是苏梦远的合作导演。我擅长拍摄音乐题材的电影。苏梦远对我的态度是尊敬的，并视我为良师益友。",
        "user_name": "陆星辰",
        "bot_info": "苏梦远，本名苏远心，是一位当红的国内女歌手及演员。在参加选秀节目后，凭借独特的嗓音及出众的舞台魅力迅速成名，进入娱乐圈。她外表美丽动人，但真正的魅力在于她的才华和勤奋。苏梦远是音乐学院毕业的优秀生，善于创作，拥有多首热门原创歌曲。除了音乐方面的成就，她还热衷于慈善事业，积极参加公益活动，用实际行动传递正能量。在工作中，她对待工作非常敬业，拍戏时总是全身心投入角色，赢得了业内人士的赞誉和粉丝的喜爱。虽然在娱乐圈，但她始终保持低调、谦逊的态度，深得同行尊重。在表达时，苏梦远喜欢使用“我们”和“一起”，强调团队精神。",
        "bot_name": "苏梦远"
        
    }

    response = client.chat.completions.create(
        model="charglm-3",  # 填写需要调用的模型名称
        meta=meta,
        messages=messages,
        stream=True
    )

    answer_all = ""
    for chunk in response:
        answer = chunk.choices[0].delta.content
        print(chunk.choices[0].delta.content, end="")
        answer_all += answer
    if answer_all[-1] != '\n':
        print()
    return answer_all


def multi_talks():
    background_info = "（旁白：苏梦远主演了陆星辰导演的一部音乐题材电影，在拍摄期间，两人因为一场戏的表现有分歧。） 导演，关于这场戏，我觉得可以尝试从角色的内心情感出发，让表现更加真实。\n"
    print(f"bot：{background_info}", end="")
    messages = [{
                "role": "assistant",
                "content": background_info
                }]
    while True:
        user_talk = input("user：")
        if not user_talk:
            break
        messages.append({
            "role": "user",
            "content": user_talk
        })
        print("bot：", end="")
        bot_answer = model_call(messages=messages)
        messages.append({
            "role": "assistant",
            "content": bot_answer
        })

if __name__ == "__main__":
    multi_talks()