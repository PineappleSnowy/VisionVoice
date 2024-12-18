/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject&cacheDirectory&plugins[]=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\dsl-xvm\\lib\\loaders\\babel-plugin-jsx.js&comments=false&configFile=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\packager\\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/pages/Login/index.ux?uxType=page":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\code\python\Visionvoice\front-end\VisionVoiceProject&cacheDirectory&plugins[]=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\dsl-xvm\lib\loaders\babel-plugin-jsx.js&comments=false&configFile=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\packager\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/pages/Login/index.ux?uxType=page ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = function __scriptModule__ (module, exports, $app_require$){"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _system = _interopRequireDefault($app_require$("@app-module/system.router"));
var _fileUtils = _interopRequireDefault(__webpack_require__(/*! ../../helper/fileUtils */ "./src/helper/fileUtils.js"));
var _storageUtils = _interopRequireDefault(__webpack_require__(/*! ../../helper/storageUtils */ "./src/helper/storageUtils.js"));
var _secretUtils = _interopRequireDefault(__webpack_require__(/*! ../../helper/secretUtils */ "./src/helper/secretUtils.js"));
var _utils = _interopRequireDefault(__webpack_require__(/*! ../../helper/utils */ "./src/helper/utils.js"));
var _system2 = _interopRequireDefault($app_require$("@app-module/system.notification"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = exports.default = {
  data: {
    loginUsername: "",
    loginPassword: "",
    registerUsername: "",
    registerNickname: "",
    registerPassword: "",
    registerConfirmPassword: "",
    isLoginVisible: true
  },
  handleLoginVisible() {
    this.isLoginVisible = !this.isLoginVisible;
  },
  async handleLogin() {
    console.log("handleLogin");
    _storageUtils.default.getData("loginUsername");
    _storageUtils.default.getData("loginPassword");
    console.log(`username: ${this.loginUsername}\n password: ${this.loginPassword}`);
    _storageUtils.default.saveData("loginUsername", this.loginUsername);
    _storageUtils.default.saveData("loginPassword", this.loginPassword);
    if (!this.loginUsername || !this.loginPassword) {
      console.log("用户名和密码不能为空");
      _utils.default.showToast("用户名和密码不能为空");
      return;
    }
    try {
      const encryptedPassword = await (0, _secretUtils.default)(this.loginPassword);
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.loginUsername,
          password: encryptedPassword
        })
      });
      const data = await response.json();
      if (data.code === 200) {
        _storageUtils.default.saveData("token", data.access_token);
        _storageUtils.default.saveData("username", this.loginUsername);
        _storageUtils.default.saveData("nickname", data.user_info.nickname);
        _system.default.push({
          uri: "/pages/Content",
          params: {
            ___PARAM_PAGE_ANIMATION___: {
              openEnter: 'none',
              closeEnter: 'slide',
              openExit: 'slide',
              closeExit: 'slide'
            }
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
};
const moduleOwn = exports.default || module.exports;
const accessors = ['public', 'protected', 'private'];
if (moduleOwn.data && accessors.some(function (acc) {
  return moduleOwn[acc];
})) {
  throw new Error('页面VM对象中的属性data不可与"' + accessors.join(',') + '"同时存在，请使用private替换data名称');
} else if (!moduleOwn.data) {
  moduleOwn.data = {};
  moduleOwn._descriptor = {};
  accessors.forEach(function (acc) {
    const accType = typeof moduleOwn[acc];
    if (accType === 'object') {
      moduleOwn.data = Object.assign(moduleOwn.data, moduleOwn[acc]);
      for (const name in moduleOwn[acc]) {
        moduleOwn._descriptor[name] = {
          access: acc
        };
      }
    } else if (accType === 'function') {
      console.warn('页面VM对象中的属性' + acc + '的值不能是函数，请使用对象');
    }
  });
}}

/***/ }),

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./src/pages/Login/index.ux?uxType=page":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./src/pages/Login/index.ux?uxType=page ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = {
  ".wrapper": {
    "justifyContent": "center",
    "alignItems": "center",
    "boxSizing": "border-box",
    "backgroundImage": "/assets/images/background.jpg",
    "backgroundSize": "cover"
  },
  ".input-group": {
    "flexDirection": "column",
    "marginBottom": "45px"
  },
  "label": {
    "display": "flex",
    "color": "#ffffff",
    "marginBottom": "9.9px"
  },
  "input": {
    "width": "100%",
    "paddingTop": "19.8px",
    "paddingRight": "19.8px",
    "paddingBottom": "19.8px",
    "paddingLeft": "19.8px",
    "borderTopWidth": "1px",
    "borderRightWidth": "1px",
    "borderBottomWidth": "1px",
    "borderLeftWidth": "1px",
    "borderStyle": "solid",
    "borderTopColor": "rgba(255,255,255,0.1)",
    "borderRightColor": "rgba(255,255,255,0.1)",
    "borderBottomColor": "rgba(255,255,255,0.1)",
    "borderLeftColor": "rgba(255,255,255,0.1)",
    "borderRadius": "5px",
    "backgroundColor": "rgba(255,255,255,0.1)",
    "color": "#ffffff",
    "fontSize": "30px",
    "outline:focus": "none",
    "borderTopColor:focus": "#5b61b9",
    "borderRightColor:focus": "#5b61b9",
    "borderBottomColor:focus": "#5b61b9",
    "borderLeftColor:focus": "#5b61b9"
  },
  ".login-container": {
    "flexDirection": "column",
    "backgroundColor": "rgba(33,31,31,0.8)",
    "paddingTop": "30px",
    "paddingRight": "30px",
    "paddingBottom": "30px",
    "paddingLeft": "30px",
    "borderRadius": "10px",
    "width": "540px",
    "backdropFilter": "blur(10px)",
    "boxShadow": "0 2px 10px rgba(0, 0, 0, 0.2)"
  },
  ".register-container": {
    "flexDirection": "column",
    "backgroundColor": "rgba(33,31,31,0.8)",
    "paddingTop": "30px",
    "paddingRight": "30px",
    "paddingBottom": "30px",
    "paddingLeft": "30px",
    "borderRadius": "10px",
    "width": "540px",
    "backdropFilter": "blur(10px)",
    "boxShadow": "0 2px 10px rgba(0, 0, 0, 0.2)"
  },
  ".login-container .title": {
    "color": "#ffffff",
    "textAlign": "center",
    "fontSize": "45px",
    "marginBottom": "45px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "title"
        }
      ]
    }
  },
  ".register-container .title": {
    "color": "#ffffff",
    "textAlign": "center",
    "fontSize": "45px",
    "marginBottom": "45px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "title"
        }
      ]
    }
  },
  ".login-container #login_button": {
    "width": "100%",
    "paddingTop": "12px",
    "paddingRight": "12px",
    "paddingBottom": "12px",
    "paddingLeft": "12px",
    "backgroundColor": "#5b61b9",
    "color": "#FFFFFF",
    "borderRadius": "5px",
    "cursor": "pointer",
    "fontSize": "45px",
    "marginBottom": "30px",
    "textAlign": "center",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "id",
          "i": false,
          "a": "equals",
          "v": "login_button"
        }
      ]
    }
  },
  ".register-container #login_button": {
    "width": "100%",
    "paddingTop": "12px",
    "paddingRight": "12px",
    "paddingBottom": "12px",
    "paddingLeft": "12px",
    "backgroundColor": "#5b61b9",
    "color": "#FFFFFF",
    "borderRadius": "5px",
    "cursor": "pointer",
    "fontSize": "45px",
    "marginBottom": "30px",
    "textAlign": "center",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "id",
          "i": false,
          "a": "equals",
          "v": "login_button"
        }
      ]
    }
  },
  ".login-container #register_button": {
    "width": "100%",
    "paddingTop": "12px",
    "paddingRight": "12px",
    "paddingBottom": "12px",
    "paddingLeft": "12px",
    "backgroundColor": "#5b61b9",
    "color": "#FFFFFF",
    "borderRadius": "5px",
    "cursor": "pointer",
    "fontSize": "45px",
    "marginBottom": "30px",
    "textAlign": "center",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "id",
          "i": false,
          "a": "equals",
          "v": "register_button"
        }
      ]
    }
  },
  ".register-container #register_button": {
    "width": "100%",
    "paddingTop": "12px",
    "paddingRight": "12px",
    "paddingBottom": "12px",
    "paddingLeft": "12px",
    "backgroundColor": "#5b61b9",
    "color": "#FFFFFF",
    "borderRadius": "5px",
    "cursor": "pointer",
    "fontSize": "45px",
    "marginBottom": "30px",
    "textAlign": "center",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "id",
          "i": false,
          "a": "equals",
          "v": "register_button"
        }
      ]
    }
  },
  ".login-container .login-link": {
    "textAlign": "center",
    "color": "#ffffff",
    "marginTop": "0px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "fontSize": "30px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-link"
        }
      ]
    }
  },
  ".register-container .login-link": {
    "textAlign": "center",
    "color": "#ffffff",
    "marginTop": "0px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "fontSize": "30px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-link"
        }
      ]
    }
  },
  ".login-container .register-link": {
    "textAlign": "center",
    "color": "#ffffff",
    "marginTop": "0px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "fontSize": "30px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-link"
        }
      ]
    }
  },
  ".register-container .register-link": {
    "textAlign": "center",
    "color": "#ffffff",
    "marginTop": "0px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "fontSize": "30px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-link"
        }
      ]
    }
  },
  ".login-container .login-link a": {
    "color": "#5b61b9",
    "textDecoration": "none",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-link"
        },
        {
          "t": "d"
        },
        {
          "t": "t",
          "n": "a"
        }
      ]
    }
  },
  ".register-container .login-link a": {
    "color": "#5b61b9",
    "textDecoration": "none",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-link"
        },
        {
          "t": "d"
        },
        {
          "t": "t",
          "n": "a"
        }
      ]
    }
  },
  ".login-container .register-link a": {
    "color": "#5b61b9",
    "textDecoration": "none",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "login-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-link"
        },
        {
          "t": "d"
        },
        {
          "t": "t",
          "n": "a"
        }
      ]
    }
  },
  ".register-container .register-link a": {
    "color": "#5b61b9",
    "textDecoration": "none",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-container"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "register-link"
        },
        {
          "t": "d"
        },
        {
          "t": "t",
          "n": "a"
        }
      ]
    }
  },
  ".message": {
    "textAlign": "center",
    "marginBottom": "10px",
    "paddingTop": "5px",
    "paddingRight": "5px",
    "paddingBottom": "5px",
    "paddingLeft": "5px",
    "borderRadius": "4px"
  }
}

/***/ }),

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./src/pages/Login/index.ux?uxType=page&":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./src/pages/Login/index.ux?uxType=page& ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = {
  "type": "div",
  "attr": {},
  "classList": [
    "wrapper"
  ],
  "children": [
    {
      "type": "div",
      "attr": {
        "role": "form",
        "ariaLabel": "登录表单"
      },
      "classList": [
        "login-container"
      ],
      "shown": function () {return this.isLoginVisible},
      "children": [
        {
          "type": "text",
          "attr": {
            "value": "欢迎登录"
          },
          "classList": [
            "title"
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "input-group"
          ],
          "children": [
            {
              "type": "label",
              "attr": {
                "target": "username",
                "ariaLabel": "用户名",
                "value": "用户名:"
              }
            },
            {
              "type": "input",
              "attr": {
                "type": "text",
                "placeholder": "请输入用户名",
                "id": "username",
                "value": function () {return this.loginUsername},
                "ariaLabel": "请输入用户名"
              },
              "id": "username",
              "events": {
                "change": function(evt) {this.loginUsername = evt.target.value}
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "input-group",
            "password"
          ],
          "children": [
            {
              "type": "label",
              "attr": {
                "target": "password",
                "ariaLabel": "密码",
                "value": "密码:"
              }
            },
            {
              "type": "input",
              "attr": {
                "type": "password",
                "placeholder": "请输入密码",
                "id": "password",
                "value": function () {return this.loginPassword},
                "ariaLabel": "请输入密码"
              },
              "id": "password",
              "events": {
                "change": function(evt) {this.loginPassword = evt.target.value}
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {
            "id": "login_message"
          },
          "classList": [
            "message"
          ],
          "id": "login_message",
          "style": {
            "display": "none"
          }
        },
        {
          "type": "text",
          "attr": {
            "id": "login_button",
            "ariaLabel": "登录",
            "value": "登录"
          },
          "id": "login_button",
          "events": {
            "click": "handleLogin"
          }
        },
        {
          "type": "text",
          "attr": {},
          "classList": [
            "register-link"
          ],
          "children": [
            {
              "type": "span",
              "attr": {
                "value": " 还没有账号？"
              }
            },
            {
              "type": "a",
              "attr": {
                "id": "go_to_register",
                "value": "点击注册"
              },
              "id": "go_to_register",
              "events": {
                "click": "handleLoginVisible"
              }
            }
          ]
        }
      ]
    },
    {
      "type": "div",
      "attr": {
        "role": "form",
        "ariaLabel": "注册表单"
      },
      "classList": [
        "register-container"
      ],
      "shown": function () {return !(this.isLoginVisible)},
      "children": [
        {
          "type": "text",
          "attr": {
            "value": "用户注册"
          },
          "classList": [
            "title"
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "input-group"
          ],
          "children": [
            {
              "type": "label",
              "attr": {
                "target": "register_username",
                "ariaLabel": "用户名",
                "value": "用户名:"
              }
            },
            {
              "type": "input",
              "attr": {
                "type": "text",
                "placeholder": "请输入用于登录的用户名",
                "id": "register_username",
                "value": function () {return this.registerUsername},
                "ariaLabel": "请输入用于登录的用户名"
              },
              "id": "register_username",
              "events": {
                "change": function(evt) {this.registerUsername = evt.target.value}
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "input-group"
          ],
          "children": [
            {
              "type": "label",
              "attr": {
                "target": "register_nickname",
                "ariaLabel": "昵称",
                "value": "昵称:"
              }
            },
            {
              "type": "input",
              "attr": {
                "type": "text",
                "placeholder": "请输入用于显示的昵称",
                "id": "register_nickname",
                "value": function () {return this.registerNickname},
                "ariaLabel": "请输入用于显示的昵称"
              },
              "id": "register_nickname",
              "events": {
                "change": function(evt) {this.registerNickname = evt.target.value}
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "input-group"
          ],
          "children": [
            {
              "type": "label",
              "attr": {
                "target": "register_password",
                "ariaLabel": "密码",
                "value": "密码:"
              }
            },
            {
              "type": "input",
              "attr": {
                "type": "password",
                "placeholder": "请输入密码",
                "id": "register_password",
                "value": function () {return this.registerPassword},
                "ariaLabel": "请输入密码"
              },
              "id": "register_password",
              "events": {
                "change": function(evt) {this.registerPassword = evt.target.value}
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "input-group"
          ],
          "children": [
            {
              "type": "label",
              "attr": {
                "target": "register_confirm_password",
                "ariaLabel": "确认密码",
                "value": "确认密码:"
              }
            },
            {
              "type": "input",
              "attr": {
                "type": "password",
                "placeholder": "请再次输入密码",
                "id": "register_confirm_password",
                "value": function () {return this.registerConfirmPassword},
                "ariaLabel": "请再次输入密码"
              },
              "id": "register_confirm_password",
              "events": {
                "change": function(evt) {this.registerConfirmPassword = evt.target.value}
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {
            "id": "register_message"
          },
          "classList": [
            "message"
          ],
          "id": "register_message",
          "style": {
            "display": "none"
          }
        },
        {
          "type": "text",
          "attr": {
            "id": "register_button",
            "ariaLabel": "注册",
            "value": "注册"
          },
          "id": "register_button"
        },
        {
          "type": "text",
          "attr": {},
          "classList": [
            "login-link"
          ],
          "children": [
            {
              "type": "span",
              "attr": {
                "value": " 已有账号？"
              }
            },
            {
              "type": "a",
              "attr": {
                "id": "back_to_login",
                "value": "返回登录"
              },
              "id": "back_to_login",
              "events": {
                "click": "handleLoginVisible"
              }
            }
          ]
        }
      ]
    }
  ]
}

/***/ }),

/***/ "./src/helper/fileUtils.js":
/*!*********************************!*\
  !*** ./src/helper/fileUtils.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _system = _interopRequireDefault($app_require$("@app-module/system.file"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function writeText(text) {
  _system.default.writeText({
    uri: "internal://cache/path/userInfo.txt",
    text: text,
    success: function (data) {
      console.log("[writeText] success write text: ", text);
    },
    fail: function (data, code) {
      console.log("[writeText] failed to write text: ", data, code);
    }
  });
}
function readText() {
  _system.default.readText({
    uri: "internal://cache/path/userInfo.txt",
    success: function (data) {
      console.log("[readText] success read text: ", data.text);
      return data.text;
    },
    fail: function (data, code) {
      console.log("[readText] failed to read text: ", data, code);
      return null;
    }
  });
}
var _default = exports["default"] = {
  writeText,
  readText
};

/***/ }),

/***/ "./src/helper/secretUtils.js":
/*!***********************************!*\
  !*** ./src/helper/secretUtils.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
/**

 *

 * Secure Hash Algorithm (SHA256)

 * http://www.webtoolkit.info/

 *

 * Original code by Angel Marin, Paul Johnston.

 *

 **/

function SHA256(s) {
  var chrsz = 8;
  var hexcase = 0;
  function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return msw << 16 | lsw & 0xFFFF;
  }
  function S(X, n) {
    return X >>> n | X << 32 - n;
  }
  function R(X, n) {
    return X >>> n;
  }
  function Ch(x, y, z) {
    return x & y ^ ~x & z;
  }
  function Maj(x, y, z) {
    return x & y ^ x & z ^ y & z;
  }
  function Sigma0256(x) {
    return S(x, 2) ^ S(x, 13) ^ S(x, 22);
  }
  function Sigma1256(x) {
    return S(x, 6) ^ S(x, 11) ^ S(x, 25);
  }
  function Gamma0256(x) {
    return S(x, 7) ^ S(x, 18) ^ R(x, 3);
  }
  function Gamma1256(x) {
    return S(x, 17) ^ S(x, 19) ^ R(x, 10);
  }
  function core_sha256(m, l) {
    var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
    var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
    m[l >> 5] |= 0x80 << 24 - l % 32;
    m[(l + 64 >> 9 << 4) + 15] = l;
    for (var i = 0; i < m.length; i += 16) {
      a = HASH[0];
      b = HASH[1];
      c = HASH[2];
      d = HASH[3];
      e = HASH[4];
      f = HASH[5];
      g = HASH[6];
      h = HASH[7];
      for (var j = 0; j < 64; j++) {
        if (j < 16) W[j] = m[j + i];else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
        T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
        T2 = safe_add(Sigma0256(a), Maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = safe_add(d, T1);
        d = c;
        c = b;
        b = a;
        a = safe_add(T1, T2);
      }
      HASH[0] = safe_add(a, HASH[0]);
      HASH[1] = safe_add(b, HASH[1]);
      HASH[2] = safe_add(c, HASH[2]);
      HASH[3] = safe_add(d, HASH[3]);
      HASH[4] = safe_add(e, HASH[4]);
      HASH[5] = safe_add(f, HASH[5]);
      HASH[6] = safe_add(g, HASH[6]);
      HASH[7] = safe_add(h, HASH[7]);
    }
    return HASH;
  }
  function str2binb(str) {
    var bin = Array();
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz) {
      bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << 24 - i % 32;
    }
    return bin;
  }
  function Utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode(c >> 6 | 192);
        utftext += String.fromCharCode(c & 63 | 128);
      } else {
        utftext += String.fromCharCode(c >> 12 | 224);
        utftext += String.fromCharCode(c >> 6 & 63 | 128);
        utftext += String.fromCharCode(c & 63 | 128);
      }
    }
    return utftext;
  }
  function binb2hex(binarray) {
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for (var i = 0; i < binarray.length * 4; i++) {
      str += hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 + 4 & 0xF) + hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 & 0xF);
    }
    return str;
  }
  s = Utf8Encode(s);
  return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
}
var _default = exports["default"] = SHA256;

/***/ }),

/***/ "./src/helper/storageUtils.js":
/*!************************************!*\
  !*** ./src/helper/storageUtils.js ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _system = _interopRequireDefault($app_require$("@app-module/system.storage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// 存储数据
function saveData(key, value) {
  _system.default.set({
    key: key,
    value: value,
    success: function () {
      console.log(`数据保存成功 ${key}:${value}`);
    },
    fail: function (data, code) {
      console.log(`数据保存失败, code = ${code}`);
    }
  });
}

// 获取数据
function getData(key) {
  _system.default.get({
    key: key,
    success: function (data) {
      console.log(`获取的数据: ${key}:${data}`);
      return data;
    },
    fail: function (data, code) {
      console.log(`获取数据失败, code = ${code}`);
      return null;
    }
  });
}

// 删除数据
function deleteData(key) {
  _system.default.delete({
    key: key,
    success: function () {
      console.log(`数据删除成功 ${key}`);
    },
    fail: function (data, code) {
      console.log(`数据删除失败, code = ${code}`);
    }
  });
}

// 清除所有数据
function clearAll() {
  _system.default.clear({
    success: function () {
      console.log('清除所有数据成功');
    },
    fail: function (data, code) {
      console.log(`清除所有数据失败, code = ${code}`);
    }
  });
}
var _default = exports["default"] = {
  saveData,
  getData,
  deleteData,
  clearAll
};

/***/ }),

/***/ "./src/helper/utils.js":
/*!*****************************!*\
  !*** ./src/helper/utils.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
/**
 * 您可以将常用的方法、或系统 API，统一封装，暴露全局，以便各页面、组件调用，而无需 require / import.
 */
const prompt = $app_require$('@app-module/system.prompt');

/**
 * 拼接 url 和参数
 */
function queryString(url, query) {
  let str = [];
  for (let key in query) {
    str.push(key + '=' + query[key]);
  }
  let paramStr = str.join('&');
  return paramStr ? `${url}?${paramStr}` : url;
}
function showToast(message = '', duration = 0) {
  if (!message) return;
  prompt.showToast({
    message: message,
    duration
  });
}
var _default = exports["default"] = {
  showToast,
  queryString
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************************************!*\
  !*** ./src/pages/Login/index.ux?uxType=page ***!
  \**********************************************/

var $app_style$ = __webpack_require__(/*! !../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./index.ux?uxType=page */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./src/pages/Login/index.ux?uxType=page")
var $app_script$ = __webpack_require__(/*! !../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\code\python\Visionvoice\front-end\VisionVoiceProject&cacheDirectory&plugins[]=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\dsl-xvm\lib\loaders\babel-plugin-jsx.js&comments=false&configFile=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\packager\babel.config.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./index.ux?uxType=page */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject&cacheDirectory&plugins[]=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\dsl-xvm\\lib\\loaders\\babel-plugin-jsx.js&comments=false&configFile=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\packager\\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/pages/Login/index.ux?uxType=page")
$app_define$('@app-component/index', [], function($app_require$, $app_exports$, $app_module$) {
     $app_script$($app_module$, $app_exports$, $app_require$)
        if ($app_exports$.__esModule && $app_exports$.default) {
          $app_module$.exports = $app_exports$.default
        }
    $app_module$.exports.template = __webpack_require__(/*! !../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./index.ux?uxType=page& */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./src/pages/Login/index.ux?uxType=page&")
    $app_module$.exports.style = $app_style$;
});
$app_bootstrap$('@app-component/index',{ packagerVersion: "1.9.14" });
})();

/******/ })()
;
//# sourceMappingURL=pages\Login\index.js.map