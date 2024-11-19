var image_impt = null;
var flag_board = 0;

const socket = io();

// 在 DOM 加载完成后获取聊天记录
document.addEventListener('DOMContentLoaded', function() {
    loadChatHistory();
});

/**
 * @function loadChatHistory
 * @description 加载聊天记录
 */
function loadChatHistory() {
    const messagebackground = document.getElementById('chat-container');
    
    fetch('/get-chat-history', {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(history => {
        history.forEach(msg => {
            if(msg.role === 'user') {
                // 创建用户消息
                var messagesContainer_user = document.createElement('div');
                messagesContainer_user.className = 'chat-messages-user';
                var bubble = document.createElement('div');
                bubble.className = 'chat-bubble';
                var image_user = document.createElement('div');
                image_user.className = 'chat-image-user';
                bubble.textContent = msg.content;
                
                messagebackground.appendChild(messagesContainer_user);
                messagesContainer_user.appendChild(bubble);
                messagesContainer_user.appendChild(image_user);
            } else if(msg.role === 'assistant') {
                // 创建机器人消息
                var image_bot = document.createElement('div');
                image_bot.className = 'chat-image-bot';
                var messagesContainer_bot = document.createElement('div');
                messagesContainer_bot.className = 'chat-messages-bot';
                var bubble_2 = document.createElement('div');
                bubble_2.className = 'chat-bubble';
                bubble_2.textContent = msg.content;
                
                messagesContainer_bot.appendChild(image_bot);
                messagesContainer_bot.appendChild(bubble_2);
                messagebackground.appendChild(messagesContainer_bot);
            }
        });
        messagebackground.scrollTop = messagebackground.scrollHeight;
    })
    .catch(error => {
        console.error('Error loading chat history:', error);
    });
}

document.getElementById('send-button').addEventListener('click', function () {
    var input = document.getElementById('agent-chat-textarea');
    var message = input.value.trim();
    message = message.replace(/(\r\n|\n|\r)/gm, '')
    if (message || image_impt) {
        addMessage(message);
        input.value = ''; // 清空输入框
        if (flag_board === 1) {
            document.getElementById('more_function_button_2').click();
        }
    }
    document.getElementById('agent-chat-textarea').style.height = 'auto';
    image_impt = null;
});

/**
 * @function addMessage
 * @description 添加用户或者机器人的消息
 * @param {string} message 消息内容
 */
function addMessage(message) {
    console.log('[agent.js][addMessage] message: %s', message);
    const token = localStorage.getItem('token');
    var index = 0;
    var messagebackground = document.getElementById('chat-container');
    var messagesContainer_user = document.createElement('div');
    messagesContainer_user.className = 'chat-messages-user';
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    var image_user = document.createElement('div');
    image_user.className = 'chat-image-user';
    bubble.textContent = message;
    if (image_impt) {
        var image_import = document.createElement('img');
        image_import.src = image_impt;
        image_import.style.width = '100%';
        image_import.style.height = 'auto';
        bubble.appendChild(image_import);
    }
    messagebackground.appendChild(messagesContainer_user);
    messagesContainer_user.appendChild(bubble);
    messagesContainer_user.appendChild(image_user);

    //机器人响应
    var image_bot = document.createElement('div');
    image_bot.className = 'chat-image-bot';
    var messagesContainer_bot = document.createElement('div');
    messagesContainer_bot.className = 'chat-messages-bot';
    var bubble_2 = document.createElement('div');
    bubble_2.className = 'chat-bubble';
    // bubble_2.textContent = message;
    fetch(`/agent/chat_stream?query=${message}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => {
            let reader = response.body.getReader();

            // 逐块读取并处理数据
            return reader.read().then(function processText({ done, value }) {
                if (done) {
                    // console.log('Stream complete');
                    return;
                }
                let jsonString = new TextDecoder().decode(value); // 将字节流转换为字符串

                // console.log('[agent.js][addMessage] agent_stream_audio: %s', jsonString);
                socket.emit("agent_stream_audio", { "index": index, "answer": jsonString })
                index += 1;
                bubble_2.textContent += jsonString;

                // 继续读取下一个数据
                return reader.read().then(processText);
            });
        })
        .catch(error => {
            console.error('Error fetching stream:', error);
        });
    messagesContainer_bot.appendChild(image_bot);
    messagesContainer_bot.appendChild(bubble_2);
    messagebackground.appendChild(messagesContainer_bot);
    messagebackground.scrollTop = messagebackground.scrollHeight;
}

const pauseDiv = document.querySelector('.pause');
pauseDiv.addEventListener('click', function () {
    audioPlayer.pause()
    audioList = [];
    audioIndex = 0;
    console.log('audio pause');
    pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
});

//捕捉用户选择的图像
document.getElementById('photo').addEventListener('change', function (e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        image_impt = event.target.result;
        console.log('我执行了');
        document.getElementById('photo').value = '';
    };
    reader.readAsDataURL(file);
})

// 按下回车键也可以发送消息
document.getElementById('agent-chat-textarea').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            document.getElementById('agent-chat-textarea').textContent += '\n';
        }
        else {
            document.getElementById('send-button').click();
            e.preventDefault();
            this.style.height = 'auto';
        }
    }
});

//控制多功能板上下移动
document.getElementById('more_function_button').addEventListener('click', function () {
    flag_board = 1;
    document.getElementById('more_function_button').style.display = 'none';
    document.getElementById('more_function_button_2').style.display = 'flex';
    if (document.getElementById('chat-input-container').classList.contains('slide-up')) {
        document.getElementById('chat-input-container').classList.remove('slide-up');
        document.getElementById('chat-input-container').classList.add('slide-up');
    }
    else {
        document.getElementById('chat-input-container').classList.remove('slide-down');
        document.getElementById('chat-input-container').classList.add('slide-up');
    }
    if (document.getElementById('more_function_board').classList.contains('slide-up')) {
        document.getElementById('more_function_board').classList.remove('slide-up');
        document.getElementById('more_function_board').classList.add('slide-up');
    }
    else {
        document.getElementById('more_function_board').classList.remove('slide-down');
        document.getElementById('more_function_board').classList.add('slide-up');
    }
    document.getElementById('navbar').style.display = 'none';
})

document.getElementById('more_function_button_2').addEventListener('click', function () {
    flag_board = 0;
    document.getElementById('more_function_button_2').style.display = 'none';
    document.getElementById('more_function_button').style.display = 'flex';
    if (document.getElementById('chat-input-container').classList.contains('slide-down')) {
        document.getElementById('chat-input-container').classList.remove('slide-down');
        document.getElementById('chat-input-container').classList.add('slide-down');
    }
    else {
        document.getElementById('chat-input-container').classList.remove('slide-up');
        document.getElementById('chat-input-container').classList.add('slide-down');
    }
    if (document.getElementById('more_function_board').classList.contains('slide-down')) {
        document.getElementById('more_function_board').classList.remove('slide-down');
        document.getElementById('more_function_board').classList.add('slide-down');
    }
    else {
        document.getElementById('more_function_board').classList.remove('slide-up');
        document.getElementById('more_function_board').classList.add('slide-down');
    }
    document.getElementById('navbar').style.display = 'flex';
})

//输入框随着输入字数改变高度
document.getElementById('agent-chat-textarea').addEventListener(
    'input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }
)
//控制输入框的有效输入区长度
// document.getElementById('agent-chat-textarea').addEventListener(
//     'input', function () {
//         var len = this.value.length
//         if (((len + 1) % 51) === 0) {
//             document.getElementById('agent-chat-textarea').value += '\n';
//         }
//     }
// )

document.getElementById('decorate_photo').addEventListener('click', function () {
    document.getElementById('photo').click();
})

// 测试一下元素消失操作
function main_page_hidden() {
    document.getElementById('main_page').style.display = 'none';
}

function main_page_show() {
    //定时出现
    setTimeout(() => {
        document.getElementById('main_page').style.display = 'flex';
    }, 1000);
}

function flicker_hidden() {
    setTimeout(() => {
        document.getElementById('flicker').style.display = 'none';
    }, 1000);
}

// 通过XHR将视频帧发往后端
function captureAndSendFrame() {
    // 当音频活跃或按钮1按下或按钮2按下时执行
    if (is_active || btn1_push || btn2_push) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/env_rec/process_frame', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            // 当后端发来的反馈时执行
            if (xhr.readyState === 4 && xhr.status === 200) {
                const response = xhr.responseText;

                // 按钮2按下时执行，判断是否来过这，因为如果时录音按钮按下，则response为空，不执行
                // 或者发生异常，response='erro'
                if (response) {
                    // 空帧错误时重新发送
                    if (response == 'erro') {
                        erro_emit += 1;
                        if (erro_emit < 20) {
                            captureAndSendFrame();
                        }
                        else {
                            erro_emit = 0;
                            messageContainer.innerHTML = "图片发送错误！";
                        }
                    }
                    // 显示响应内容
                    else {
                        erro_emit = 0;
                        messageContainer.innerHTML = response;
                    }
                }
                // 按钮1按下且无异常时执行，仅描述环境
                else if (btn1_push) {
                    chat_stream("简洁地描述环境", current_active);
                }
            }
        };
        // 发送视频帧
        xhr.send(JSON.stringify({ "frame": imageData, "btn2_push": btn2_push }));
    }
}

document.getElementById('more_function_button_2').style.display = 'none';