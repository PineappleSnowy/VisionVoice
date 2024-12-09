# 快应用示例模版

## 文件结构

```
├── sign                # 存储 rpk 包签名模块;
│   ├── certificate.pem # 证书文件
│   └── private.pem     # 私钥文件
└── src
│   ├── assets          # 公用的资源(images/styles/字体...)
│   │   ├──images       # 存储 png/jpg/svg 等公共图片资源
│   │   └──styles       # 存放 less/css/sass 等公共样式资源
│   │   └──js           # 存储公共 javaScript 代码资源
│   │   └──iconfont     # 存放图标字体
│   ├── CardDemo        # 快应用卡片示例页面
│   ├── helper          # 项目自定义辅助各类工具
│   │   ├──ajax.js      # 对系统提供的 fetch api 进行链式封装
│   │   └──utils        # 存放项目所封装的工具类方法
│   ├── pages           # 统一存放项目页面级代码
│   ├── app.ux          # 应用程序代码的人口文件
│   ├── manifest.json   # 配置快应用基本信息
│   └── components      # 存放快应用组件
└── package.json        # 定义项目需要的各种模块及配置信息
```

### 如果需要轻粒子统计功能服务

首先需要前往轻粒子官网注册, 在创建应用之后可以获得 app_key，然后需要在 `/src/assets/js/statistics.config.js` 文件中配置好自己的 app_key。

### 模版说明

本项目为快应用模版（含卡片，`CardDemo` 目录）。

- `Demo` 页面：示例页面；
- `DemoDetail`页面：详情页面；

`CardDemo` 页面：快应用卡片示例页面，快应用卡片开发各厂商的实现方式不同，需到各个厂商的开发者平台查看具体文档。

## 如何使用

推荐下载[快应用开发工具](https://www.quickapp.cn/docCenter/IDEPublicity)，可以进行扫码调试 / USB 调试，还有模拟器预览、语法提示等功能。使用方法，请参见[快应用开发工具文档](https://doc.quickapp.cn/tutorial/ide/overview.html)。

-  **更优雅的处理数据请求**；采用 `Promise` 对系统内置请求 `@system.fetch` 进行封装，并抛出至全局，使得可以极简的进行链式调用，并能够使用  `finally`；

-  **内置样式处理方案**；「快应用」支持 `less`, `sass` 的预编译；这里采取 [dart sass](https://sass-lang.com/documentation) 方案，并内置了部分变量，以及常用混合方法，使得可以轻松开启样式编写、复用、修改等；

-  **封装常用方法**；在 `helper/utils` 路径下，有对日期、字符串、系统等常用方法，分别进行封装，统一暴露给 `global.$utils`，使得维护方式更加合理且健壮，同时又可以便捷的使用，高效开发；当然，你也可以根据需要自行增删、抑或扩展；

-  **添加新增页面命令脚本**；如果需要新建页面，只需运行：`yarn gen YourPageName` ，当然，也可以根据需要，自行定定制模板：*/command/gen/template.ux*；

-  **集成 [Prettier](https://prettier.io/) & [Eslint](https://eslint.org/)**；在检测代码中潜在问题的同时，统一团队代码规范、风格（`js`，`less`，`scss`等），从而促使写出高质量代码，以提升工作效率(尤其针对团队开发)；

-  **新增文件监听命令**：引入 [onchange](https://github.com/Qard/onchange) 依赖来监听文件变化；开发时，运行 `yarn prettier-watch` 命令，即可对所修改的 `*.ux` `*.js` 等文件，进行 **Prettier** 格式化，从而大幅度提升编写效率；

## 内置命令

强烈推荐使用[快应用开发工具](https://www.quickapp.cn/docCenter/IDEPublicity)，进行快应用开发；当然，如果您喜欢命令行，本模版也内置了些常用命令，供您参考：

|  命令 | 描述  | 备注 |
|---|---|---|
| `yarn start`  | 开启服务(server)和监听(watch) | 如不嫌麻烦，可使用，不推荐 | 
| `yarn server`  | 开启服务(server)  | 如不嫌麻烦，可使用，不推荐 |
| `yarn watch`  | 开启监听(watch)  | 如不嫌麻烦，可使用，不推荐 |
| `yarn build ` | 编译打包，生成 `rpk`包  | 对内置 `hap build` 命令的转接 |
| `yarn release ` | 生成 `rpk`包并增加签名  | 对内置 `hap release` 命令的转接  |
| `yarn gen `  | 新增「快应用」页面 | 助你高效生成页面，模版可自定义，推荐 ✓|
| `yarn prettier`  | 一键美化代码(js/css/less/ux)  | 实在是团队开发好帮手，推荐 ✓ |
| `yarn prettier-watch`  | 对变化代码文件格式、实时美化 | 极大提升代码编写效率，强烈推荐 ✔️|
