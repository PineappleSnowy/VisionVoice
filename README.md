# 项目说明

**技术栈：**

后端：`Flask` 、 `ZhipuAI`

前端：`HTML`、`CSS`、`JavaScript`

**项目结构：**

```bash
├── agent_files        // 智能体语音工具
├── static             // 静态文件（图片、css、js）
├── templates          // 模板文件（html页面）
├── test               // 测试文件
├── run.py             // 主程序
├── requirements.txt   // pip 依赖文件
├── README.md          // 项目说明
```

## 一些 coding 规范

### 前端

1. 静态资源文件夹（css、js）内的文件名与 `html` 文件名要一一对应（符合一致性原则）

2. 不需要在 `css` 目录下给文件添加 `_css` 后缀，`js` 、 `images` 文件夹同理。

3. 养成写注释的好习惯。

> 注释的目的在于解释代码中无法明示的内容，使协作者能够更好地完成项目合作，提高办公效率。除此之外，注释也是为了程序以后的易维护性。

### 后端

1. 开发环境的 `requirements.txt` 要加上版本号、不加注释，因为不同版本之间可能具有兼容性的差异，而加注释可能无法进行 `pip install`。

### 其他

1. `src` 全拼 `source`，表示源码，应该用于存放源码，图片一般存放在 `static/images` 文件夹中（`static` 文件夹是存放静态文件的文件夹，所有静态文件都放在这里）

2. 资源的命名请不要使用中文，因为有些系统可能不支持包含中文的文件路径。

# 快速开始

在根目录打开终端，进行如下操作：

1. 安装依赖

```bash

pip install -r requirements.txt

```

2. 运行项目

```bash

python run.py

```

3. 访问项目

   打开浏览器，访问本地 80 端口

```bash

http://127.0.0.1:80

```
