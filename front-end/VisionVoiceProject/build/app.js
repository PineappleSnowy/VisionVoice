/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/manifest-loader.js?path=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject\\src!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject&cacheDirectory&comments=false&configFile=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\packager\\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/app.ux?uxType=app":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/manifest-loader.js?path=d:\code\python\Visionvoice\front-end\VisionVoiceProject\src!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\code\python\Visionvoice\front-end\VisionVoiceProject&cacheDirectory&comments=false&configFile=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\packager\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/app.ux?uxType=app ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = function __scriptModule__ (module, exports, $app_require$){"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const $utils = (__webpack_require__(/*! ./helper/utils */ "./src/helper/utils.js")["default"]);
const $apis = (__webpack_require__(/*! ./helper/apis */ "./src/helper/apis/index.js")["default"]);
const hook2global = __webpack_require__.g.__proto__ || __webpack_require__.g;
hook2global.$utils = $utils;
hook2global.$apis = $apis;
var _default = exports.default = {
  onCreate() {}
};}

/***/ }),

/***/ "./src/helper/ajax.js":
/*!****************************!*\
  !*** ./src/helper/ajax.js ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _system = _interopRequireDefault($app_require$("@app-module/system.fetch"));
var _utils = _interopRequireDefault(__webpack_require__(/*! ./utils */ "./src/helper/utils.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * 封装了一些网络请求方法，方便通过 Promise 的形式请求接口
 */

const TIMEOUT = 20000;
Promise.prototype.finally = function (callback) {
  const P = this.constructor;
  return this.then(value => P.resolve(callback()).then(() => value), reason => P.resolve(callback()).then(() => {
    throw reason;
  }));
};

/**
 * 调用快应用 fetch 接口做网络请求
 * @param params
 */
function fetchPromise(params) {
  return new Promise((resolve, reject) => {
    _system.default.fetch({
      url: params.url,
      method: params.method,
      data: params.data
    }).then(response => {
      const result = response.data;
      const content = JSON.parse(result.data);
      /* @desc: 可跟具体不同业务接口数据，返回你所需要的部分，使得使用尽可能便捷 */
      content.success ? resolve(content.value) : resolve(content.message);
    }).catch((error, code) => {
      console.log(`🐛 request fail, code = ${code}`);
      reject(error);
    }).finally(() => {
      console.log(`✔️ request @${params.url} has been completed.`);
      resolve();
    });
  });
}

/**
 * 处理网络请求，timeout 是网络请求超时之后返回，默认 20s 可自行修改
 * @param params
 */
function requestHandle(params, timeout = TIMEOUT) {
  try {
    return Promise.race([fetchPromise(params), new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('网络状况不太好，再刷新一次？'));
      }, timeout);
    })]);
  } catch (error) {
    console.log(error);
  }
}
var _default = exports["default"] = {
  post: function (url, params) {
    return requestHandle({
      method: 'post',
      url: url,
      data: params
    });
  },
  get: function (url, params) {
    return requestHandle({
      method: 'get',
      url: _utils.default.queryString(url, params)
    });
  },
  put: function (url, params) {
    return requestHandle({
      method: 'put',
      url: url,
      data: params
    });
  }
  // 如果，method 您需要更多类型，可自行添加更多方法；
};

/***/ }),

/***/ "./src/helper/apis/index.js":
/*!**********************************!*\
  !*** ./src/helper/apis/index.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
/**
 * 导出 apis 下目录的所有接口
 */
const files = __webpack_require__("./src/helper/apis sync recursive \\.js");
const modules = {};
files.keys().forEach(key => {
  if (key === './index.js') {
    return;
  }
  modules[key.replace(/(^\.\/|\.js$)/g, '')] = files(key).default;
});
var _default = exports["default"] = modules;

/***/ }),

/***/ "./src/helper/apis/visionvoice.js":
/*!****************************************!*\
  !*** ./src/helper/apis/visionvoice.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _ajax = _interopRequireDefault(__webpack_require__(/*! ../ajax */ "./src/helper/ajax.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * @desc 在实际开发中，您可以将 baseUrl 替换为您的请求地址前缀；
 *
 * 已将 $apis 挂载在 global，您可以通过如下方式，进行调用：
 * $apis.example.getApi().then().catch().finally()
 *
 * 备注：如果您不需要发起请求，删除 apis 目录，以及 app.ux 中引用即可；
 */
const baseUrl = 'https://pineapplesnowy.cn/';
var _default = exports["default"] = {
  login(data) {
    return _ajax.default.get(`${baseUrl}verify-user`, data);
  },
  postOtherApi(data) {
    return _ajax.default.post(`${baseUrl}your-project-api`, data);
  }
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

/***/ }),

/***/ "./src/helper/apis sync recursive \\.js":
/*!************************************!*\
  !*** ./src/helper/apis/ sync \.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = {
	"./index.js": "./src/helper/apis/index.js",
	"./visionvoice.js": "./src/helper/apis/visionvoice.js"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./src/helper/apis sync recursive \\.js";

/***/ }),

/***/ "./src/manifest.json":
/*!***************************!*\
  !*** ./src/manifest.json ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"package":"com.visionvoice.quick.app","name":"visionvoice","versionName":"1.0.0.1","versionCode":1,"minPlatformVersion":1070,"icon":"/assets/images/logo.png","features":[{"name":"system.prompt"},{"name":"system.router"},{"name":"system.shortcut"},{"name":"system.fetch"},{"name":"system.webview"},{"name":"system.storage"},{"name":"system.file"}],"permissions":[{"origin":"*"}],"config":{"logLevel":"debug"},"router":{"entry":"pages/Login","pages":{"pages/Content":{"component":"index"},"pages/Login":{"component":"index"}},"widgets":{"IntroCard":{"name":"IntroCard","description":"VisionVoice 快应用卡片展示","component":"index","path":"/IntroCard","minPlatformVersion":1032,"targetManufactorys":["vivo"],"features":[{"name":"system.webview"}]}}},"display":{"titleBarBackgroundColor":"#f2f2f2","titleBarTextColor":"#414141","pages":{"pages/Content":{"titleBarText":"VisionVoice 快应用"},"pages/Login":{"titleBarText":"VisionVoice 登录页"}}},"textSizeAdjust":"auto","designWidth":"device-width"}');

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
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/app.ux?uxType=app ***!
  \*******************************/

var $app_style$ = {}
var $app_script$ = __webpack_require__(/*! !../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/manifest-loader.js?path=d:\code\python\Visionvoice\front-end\VisionVoiceProject\src!../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\code\python\Visionvoice\front-end\VisionVoiceProject&cacheDirectory&comments=false&configFile=d:\app\Quick App IDE\resources\app\extensions\hap-debugger\node_modules\@hap-toolkit\packager\babel.config.js!../../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./app.ux?uxType=app */ "../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/script-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/module-loader.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/packager/lib/loaders/manifest-loader.js?path=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject\\src!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/babel-loader/lib/index.js?cwd=d:\\code\\python\\Visionvoice\\front-end\\VisionVoiceProject&cacheDirectory&comments=false&configFile=d:\\app\\Quick App IDE\\resources\\app\\extensions\\hap-debugger\\node_modules\\@hap-toolkit\\packager\\babel.config.js!../../../../../app/Quick App IDE/resources/app/extensions/hap-debugger/node_modules/@hap-toolkit/dsl-xvm/lib/loaders/fragment-loader.js?index=0&type=script!./src/app.ux?uxType=app")

$app_define$('@app-application/app', [], function ($app_require$, $app_exports$, $app_module$) {
  
  $app_script$($app_module$, $app_exports$, $app_require$)
  if ($app_exports$.__esModule && $app_exports$.default) {
    $app_module$.exports = $app_exports$.default
  }
  $app_module$.exports.manifest = __webpack_require__(/*! ./manifest.json */ "./src/manifest.json")
  $app_module$.exports.style = { list: [ $app_style$ ] }
  
})
$app_bootstrap$('@app-application/app', { packagerVersion: "1.9.14" })

})();

/******/ })()
;
//# sourceMappingURL=app.js.map