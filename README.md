## coding 规范可以改进的地方

### 前端

1. `css` 文件名与 `html` 文件名要一致（一致性）

2. `src` 全拼 `source`，表示源码，应该用于存放代码而不是图片，图片库存放在 `static/images` 文件夹中（`static` 文件夹是存放静态文件的文件夹，所有静态文件都放在这里）

3. 资源的命名不要使用中文。

4. 不需要在 `css` 目录下给文件添加 `_css` 后缀。

### 项目开发

1. 开发环境的 `requirements.txt` 要加上版本号及注释。

## 快速开始

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

```bash
http://127.0.0.1:80
```
