![视界之声logo](back-end\static\images\visionvoice_logo.jpg)

# 视界之声

## 摘要

视界之声 V4.0 是一款帮助视障人士拍照和出行、寻物的无障碍软件，是生活中的贴心助手。通过人脸检测、语音识别和语音播报等高新技术，帮助用户完成自拍、场景识别和环境检测等功能。

## 开放源码许可证

本项目采用以下开放源码许可证发布：



## 软件基本信息

- **作品标题**：视界之声 VisionVoice
- **版本**：5.0.1
- **作者/团队**：西安电子科技大学 PineappleSnowy 团队（寒菠创想团队）
- **联系方式**：hdgong2766@qq.com

## 作品概述

### 背景及应用领域

帮助视障人士进行日常生活中的出行、寻物及等活动，并提供一定情绪价值。

### 功能描述

- **核心功能**：
  - 智能体：提供聊天互动、专业知识问答和情感交流
  - 辅助避障：分析周围环境，解算距离类别信息，帮助避开障碍物
  - 环境识别：实时得到环境的细节描述
  - 帮我寻物：通过手机摄像头寻找物品
- **附加功能**：无

### 体系结构和关键技术点

- **目录结构**

  ```sh
  .
  ├── backend # 服务端
  │   ├── .cache                  # 缓存文件目录
  │   ├── agent_files             # AI 业务逻辑处理文件
  │   ├── configs                 # 配置文件目录
  │   │   └── audio_settings.json # 语音配置文件
  │   ├── lib                     # 核心库文件
  │   │   └── logging.py          # 日志记录
  │   ├── static                  # 静态资源文件
  │   │   ├── css
  │   │   ├── js
  │   │   └── images
  │   ├── templates               # html 模板文件
  │   ├── test                    # 测试用例目录
  │   │   ├── test_ai.py 
  │   │   └── test_image.py 
  │   ├── user_images             # 用户图片存储
  │   ├── .gitignore              # Git 忽略文件
  │   ├── gunicorn_config.py      # Gunicorn 配置
  │   ├── README.md               # 后端说明文档
  │   ├── requirements.txt        # 依赖包列表
  │   ├── run_forever.sh          # 持续运行脚本
  │   └── run.py                  # 主程序入口
  └── frontend                    # 客户端
      ├── VisionVoiceProject      # 蓝河手机端项目
      │   ├── README.md
      │   ├── package.json
      │   ├── pnpm-lock.yaml
      │   ├── .quickapp.preview.json
      │   ├── .prettierignore
      │   ├── .gitignore
      │   └── src
      │       ├── assets
      │       ├── helpers
      │       ├── IntroCard
      │       ├── app.ux
      │       ├── sitemap.json
      │       ├── manifest.json
      │       └── pages
      │           └── Home
      │               └── index.ux # 主页面：主要使用 webView 实现蓝河快应用移动端适配
      └── README.md
  ```

- **技术栈**

  - 前端：蓝河系统手机应用
  - 后台：Python 的 Flask 框架

- **关键技术**：

  - 蓝河应用调用服务端接口识别图片
  - 服务端使用 Python 调用 AI 能力返回给客户端

## 创新点

## 如何运行

### 安装方式

### 使用说明
请参照backend/static/api_template.json的样式添加api_key等信息，并将api_template.json重名为api.json以正确运行程序。

## 致谢

感谢所有为本项目做出贡献的开发者！团队信息请访问：
https://github.com/PineappleSnowy/

---

版权所有 © 2024 西安电子科技大学 PineappleSnowy 团队. 保留所有权利。
