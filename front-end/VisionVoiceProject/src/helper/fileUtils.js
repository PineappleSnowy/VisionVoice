import file from '@system.file'

function writeText(text) {
    file.writeText({
        uri: "internal://cache/path/userInfo.txt",
        text: text,
        success: function (data) {
            console.log("[writeText] success write text: ", text)
        },
        fail: function (data, code) {
            console.log("[writeText] failed to write text: ", data, code)
        }
    })
}

function readText() {
    file.readText({
        uri: "internal://cache/path/userInfo.txt",
        success: function (data) {
            console.log("[readText] success read text: ", data.text)
            return data.text
        },
        fail: function (data, code) {
            console.log("[readText] failed to read text: ", data, code)
            return null
        }
    })
}

export default {
    writeText,
    readText
}
