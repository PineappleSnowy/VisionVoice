(function(){
    
    var createPageHandler = function() {
      return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject&cacheDirectory&plugins[]=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\dsl-xvm\\lib\\loaders\\babel-plugin-jsx.js&comments=false&configFile=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\packager\\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/pages/Content/index.ux?uxType=page":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\code\python\Visionvoice\front-end\VisionVoiceProject&cacheDirectory&plugins[]=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\dsl-xvm\lib\loaders\babel-plugin-jsx.js&comments=false&configFile=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\packager\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/pages/Content/index.ux?uxType=page ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = function __scriptModule__ (module, exports, $app_require$){"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _system = _interopRequireDefault($app_require$("@app-module/system.webview"));
var _fileUtils = _interopRequireDefault(__webpack_require__(/*! ../../helper/fileUtils */ "./src/helper/fileUtils.js"));
var _storageUtils = _interopRequireDefault(__webpack_require__(/*! ../../helper/storageUtils */ "./src/helper/storageUtils.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = exports.default = {
  private: {
    title: '欢迎使用 VisionVoice 快应用'
  },
  onInit() {
    this.$page.setTitleBar({
      text: 'VisionVoice 快应用'
    });
    if (this.$page.setMeta) {
      this.$page.setMeta({
        title: 'VisionVoice 快应用',
        description: '视界之声是一款帮助视障人士拍照和出行、寻物的无障碍软件，是您生活中的贴心助手。'
      });
    }
  },
  onReady() {
    console.log("[onReady] Gettiung storage...");
    _storageUtils.default.getData("loginUsername");
    _storageUtils.default.getData("loginPassword");
  },
  gotoVisionVoice() {
    _system.default.setCookie({
      domain: 'https://pineapplesnowy.cn/',
      name: 'token',
      value: '1234567890',
      maxAge: 3000,
      path: '/',
      success: function () {
        console.log('[webview.setCookie] set cookie success');
      },
      fail: function (e) {
        console.log('[webview.setCookie] set cookie fail');
      }
    });
    _system.default.loadUrl({
      url: 'https://pineapplesnowy.cn/',
      allowthirdpartycookies: true
    });
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

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./src/pages/Content/index.ux?uxType=page":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./src/pages/Content/index.ux?uxType=page ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = {
  ".wrapper": {
    "flexDirection": "column",
    "justifyContent": "center",
    "alignItems": "center"
  },
  ".wrapper .title": {
    "fontSize": "45px",
    "textAlign": "center",
    "color": "#000000",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "wrapper"
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
  ".wrapper .btn": {
    "width": "450px",
    "height": "75px",
    "borderRadius": "45px",
    "backgroundColor": "#09ba07",
    "color": "#ffffff",
    "fontSize": "30px",
    "marginTop": "75px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "wrapper"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "btn"
        }
      ]
    }
  },
  ".navbar": {
    "display": "flex",
    "justifyContent": "space-around",
    "alignItems": "center",
    "color": "#ffffff",
    "height": "120px",
    "paddingTop": "0px",
    "paddingRight": "0px",
    "paddingBottom": "0px",
    "paddingLeft": "0px",
    "position": "fixed",
    "left": "0px",
    "right": "0px",
    "bottom": "0px",
    "backgroundColor": "#44498c"
  },
  ".navbar .nav-item": {
    "flex": 1,
    "display": "flex",
    "justifyContent": "center",
    "alignItems": "center",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "navbar"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "nav-item"
        }
      ]
    }
  },
  ".navbar .nav-item a": {
    "textDecoration": "none",
    "paddingTop": "10px",
    "paddingRight": "10px",
    "paddingBottom": "10px",
    "paddingLeft": "10px",
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "center",
    "color": "#ffffff",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "navbar"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "nav-item"
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
  ".navbar .star-icon": {
    "width": "75px",
    "height": "75px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "navbar"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "star-icon"
        }
      ]
    }
  },
  "@MEDIA": [
    {
      "condition": "screen and (max-width: 333px)",
      ".navbar .navbar a": {
        "fontSize": "0px",
        "paddingTop": "10px",
        "paddingRight": "10px",
        "paddingBottom": "10px",
        "paddingLeft": "10px",
        "width": "45px",
        "height": "45px",
        "_meta": {
          "ruleDef": [
            {
              "t": "a",
              "n": "class",
              "i": false,
              "a": "element",
              "v": "navbar"
            },
            {
              "t": "d"
            },
            {
              "t": "a",
              "n": "class",
              "i": false,
              "a": "element",
              "v": "navbar"
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
      }
    }
  ]
}

/***/ }),

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./src/pages/Content/index.ux?uxType=page&":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./src/pages/Content/index.ux?uxType=page& ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = {
  "type": "div",
  "attr": {},
  "classList": [
    "wrapper"
  ],
  "children": [
    {
      "type": "text",
      "attr": {
        "value": function () {return this.title}
      },
      "classList": [
        "title"
      ]
    },
    {
      "type": "input",
      "attr": {
        "type": "button",
        "value": "开始使用"
      },
      "classList": [
        "btn"
      ],
      "events": {
        "click": "gotoVisionVoice"
      }
    },
    {
      "type": "div",
      "attr": {},
      "classList": [
        "navbar"
      ],
      "children": [
        {
          "type": "div",
          "attr": {},
          "classList": [
            "nav-item"
          ],
          "children": [
            {
              "type": "a",
              "attr": {
                "href": "/agent",
                "value": " 首页 "
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "nav-item"
          ],
          "children": [
            {
              "type": "a",
              "attr": {
                "href": "/chat",
                "value": " 消息 "
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "nav-item"
          ],
          "children": [
            {
              "type": "image",
              "attr": {
                "src": "/assets/images/star.png"
              },
              "classList": [
                "star-icon"
              ]
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "nav-item"
          ],
          "children": [
            {
              "type": "a",
              "attr": {
                "href": "/square",
                "value": " 广场 "
              }
            }
          ]
        },
        {
          "type": "div",
          "attr": {},
          "classList": [
            "nav-item"
          ],
          "children": [
            {
              "type": "a",
              "attr": {
                "href": "/mine",
                "value": " 我的 "
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
/*!************************************************!*\
  !*** ./src/pages/Content/index.ux?uxType=page ***!
  \************************************************/

var $app_style$ = __webpack_require__(/*! !../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./index.ux?uxType=page */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/style-loader.js?index=0&type=style!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/less-loader/dist/cjs.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=style!./src/pages/Content/index.ux?uxType=page")
var $app_script$ = __webpack_require__(/*! !../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\code\python\Visionvoice\front-end\VisionVoiceProject&cacheDirectory&plugins[]=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\dsl-xvm\lib\loaders\babel-plugin-jsx.js&comments=false&configFile=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\packager\babel.config.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./index.ux?uxType=page */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject&cacheDirectory&plugins[]=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\dsl-xvm\\lib\\loaders\\babel-plugin-jsx.js&comments=false&configFile=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\packager\\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/access-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/pages/Content/index.ux?uxType=page")
$app_define$('@app-component/index', [], function($app_require$, $app_exports$, $app_module$) {
     $app_script$($app_module$, $app_exports$, $app_require$)
        if ($app_exports$.__esModule && $app_exports$.default) {
          $app_module$.exports = $app_exports$.default
        }
    $app_module$.exports.template = __webpack_require__(/*! !../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./index.ux?uxType=page& */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/template-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=template!./src/pages/Content/index.ux?uxType=page&")
    $app_module$.exports.style = $app_style$;
});
$app_bootstrap$('@app-component/index',{ packagerVersion: "1.9.14" });
})();

/******/ })()
;
    };
    if (typeof window === "undefined") {
      return createPageHandler();
    }
    else {
      window.createPageHandler = createPageHandler
    }
  })();
//# sourceMappingURL=pages\Content\index.js.map