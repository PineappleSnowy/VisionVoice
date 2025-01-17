import { initAudioAnalyser, detectDB } from './lib/audioUtils.js';

let flag_board = 0;
let uploadedImages = [];

// 在 DOM 加载完成后获取聊天记录
document.addEventListener('DOMContentLoaded', function () {
    loadChatHistory(selectedAgent);
    updateAgentName(selectedAgent);
});

// 创建socket连接，并附上token用于后端验证
const token = localStorage.getItem('token');
const socket = io({
    pingTimeout: 60000,  // 设置较大的 pingTimeout
    pingInterval: 30000,  // 设置较大的 pingInterval
    query: {
        token: token
    }
});
const messagebackground = document.getElementById('chat-container');  // 获取消息列表容器

/**
 * @function loadChatHistory
 * @description 加载聊天记录
 * @param {string} agent 智能体名称
 */
function loadChatHistory(agent) {
    const botImageUrl = agent === 'psychologicalAgent' ? '../static/images/psychologicalAgent.jpg' : '../static/images/defaultAgent.jpg';
    const token = localStorage.getItem('token');
    fetch(`/get-chat-history?agent=${agent}`, {
        headers: {
            "Authorization": `Bearer ${token}`
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

document.getElementById('phone-button').addEventListener('click', function () {
    window.location.href = '/phone';
});


setInterval(() => {
    if (document.getElementById('agent-chat-textarea').value.trim() || uploadedImages.length > 0) {
        document.querySelector('#send-button').style.display = 'inline-block';
        document.querySelector('#more_function_button').style.display = 'none';
    } else {
        document.querySelector('#send-button').style.display = 'none';
        document.querySelector('#more_function_button').style.display = 'flex';
    }
}, 100);


let message = ''  // 用户发送的消息

document.getElementById('send-button').addEventListener('click', function () {
    let input = document.getElementById('agent-chat-textarea');
    message += input.value.trim();
    message = message.replace(/(\r\n|\n|\r)/gm, '');
    if (message || uploadedImages.length > 0) {
        audioPlayer.pause();
        audioQueue = [];
        addMessage(message);
        message = ''
        input.value = ''; // 清空输入框
        if (flag_board === 1) {
            document.getElementById('more_function_button').click();
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

    const messagesContainer_user = document.createElement('div');
    messagesContainer_user.className = 'chat-messages-user';
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble-user';
    const image_user = document.createElement('div');
    image_user.className = 'chat-image-user';
    bubble.textContent = message;

    messagebackground.appendChild(messagesContainer_user);
    messagesContainer_user.appendChild(bubble);
    messagesContainer_user.appendChild(image_user);

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

                    const token = localStorage.getItem('token');
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
}

/**
 * @description 发送消息到智能体
 * @param {string} message 用户的消息内容
 * @param {boolean} multi_image_talk 是否包含多张图片
 */
let curr_talk_index = 0;  // 标识当前对话

function sendMessageToAgent(message, multi_image_talk) {
    if (curr_talk_index >= Number.MAX_SAFE_INTEGER) {
        curr_talk_index = 0;
    }
    curr_talk_index += 1;
    const talk_index = curr_talk_index;
    // 机器人响应
    const image_bot = document.createElement('div');
    image_bot.className = 'chat-image-bot';
    const botImageUrl = selectedAgent === 'psychologicalAgent' ? '../static/images/psychologicalAgent.jpg' : '../static/images/defaultAgent.jpg';
    image_bot.style.backgroundImage = `url('${botImageUrl}')`;
    const messagesContainer_bot = document.createElement('div');
    messagesContainer_bot.className = 'chat-messages-bot';
    const bubble_2 = document.createElement('div');
    bubble_2.className = 'chat-bubble-bot';

    const token = localStorage.getItem('token');
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
                // 如果对话序号对不上，则停止响应
                if (talk_index !== curr_talk_index) {
                    return;
                }

                let jsonString = new TextDecoder().decode(value); // 将字节流转换为字符串

                // 如果当前不是结束标志，则将文本添加到气泡中
                if (!(jsonString.includes("<END>"))) {
                    if (!isMuted) {
                        socket.emit("agent_stream_audio", jsonString);
                    }
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

// 删除图片
// 为 #imageUploadPanel 添加事件委托
const imageList = document.querySelector('#imageUploadPanel .content .imageList');
imageList.addEventListener('click', function (event) {

    // 找到当前按钮的父元素 .image
    const imageContainer = event.target.closest('.image');
    if (imageContainer) {
        const musk = document.createElement('div');
        musk.classList.add('musk');
        imageContainer.appendChild(musk);
        setTimeout(() => {
            // 获取图片容器的索引
            const index = Array.from(imageList.children).indexOf(imageContainer);
            if (index !== -1) {
                // 从数组中移除对应的图片信息
                uploadedImages.splice(index, 1);
            }
            // 从 DOM 中移除 .image 元素及其所有子元素
            imageContainer.remove();
            if (uploadedImages.length > 0) {
                document.querySelector('#imageUploadPanel .content .add').style.display = 'flex';
                document.querySelector('#imageUploadPanel').style.display = 'flex';
            } else {
                document.querySelector('#imageUploadPanel .content .add').style.display = 'none';
                document.querySelector('#imageUploadPanel').style.display = 'none';
            }
        }, 100);
    }

});

document.getElementById('photo').addEventListener('click', function (e) {
    e.stopPropagation(); // 阻止事件冒泡
});

// 添加图片
document.querySelector('#imageUploadPanel .content .add').addEventListener('click', function () {
    const input = document.querySelector('#imageUploadPanel .content .add input');
    input.removeAttribute('capture'); // 确保不包含 capture 属性
    input.click();
});

document.querySelector('#imageUploadPanel .content .add input').addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (!file) return; // 检查文件是否存在
    if (flag_board === 1) {
        document.getElementById('more_function_button').click();
    }
    // 创建一个临时的 URL 来显示图片
    const imageUrl = URL.createObjectURL(file);

    // 将文件对象存储到数组中
    uploadedImages.push(file);

    // 在 .content 最前面插入包含上传图片的 <div> 结构
    const imageList = document.querySelector('#imageUploadPanel .content .imageList');
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

    // 插入到 .imageList 最后面
    imageList.appendChild(imageDiv);

    // 清空文件输入以允许重新选择同一文件
    e.target.value = '';

    if (uploadedImages.length > 0) {
        document.querySelector('#imageUploadPanel .content .add').style.display = 'flex';
    } else {
        document.querySelector('#imageUploadPanel .content .add').style.display = 'none';
    }
});

document.getElementById('album_photo').addEventListener('click', function () {
    const imageUploadPanel = document.getElementById('imageUploadPanel');
    const input = document.querySelector('#imageUploadPanel .content .add input');
    input.removeAttribute('capture'); // 确保不包含 capture 属性
    imageUploadPanel.style.display = 'flex';
    input.click();
});

document.getElementById('camera_photo').addEventListener('click', function () {
    const imageUploadPanel = document.getElementById('imageUploadPanel');
    const input = document.querySelector('#imageUploadPanel .content .add input');
    input.setAttribute('capture', 'camera'); // 从相机上传
    imageUploadPanel.style.display = 'flex';
    input.click();
});

document.getElementById('camera_icon').addEventListener('click', function () {
    document.getElementById('camera_photo').click();
});

// 清空图片div
function clearImageDiv() {
    const imageList = document.querySelector('#imageUploadPanel .content .imageList');
    imageList.innerHTML = ''; // 清空内容
    // 清空 uploadedImages 数组
    uploadedImages = [];
}

//控制多功能板上下移动
document.getElementById('more_function_button').addEventListener('click', function () {
    if (flag_board === 0) {
        flag_board = 1;
        document.querySelector('#more_function_button').style.backgroundImage = "url('../static/images/more_function_end.png')";
        document.querySelector('#more_function_button').ariaLabel = '关闭更多功能面板';
        if (!document.getElementById('chat-input-container').classList.contains('slide-up')) {
            document.getElementById('chat-input-container').classList.remove('slide-down');
            document.getElementById('chat-input-container').classList.add('slide-up');
        }
        if (!document.getElementById('more_function_board').classList.contains('slide-up')) {
            document.getElementById('more_function_board').classList.remove('slide-down');
            document.getElementById('more_function_board').classList.add('slide-up');
        }
        document.getElementById('chat-container').style.bottom = '181px';
    }

    else {
        flag_board = 0;
        document.querySelector('#more_function_button').style.backgroundImage = "url('../static/images/more_function_start.png')";
        document.querySelector('#more_function_button').ariaLabel = '打开更多功能面板';
        if (!document.getElementById('chat-input-container').classList.contains('slide-down')) {
            document.getElementById('chat-input-container').classList.remove('slide-up');
            document.getElementById('chat-input-container').classList.add('slide-down');
        }
        if (!document.getElementById('more_function_board').classList.contains('slide-down')) {
            document.getElementById('more_function_board').classList.remove('slide-up');
            document.getElementById('more_function_board').classList.add('slide-down');
        }
        document.getElementById('chat-container').style.bottom = '100px';
    }
});



//输入框随着输入字数改变高度
document.getElementById('agent-chat-textarea').addEventListener(
    'input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }
)

document.getElementById('agent-chat-textarea').addEventListener('click', function () {
    if (flag_board === 1) {
        document.getElementById('more_function_button').click();
    }
});

/* 音频播放相关 start
- 由于大模型的音频回答应该要有断句，所以需要将音频数据分段由后端发送至前端，
- 前端需要将这些分段的音频数据存储到队列（本质是 list 列表）中。
- 当音频开始播放时，队列的第一个元素出栈，并播放。
- 当元素播放结束后，继续播放下一个元素，直到队列中没有元素为止
--------------------------------------------------------- */

// 获取音频播放器 DOM 元素
const audioPlayer = document.getElementById('audioPlayer');

// 用于存放音频的队列
let audioQueue = [];

// 标识是否正在播放音频
let isPlaying = false;

// 标识用户是否静音
let isMuted = localStorage.getItem('isMuted') === 'true';

window.addEventListener('DOMContentLoaded', function () {
    if (isMuted) {
        document.getElementById('audio-control').setAttribute('aria-label', '关闭静音');
        console.log('[agent.js][DOMContentLoaded] localStorage 中用户已经设置过静音，展示静音图标...');
        document.getElementById('audio-control').classList.add('muted');
    }
    else{
        document.getElementById('audio-control').setAttribute('aria-label', '开启静音');
    }
});

document.getElementById('audio-control').addEventListener('click', function () {
    isMuted = !isMuted;

    // 将用户是否静音的状态写入 localStorage：防止刷新后静音状态丢失
    localStorage.setItem('isMuted', isMuted);

    // 切换按钮样式
    this.classList.toggle('muted');

    // 如果用户静音，则暂停音频播放
    if (isMuted) {
        document.getElementById('audio-control').setAttribute('aria-label', '关闭静音');
        console.log('[agent.js][audio-control] 用户静音，暂停音频播放...');
        audioQueue = [];
        audioPlayer.pause();
        isPlaying = false;
    }
    else{
        document.getElementById('audio-control').setAttribute('aria-label', '开启静音');
    }
})

/**
 * @description 监听后端发送的 agent_play_audio_chunk 事件
 * - 音频播放模块的起点
 * - 后端会将音频数据分段发送过来，该函数需要将这些音频数据分段存储到队列中，并开始播放
 */
socket.on('agent_play_audio_chunk', function (data) {
    const user = localStorage.getItem('user');
    console.log('curr_user', user)
    if (data.user !== user) return;
    if (!isMuted) {
        const audioIndex = data['index'];
        const audioData = data['audio_chunk'];

        // 将音频数据添加到队列中
        audioQueue[audioIndex] = audioData;

        // 如果当前没有音频正在播放，开始播放
        if (!isPlaying) {
            playNextAudio();
        }
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

/* 语音输入 start
--------------------------------------------------------- */

// 添加录音相关变量
let isRecording = false;

// 添加录音按钮点击事件监听器
document.getElementById('microphone-button').addEventListener('click', async function () {
    const microphoneButton = document.getElementById('microphone-button');

    try {
        if (!isRecording) {
            console.log('[agent.js][microphone-button] start recording');
            // 开始录音
            startRecording();
            isRecording = true;

            // 改变麦克风按钮样式为红色
            microphoneButton.style.backgroundColor = 'red';

        } else {
            console.log('[agent.js][microphone-button] stop recording');

            // 停止录音
            stopRecording();
            isRecording = false;

            // 上传音频数据
            rec.exportWAV(upload_audio);

            // 恢复麦克风按钮原始样式
            microphoneButton.style.backgroundColor = '';
        }
    } catch (error) {
        console.error("录音权限获取失败:", error);
    }
});


/* 语音输入 end
--------------------------------------------------------- */

/* 处理音频录制 start 
------------------------------------------------------------*/

// 音频上下文
let audioContext;
// 录制器
let rec;
// 音频流
let input;

async function startRecording() {
    // 创建新的音频上下文，这是 Web Audio API 的核心对象
    audioContext = new AudioContext();

    // 获取音频流
    let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[agent.js][startRecording] 创建 getUserMedia 音频流成功...");

    // 将麦克风的音频流 (stream) 转换为音频源节点
    input = audioContext.createMediaStreamSource(audioStream);

    // 创建一个新的 Recorder 实例，用于录制音频
    // numChannels: 1 表示使用单声道录音，用于减少文件大小，如果声道为 2，文件会变成两倍大小
    rec = new Recorder(input, { numChannels: 1 })

    // 启动录制过程
    rec.record()

}

async function stopRecording() {
    console.log("[agent.js][stopRecording] 停止录音...");

    // 告诉录制器停止录制
    rec.stop();

}

/**
 * @description 上传音频数据到后端进行识别，识别完成后，后端会通过 socket 将识别结果发送至前端
 * - socket 事件为 agent_speech_recognition_finished
 * @param {Blob} blob 音频的 blob 数据
 */
function upload_audio(blob) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function (e) {
        if (this.readyState === 4) {
            // console.log("[agent.js][upload_audio] response:", e.target.responseText);
        }
    };
    const fd = new FormData();
    fd.append("audio_data", blob, "recorded_audio.wav");
    const sampleRate = audioContext.sampleRate;
    fd.append("sample_rate", sampleRate);
    const token = localStorage.getItem('token');
    console.log("[agent.js][upload_audio] 上传音频数据...");
    xhr.open("POST", "/agent/upload_audio", true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.send(fd);
}
/* 处理音频录制 end 
------------------------------------------------------------*/


/* 处理音频识别 start 
------------------------------------------------------------*/

/**
 * @description 语音识别结束后，将识别结果发送给后端，并开始语音对话
 */

socket.on('agent_speech_recognition_finished', async function (data) {
    const user = localStorage.getItem('user');
    console.log('curr_user', user)
    if (data.user !== user) return;
    const rec_result = data['rec_result'];

    if (!rec_result) {
        console.log('[agent.js][socket.on][agent_speech_recognition_finished] 音频识别结果为空.');
        return;
    }
    console.log('[agent.js][socket.on][agent_speech_recognition_finished] 音频识别结果: %s', rec_result);

    message += rec_result;
    document.getElementById('send-button').click();
})

/* 处理音频识别 end 
--------------------------------------------------------- */

/* 处理环境噪音获取 start
----------------------------------------------------------*/

// 在页面右上角添加新容器，用于显示音频的时间累计平均分贝值
const body = document.body;
const avgDbDisplay = document.createElement('div');
avgDbDisplay.style.cssText = 'width: 41%; font-size: 10px; position: fixed; top: 40px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; border-radius: 4px; z-index: 1000;';
body.appendChild(avgDbDisplay);

// 使用 let 关键字修饰静音阈值
let SILENCE_THRESHOLD = -20;


/**
 * @description 校准环境噪音
 * - 每 100ms 采样一次，检测时长持续 1 秒
 * - 1 秒后计算环境噪音的平均分贝值
 * @param {Number} duration 检测时长，单位：毫秒
 * @returns {Promise<Number>} 环境噪音阈值
 */
async function calibrateNoiseLevel(analyser, dataArray, duration = 1000) {
    console.log('[phone.js][calibrateNoiseLevel] 开始检测环境噪音...');
    return new Promise((resolve) => {

        // 用于存放采样数据
        const samples = [];

        // 每 100ms 采样一次
        const sampleInterval = 100;

        // 采样开始时间
        const startTime = Date.now();

        // 采样函数
        const sampleNoise = () => {

            // 如果采样时间超过检测时长，则结束采样
            if (Date.now() - startTime >= duration) {

                // 过滤掉无效的采样值(-Infinity)，只保留有穷值，否则最终计算平均值时会导致无穷大
                const validSamples = samples.filter(sample => isFinite(sample));

                // 如果没有有效采样值，设置一个默认阈值
                if (validSamples.length === 0) {
                    console.log('[phone.js][calibrateNoiseLevel] 未检测到有效噪音，使用默认阈值: -20dB');
                    resolve(-20);
                    return;
                }

                // 计算平均噪音水平
                const averageNoise = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;

                // 设置阈值为平均噪音上浮5分贝，并确保不小于最小阈值 -20dB
                let newThreshold;
                if (averageNoise + 5 > -20) {
                    console.log(`[index.js][calibrateNoiseLevel] 环境噪音基准: ${averageNoise.toFixed(2)}dB, 设置阈值: ${newThreshold.toFixed(2)}dB`);
                    newThreshold = averageNoise + 5;
                } else {
                    console.log(`[index.js][calibrateNoiseLevel] 环境噪音基准: ${averageNoise.toFixed(2)}dB, 低于最低阈值，设置阈值: -20dB`);
                    newThreshold = -20;
                }
                resolve(newThreshold);
                return;
            } else {

                // 如果采样时间未超过检测时长，则继续采样
                const db = detectDB(analyser, dataArray);

                // 将分贝值存入采样数据数组
                samples.push(db);

                // 计算平均噪音水平
                const validSamples = samples.filter(sample => isFinite(sample));
                const averageNoise = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;

                // 更新时间累计平均分贝值显示
                avgDbDisplay.textContent = '时间累计平均分贝值: ' + averageNoise.toFixed(2);

                // 每 100ms 采样一次
                setTimeout(sampleNoise, sampleInterval);
            }
        };

        // 开始采样
        sampleNoise();
    });
}

window.onload = async () => {
    const localSilenceThreshold = localStorage.getItem('SILENCE_THRESHOLD');
    if (!localSilenceThreshold) {
        try {
            // 检查是否支持 getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持 getUserMedia API');
            }

            // 获取音频流
            let audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            console.log("[phone.js][window.onload] 创建 getUserMedia 音频流成功...");

            // 初始化音频分析器
            const { analyser, dataArray } = await initAudioAnalyser(audioStream);

            // 在开始录音前进行环境噪音检测
            SILENCE_THRESHOLD = await calibrateNoiseLevel(analyser, dataArray);
            console.log('[phone.js][window.onload] 环境噪音校准完成, 静音阈值:', SILENCE_THRESHOLD);
            localStorage.setItem('SILENCE_THRESHOLD', SILENCE_THRESHOLD);
        } catch (error) {
            console.error("[phone.js][window.onload] 获取音频流失败:", error);
            // 可以显示一个友好的错误提示
            alert("无法访问麦克风，请确保已授予相关权限");
        }
    } else {
        avgDbDisplay.style.display = 'none';
    }
}

/* 处理环境噪音获取 end
----------------------------------------------------------*/
