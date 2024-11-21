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
    var input = document.getElementById('agent-chat-textarea');
    var message = input.value.trim();
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
 * @function addMessage
 * @description 添加用户或者机器人的消息
 * @param {string} message 消息内容
 */
function addMessage(message) {
    // console.log('[agent.js][addMessage] message: %s', message);
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
    var index = 0
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
                    // console.log('Stream complete');
                    return;
                }
                let jsonString = new TextDecoder().decode(value); // 将字节流转换为字符串

                // console.log('[agent.js][addMessage] agent_stream_audio: %s', jsonString);
                socket.emit("agent_stream_audio", { "index": index, "answer": jsonString })
                index += 1;

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
--------------------------------------------------------- */

// 保存音频数据的对象
var audioDict = {};

// 当前播放的音频索引
var audioIndex = 0;

// 获取音频播放器元素
const audioPlayer = document.getElementById('audioPlayer');

// 获取暂停按钮元素
const pauseDiv = document.querySelector('.pause');

pauseDiv.addEventListener('click', function () {
    audioPlayer.pause()
    audioDict = {};
    audioIndex = 0;
    console.log('[agent.js][pauseDiv.addEventListener] audio pause');
    pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
});

// 播放下一个音频
function playNextAudio() {
    try {
        // console.log('[agent.js][playNextAudio] audioIndex: ', audioIndex);
        // console.log('[agent.js][playNextAudio] audioDict: ', audioDict);

        // 检查当前索引的音频是否存在
        if (audioDict[audioIndex] !== undefined) {
            pauseDiv.style.backgroundImage = `url('${'./static/images/pause.png'}')`;
            const audioBlob = new Blob([audioDict[audioIndex]], { type: 'audio/mp3' });
            const audioURL = URL.createObjectURL(audioBlob);

            audioPlayer.src = audioURL;

            try {
                audioPlayer.play();
                console.log('[agent.js][playNextAudio] 音频片段播放中...');
            } catch (error) {
                console.log('[agent.js][playNextAudio] 音频片段播放失败.');
                console.log('[agent.js][playNextAudio] 错误信息：', error);
            }
        } else {
            // audioIndex = 0;
            // audioDict = {};
            console.log('[agent.js][playNextAudio] 没有更多音频可播放');
        }
    } catch (error) {
        console.log('[agent.js][playNextAudio] 错误信息：', error);
    }
}

// 监听音频播放结束事件
audioPlayer.onended = function () {
    // console.log('[agent.js][audioPlayer.onended] audioIndex: %d', audioIndex);
    audioIndex++;
    pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
    playNextAudio();
};

// 监听后端发送的 agent_play_audio_chunk 事件
socket.on('agent_play_audio_chunk', function (data) {
    console.log('[agent.js][socket.on][agent_play_audio_chunk] index: %d', data['audio_index']);
    var chunkIndex = data['audio_index'];
    var audioData = data['audio_chunk']; // 后端发送的音频数据

    // 将音频数据添加到音频字典
    audioDict[chunkIndex] = audioData;

    // 如果当前没有音频正在播放，开始播放
    if (audioPlayer.paused) {
        audioPlayer.pause();
        console.log("[agent.js][socket.on][agent_play_audio_chunk] 播放ing..");
        playNextAudio();
    }
});

/* 音频播放相关 end
--------------------------------------------------------- */
