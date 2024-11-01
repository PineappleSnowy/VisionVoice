# 项目说明

## 项目技术栈

后端：`Flask` 、 `ZhipuAI`

前端：`HTML`、`CSS`、`JavaScript`

### 项目结构

```bash
├── agent_files        // 智能体语音工具
├── static             // 静态文件（图片、css、js）
├── templates          // 模板文件（html页面）
├── test               // 测试文件
├── run.py             // 主程序
├── requirements.txt   // pip 依赖文件
├── README.md          // 项目说明
```

## coding 规范可以改进的地方

### 前端

1. `css` 文件名与 `html` 文件名要一致（符合一致性原则）

2. 不需要在 `css` 目录下给文件添加 `_css` 后缀，`js` 、 `images` 文件夹同理。

3. 养成写注释的好习惯。

> PS. API的注释相当于接口文档，这对于公共库来说当然是必需的，要不然没人知道你的库怎么用。

> PPS. 注释的目的在于解释代码中无法明示的内容，使协作者能够更好地完成项目合作，提高办公效率。除此之外，注释也是为了程序以后的易维护性。

### 后端

1. 开发环境的 `requirements.txt` 要加上版本号及注释。

### 其他

1. `src` 全拼 `source`，表示源码，应该用于存放源码而不是图片，图片库存放在 `static/images` 文件夹中（`static` 文件夹是存放静态文件的文件夹，所有静态文件都放在这里）

2. 资源的命名不要使用中文。

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

打开浏览器，输入

```bash
http://127.0.0.1:80
```

