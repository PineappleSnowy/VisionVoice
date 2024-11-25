var image_impt = null;
var flag_board = 0;

var selectedAgent = 'defaultAgent'; // 默认智能体

function selectChatAgent(agent) {
    selectedAgent = agent;
    localStorage.setItem('selectedAgent', agent); // 将选择的智能体存储到本地存储
}

const socket = io();

// 在 DOM 加载完成后获取聊天记录
document.addEventListener('DOMContentLoaded', function() {
    selectedAgent = localStorage.getItem('selectedAgent') || 'defaultAgent'; // 从本地存储中获取选择的智能体
    loadChatHistory(selectedAgent);
});

/**
 * @function loadChatHistory
 * @description 加载聊天记录
 * @param {string} agent 智能体名称
 */
function loadChatHistory(agent) {
    const messagebackground = document.getElementById('chat-container');
    
    fetch(`/get-chat-history?agent=${agent}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(history => {
            if (history.length > 0) {
                history.forEach(msg => {
                    if (msg.role === 'user') {
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
                    } else if (msg.role === 'assistant') {
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
            } else {
                messagebackground.innerHTML = '<div class="chat-messages-user"><div class="chat-bubble">您还没有聊天记录</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading chat history:', error);
        });
}

// 发送消息按钮
document.getElementById('send-button').addEventListener('click', function () {
    let input = document.getElementById('agent-chat-textarea');
    let message = input.value.trim();
    message = message.replace(/(\r\n|\n|\r)/gm, '')
    if (message || image_impt) {
        audioPlayer.pause()
        pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
        audioDict = {};
        audioIndex = 0;
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
 * @description 添加用户和大模型的消息
 * @param {string} message 用户的消息内容
 */
function addMessage(message) {

    /* 对上一轮对话的音频播放进行处理
    --------------------------------------------------------- */
    // 暂停上一轮对话的音频播放
    audioPlayer.pause();

    // 清空音频队列
    audioQueue = [];

    // 设置音频播放结束标志
    isPlaying = false;
    /* 对上一轮对话的音频播放进行处理 end
    --------------------------------------------------------- */

    // 获取本地 token
    const token = localStorage.getItem('token');

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

    // 机器人响应
    var image_bot = document.createElement('div');
    image_bot.className = 'chat-image-bot';
    var messagesContainer_bot = document.createElement('div');
    messagesContainer_bot.className = 'chat-messages-bot';
    var bubble_2 = document.createElement('div');
    bubble_2.className = 'chat-bubble';
    
    fetch(`/agent/chat_stream?query=${message}&agent=${selectedAgent}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => {
            let reader = response.body.getReader();

            // 逐块读取并处理数据
            return reader.read().then(function processText({ done, value }) {
                if (done) {
                    return;
                }
                let jsonString = new TextDecoder().decode(value); // 将字节流转换为字符串

                socket.emit("agent_stream_audio", jsonString)

                // 如果当前不是结束标志，则将文本添加到气泡中
                if (!(jsonString == "<END>")) {
                    bubble_2.textContent += jsonString;
                }

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

//捕捉用户选择的图像
document.getElementById('photo').addEventListener('change', function (e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        image_impt = event.target.result;
        console.log('用户上传图片');
        document.getElementById('photo').value = '';
        // 显示图片预览
        document.getElementById('preview-image').src = image_impt;
        document.getElementById('image-preview').style.display = 'block';

        // 将图片数据发送到后端
        fetch('/agent/upload_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: image_impt })
        })
            .then(response => response.json())
            .then(data => {
                console.log('图片上传成功:', data);
            })
            .catch(error => {
                console.error('图片上传失败:', error);
            });
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

document.getElementById('more_function_button_2').style.display = 'none';

/* 音频播放相关 start
- 由于大模型的音频回答应该要有断句，所以需要将音频数据分段由后端发送至前端，
- 前端需要将这些分段的音频数据存储到队列（本质是 list 列表）中。
- 当音频开始播放时，队列的第一个元素出栈，并播放。
- 当元素播放结束后，继续播放下一个元素，直到队列中没有元素为止
--------------------------------------------------------- */ 

// 获取暂停按钮元素
const pauseDiv = document.querySelector('.pause');

// 获取音频播放器 DOM 元素
const audioPlayer = document.getElementById('audioPlayer');

// 用于存放音频的队列
let audioQueue = [];

// 标识是否正在播放音频
let isPlaying = false;

/**
 * @description 监听后端发送的 agent_play_audio_chunk 事件
 * - 音频播放模块的起点
 * - 后端会将音频数据分段发送过来，该函数需要将这些音频数据分段存储到队列中，并开始播放
 */
socket.on('agent_play_audio_chunk', function (data) {
    const audioIndex = data['index'];
    const audioData = data['audio_chunk'];

    // 将音频数据添加到队列中
    audioQueue[audioIndex] = audioData;

    // 如果当前没有音频正在播放，开始播放
    if (!isPlaying) {
        pauseDiv.style.backgroundImage = `url('${'./static/images/pause.png'}')`;
        playNextAudio();
    }
});

/**
 * @description 播放下一个音频
 * - 大模型的回答是有断句的，当播放完该句话后，继续播放下一句话
 */
function playNextAudio() {
    // 如果音频队列中没有音频数据（即后端还没有发送音频数据），则停止播放
    if (audioQueue.length === 0) {
        isPlaying = false;
        pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
        return;
    }
    console.log('[agent.js][playNextAudio] audioQueue:', audioQueue);

    // 从队列中取出下一个音频
    const nextAudioData = audioQueue.shift();

    // 如果音频数据不为空，则播放音频
    if (nextAudioData) {

        // 标识音频正在播放
        isPlaying = true;

        // 将音频数据转换为 Blob 对象，并对其创建资源 URL，从而设置音频播放器的播放源（播放源只能是 URL）
        const audioBlob = new Blob([nextAudioData], { type: 'audio/mp3' });
        const audioURL = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioURL;

        // 播放音频
        audioPlayer.play().then(() => {
            console.log('音频片段播放中...');
        }).catch(error => {
            console.log('音频片段播放失败.', error);
        });
    } else {
        // 如果当前音频为空，继续播放下一个
        playNextAudio();
    }
}

/**
 * @description 设置音频播放结束后的回调函数
 * - 大模型的回答是有断句的，当播放完该句话后，继续播放下一句话
 */
audioPlayer.onended = function () {
    playNextAudio();
};

/**
 * @description 暂停音频播放
 * - 暂停音频播放后，清空音频队列，并将暂停按钮设置为未激活状态（灰色）
 */
pauseDiv.addEventListener('click', function () {
    // 暂停音频播放
    audioPlayer.pause()

    // 清空音频队列
    audioQueue = [];

    pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
});

/* 音频播放相关 end
--------------------------------------------------------- */
