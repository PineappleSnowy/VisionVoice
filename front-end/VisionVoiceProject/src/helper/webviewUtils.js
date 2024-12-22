import webview from '@system.webview'

// 存储数据
async function setCookie(name, value) {
  return new Promise((resolve, reject) => {
    webview.setCookie({
      domain: $server_url.split('/')[2],
      name: name,
      value: value,
      success: function () {
        console.info(`cookie 保存成功 ${name}:${value}`)
        resolve(true)
      },
      fail: function (e) {
        console.error(`cookie 保存失败, e:${e}`)
        reject(false)
      }
    })
  })
}

// 删除数据
async function deleteCookie(name) {
  return new Promise((resolve, reject) => {
    webview.setCookie({
      domain: $server_url.split('/')[2],
      name: name,
      value: '',
      success: function () {
        console.info(`cookie 删除成功: ${name}`)
        resolve(true)
      },
      fail: function (e) {
        console.error(`cookie 删除失败, e:${e}`)
        reject(false)
      }
    })
  })
}

// 加载网页
function loadUrl(url) {
  webview.loadUrl({
    url: url,
    allowthirdpartycookies: true,
  })
}


export default {
  setCookie,
  deleteCookie,
  loadUrl
}
