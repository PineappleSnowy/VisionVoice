import storage from '@system.storage'

// 存储数据
async function saveData(key, value) {
  storage.set({
    key: key,
    value: value,
    success: function () {
      console.log(`数据保存成功 ${key}:${value}`)
    },
    fail: function (data, code) {
      console.log(`数据保存失败, code = ${code}`)
    }
  })
}

// 获取数据
async function getData(key) {
  return new Promise((resolve, reject) => {
    storage.get({
      key: key,
      success: function (data) {
        console.log(`获取的数据: ${key}:${data}`)
        resolve(data)
      },
      fail: function (data, code) {
        console.log(`获取数据失败, code = ${code}`)
        reject(null)
      }
    })
  })
}

// 删除数据
async function deleteData(key) {
  storage.delete({
    key: key,
    success: function () {
      console.log(`数据删除成功 ${key}`)
    },
    fail: function (data, code) {
      console.log(`数据删除失败, code = ${code}`)
    }
  })
}

// 清除所有数据
async function clearAll() {
  storage.clear({
    success: function () {
      console.log('清除所有数据成功')
    },
    fail: function (data, code) {
      console.log(`清除所有数据失败, code = ${code}`)
    }
  })
}

export default {
  saveData,
  getData,
  deleteData,
  clearAll
}
