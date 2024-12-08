let image_impt = null;
let flag_board = 0;

// 在 DOM 加载完成后获取聊天记录
document.addEventListener('DOMContentLoaded', function () {
    loadChatHistory(selectedAgent);
    updateAgentName(selectedAgent);
});

// 创建socket连接，并附上token用于后端验证
const token = localStorage.getItem('token');
const socket = io({
    query: {
        token: token
    }
});

/**
 * @function loadChatHistory
 * @description 加载聊天记录
 * @param {string} agent 智能体名称
 */
function loadChatHistory(agent) {
    const messagebackground = document.getElementById('chat-container');
    const botImageUrl = agent === 'psychologicalAgent' ? '../static/images/psychologicalAgent.jpg' : '../static/images/defaultAgent.jpg';

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
                        const messagesContainer_user = document.createElement('div');
                        messagesContainer_user.className = 'chat-messages-user';
                        const bubble = document.createElement('div');
                        bubble.className = 'chat-bubble-user';
                        const image_user = document.createElement('div');
                        image_user.className = 'chat-image-user';
                        bubble.textContent = msg.content;

                        messagebackground.appendChild(messagesContainer_user);
                        messagesContainer_user.appendChild(bubble);
                        messagesContainer_user.appendChild(image_user);
                    } else if (msg.role === 'assistant') {
                        // 创建机器人消息
                        const image_bot = document.createElement('div');
                        image_bot.className = 'chat-image-bot';
                        image_bot.style.backgroundImage = `url('${botImageUrl}')`;
                        const messagesContainer_bot = document.createElement('div');
                        messagesContainer_bot.className = 'chat-messages-bot';
                        const bubble_2 = document.createElement('div');
                        bubble_2.className = 'chat-bubble-bot';
                        bubble_2.textContent = msg.content;

                        messagesContainer_bot.appendChild(image_bot);
                        messagesContainer_bot.appendChild(bubble_2);
                        messagebackground.appendChild(messagesContainer_bot);
                    }
                });
                messagebackground.scrollTop = messagebackground.scrollHeight;
            } else {
                // messagebackground.innerHTML = '<div class="chat-messages-user"><div class="chat-bubble-user">您还没有聊天记录</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading chat history:', error);
        });
}

document.getElementById('send-button').addEventListener('click', function () {
    let input = document.getElementById('agent-chat-textarea');
    let message = input.value.trim();
    message = message.replace(/(\r\n|\n|\r)/gm, '');
    if (message || uploadedImages.length > 0) {
        audioPlayer.pause();
        pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
        audioDict = {};
        audioIndex = 0;
        addMessage(message);
        input.value = ''; // 清空输入框
        if (flag_board === 1) {
            document.getElementById('more_function_button_2').click();
        }
        clearImageDiv(); // 清空图片内容
        document.getElementById('imageUploadPanel').style.display = 'none'; // 隐藏imageUploadPanel
    }
    document.getElementById('agent-chat-textarea').style.height = 'auto';
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

    const messagebackground = document.getElementById('chat-container');
    const messagesContainer_user = document.createElement('div');
    messagesContainer_user.className = 'chat-messages-user';
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble-user';
    const image_user = document.createElement('div');
    image_user.className = 'chat-image-user';
    bubble.textContent = message;

    let multi_image_talk = false;

    // 处理上传的图像
    if (uploadedImages.length > 0) {
        multi_image_talk = true;
        const promises = uploadedImages.map((file, index) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const imageUrl = event.target.result;
                    const imageElement = document.createElement('img');
                    imageElement.src = imageUrl;
                    imageElement.style.width = '100%';
                    imageElement.style.height = 'auto';
                    bubble.appendChild(imageElement);

                    // 发送图像到后端
                    fetch('/agent/upload_image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ image: imageUrl, multi_image_index: index })
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log('图片上传成功:', data);
                            resolve(imageUrl); // 返回图片URL以便后续发送
                        })
                        .catch(error => {
                            console.error('图片上传失败:', error);
                            reject(error);
                        });
                };
                reader.readAsDataURL(file);
            });
        });

        // 等待所有图片上传完成后再发送消息
        Promise.all(promises).then(() => {
            uploadedImages = [];
            sendMessageToAgent(message, multi_image_talk);
        }).catch(error => {
            console.error('图片上传过程中出错:', error);
        });
    } else {
        sendMessageToAgent(message, multi_image_talk);
    }
    messagebackground.appendChild(messagesContainer_user);
    messagesContainer_user.appendChild(bubble);
    messagesContainer_user.appendChild(image_user);
}

/**
 * @description 发送消息到智能体
 * @param {string} message 用户的消息内容
 * @param {boolean} multi_image_talk 是否包含多张图片
 */
function sendMessageToAgent(message, multi_image_talk) {
    // 机器人响应
    const image_bot = document.createElement('div');
    image_bot.className = 'chat-image-bot';
    const botImageUrl = selectedAgent === 'psychologicalAgent' ? '../static/images/psychologicalAgent.jpg' : '../static/images/defaultAgent.jpg';
    image_bot.style.backgroundImage = `url('${botImageUrl}')`;
    const messagesContainer_bot = document.createElement('div');
    messagesContainer_bot.className = 'chat-messages-bot';
    const bubble_2 = document.createElement('div');
    bubble_2.className = 'chat-bubble-bot';

    fetch(`/agent/chat_stream?query=${message}&agent=${selectedAgent}&multi_image_talk=${multi_image_talk}`, {
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

                // 如果当前不是结束标志，则将文本添加到气泡中
                if (!(jsonString.includes("<END>"))) {
                    socket.emit("agent_stream_audio", jsonString);
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
    const messagebackground = document.getElementById('chat-container');
    messagebackground.appendChild(messagesContainer_bot);
    messagebackground.scrollTop = messagebackground.scrollHeight;
}

// 删除图片
// 为 #imageUploadPanel 添加事件委托
const content = document.querySelector('#imageUploadPanel .content');
document.getElementById('imageUploadPanel').addEventListener('click', function (event) {
    if (event.target.classList.contains('remove')) {
        console.log('remove button clicked');
        // 找到当前按钮的父元素 .image
        const imageContainer = event.target.closest('.image');
        if (imageContainer) {
            // 获取图片容器的索引
            const index = Array.from(content.children).indexOf(imageContainer);
            if (index !== -1) {
                // 从数组中移除对应的图片信息
                uploadedImages.splice(index, 1);
            }
            // 从 DOM 中移除 .image 元素及其所有子元素
            imageContainer.remove();
        }
    }
});

// 添加图片
let uploadedImages = [];
document.querySelector('#imageUploadPanel .content .add').addEventListener('click', function () {
    document.querySelector('#imageUploadPanel .content .add input').click();
});

document.querySelector('#imageUploadPanel .content .add input').addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (!file) return; // 检查文件是否存在

    // 创建一个临时的 URL 来显示图片
    const imageUrl = URL.createObjectURL(file);

    // 将文件对象存储到数组中
    uploadedImages.push(file);

    // 在 .content 最前面插入包含上传图片的 <div> 结构
    const content = document.querySelector('#imageUploadPanel .content');
    const imageDiv = document.createElement('div');
    imageDiv.className = 'image';
    const userImg = document.createElement('img');
    userImg.src = imageUrl; // 使用临时 URL
    userImg.style.height = '100%';
    userImg.style.width = 'auto';

    const removeImg = document.createElement('img');
    removeImg.className = 'remove';
    removeImg.src = '../static/images/more_function_end.png';
    removeImg.alt = '删除照片';

    imageDiv.appendChild(userImg);
    imageDiv.appendChild(removeImg);

    // 插入到 .content 最前面
    content.insertBefore(imageDiv, content.firstChild);

    // 清空文件输入以允许重新选择同一文件
    e.target.value = '';
});

// 清空图片div
function clearImageDiv() {
    const content = document.querySelector('#imageUploadPanel .content');
    content.innerHTML = ''; // 清空内容
    // 重新添加添加图片的HTML结构
    const addDiv = document.createElement('div');
    addDiv.className = 'add';

    const img = document.createElement('img');
    img.src = '../static/images/more_function_start.png';
    img.alt = '添加图片';

    const input = document.createElement('input');
    input.id = 'photo';
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('aria-label', '选择图片');
    input.style.display = 'none';

    addDiv.appendChild(img);
    addDiv.appendChild(input);
    content.appendChild(addDiv);
}

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
    const imageUploadPanel = document.getElementById('imageUploadPanel');
    if (imageUploadPanel.style.display === 'flex') {
        imageUploadPanel.style.display = 'none';
    } else {
        imageUploadPanel.style.display = 'flex';
        document.querySelector('#imageUploadPanel .content .add input').click();
    }
})

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

        // 将音频数据转换为 Blob 对象，并对其创建资源 URL，从而设置音频播放器的播放源（播放��只能是 URL）
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

/**
 * @function updateAgentName
 * @description 更新顶栏中显示的智能体名称
 * @param {string} agent 智能体名称
 */
function updateAgentName(agent) {
    let agent_name = '';
    if (agent == 'defaultAgent')
        agent_name = "生活助手";
    else if (agent == 'psychologicalAgent')
        agent_name = "心灵树洞";
    else
        agent_name = '智能体名称';
    document.getElementById('agent-name').textContent = agent_name;
}
