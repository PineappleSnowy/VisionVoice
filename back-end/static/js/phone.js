import { detectDB } from './lib/audioUtils.js';
import { initAudioAnalyser } from './lib/audioUtils.js';

// 创建socket连接，并附上token用于后端验证
const token = localStorage.getItem('token');
const socket = io({
    pingTimeout: 60000,  // 设置较大的 pingTimeout
    pingInterval: 30000,  // 设置较大的 pingInterval
    query: {
        token: token
    }
});

let stream;
const toggleCamera = document.querySelector('.toggleCamera');  // 切换摄像头
const openCamera = document.querySelector('.openCamera');  // 打开摄像头
const container = document.querySelector('.container');
const video = document.querySelector('video');
const img = document.querySelector('img');
const waveShape = document.querySelector('#waveShape');
let videoChat = false;
let isFrontCamera = false;
let state = 0;  // 状态标识，0：普通对话 1：避障 2：寻物
let obstacle_avoid = false;  // 防止多次启动避障
let find_item = false;  // 防止多次启动寻物
let rec_result = "";
let speech_rec_ready = false;
let image_upload_ready = false;
let audio_stop = false;  // 音频阻断标识
let vudio = null;

// 标识是否正在播放音频
let isPlaying = false;
// 检查静音的定时器
let checkSilenceTimer = null;

// 获取音频播放器 DOM 元素
const audioPlayer = document.getElementById('audioPlayer');

// 用于存放音频的队列
let audioQueue = [];

// 全局定义checkSilence，防止未定义错误
function checkSilence() { }

// 停止音频播放
function stopAudio() {
    curr_talk_index += 1;
    if (curr_talk_index >= Number.MAX_SAFE_INTEGER) {
        curr_talk_index = 0;
    }
    audio_stop = true;
    audioPlayer.pause()
    audioQueue = [];
    isPlaying = false;
}

// 开始音频播放
function startAudio() {
    audio_stop = false;
    audioQueue = [];
}

// 是否允许打断以及当前功能的状态标识
const statusDiv = document.querySelector('.controller .status');

// 打断说话的按钮
const shutUpSpeakButton = document.querySelector('.shutUpSpeak');
shutUpSpeakButton.addEventListener('click', shutUpAgentSpeak);

// 打断说话实现
function shutUpAgentSpeak() {
    stopAudio()
    startCheckSilenceTimer()
    finishShutUpStatus()
}

// 进入打断状态
function startShutUpStatus() {
    if (state === 0) {
        statusDiv.textContent = '点击打断';
        shutUpSpeakButton.style.display = 'flex';
        waveShape.style.display = 'none';
    }
}

// 退出打断状态
function finishShutUpStatus() {
    shutUpSpeakButton.style.display = 'none';
    waveShape.style.display = 'block';
    statusDiv.textContent = "正在听"

    if (vudio.pause()) { vudio.dance() }
}

let micClose = localStorage.getItem('micClose');
if (micClose === null) {
    micClose = false;
    localStorage.setItem('micClose', micClose);
} else {
    micClose = micClose === 'true';
}

if (micClose) {
    document.querySelector('.micButton').setAttribute('aria-label', '打开麦克风');
    stopCheckSilenceTimer();
    document.querySelector('.micButton').classList.add('mic-off');
}
else {
    document.querySelector('.micButton').setAttribute('aria-label', '关闭麦克风');
}

document.querySelector('.micButton').addEventListener('click', function () {
    if (document.querySelector('.micButton').classList.toggle('mic-off')) {
        document.querySelector('.micButton').setAttribute('aria-label', '打开麦克风');
        micClose = true;
        localStorage.setItem('micClose', micClose);
        stopCheckSilenceTimer();
    } else {
        document.querySelector('.micButton').setAttribute('aria-label', '关闭麦克风');
        micClose = false;
        localStorage.setItem('micClose', micClose);
        startCheckSilenceTimer();
    }
});

let captionClose = localStorage.getItem('captionClose');
if (captionClose === null) {
    captionClose = false;
    localStorage.setItem('captionClose', captionClose);
} else {
    captionClose = captionClose === 'true';
}

if (captionClose) {
    document.querySelector('.captionButton').setAttribute('aria-label', '打开字幕');
    document.querySelector('.captionButton').classList.add('caption-off');
}
else {
    document.querySelector('.captionButton').setAttribute('aria-label', '关闭字幕');
    document.getElementById('captionModal').style.display = 'block';
}

document.querySelector('.captionButton').addEventListener('click', function () {
    if (document.querySelector('.captionButton').classList.toggle('caption-off')) {
        document.querySelector('.captionButton').setAttribute('aria-label', '打开字幕');
        captionClose = true;
        localStorage.setItem('captionClose', captionClose);
        document.getElementById('captionModal').style.display = 'none';
    } else {
        document.querySelector('.captionButton').setAttribute('aria-label', '关闭字幕');
        captionClose = false;
        localStorage.setItem('captionClose', captionClose);
        document.getElementById('captionModal').style.display = 'block';
    }
});

// 摄像头开关逻辑
openCamera.addEventListener('click', async () => {
    try {
        videoChat = !videoChat;
        if (videoChat) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
                video.srcObject = stream;
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    alert('请允许访问您的摄像头！');
                } else if (err.name === 'NotFoundError') {
                    alert('未找到可用的摄像头！');
                } else {
                    alert('发生错误: ' + err.message);
                }
            }

            video.style.display = 'block';
            container.classList.add('shifted');
            toggleCamera.style.display = 'block';
            img.style.display = 'none';
            goBack.style.color = 'white';
            toggleCamera.style.color = 'white';
        } else {
            // 关闭摄像头时退出部分功能模式
            document.querySelector('.endFunc').click();

            stream.getTracks().forEach((track) => {
                track.stop();
            });
            video.srcObject = null;
            video.style.display = 'null';
            container.classList.remove('shifted');
            toggleCamera.style.display = 'none';
            img.style.display = 'block';
            goBack.style.color = 'white';
        }
    } catch (err) {
        console.log(err);
    }

});

// 切换前后置摄像头
toggleCamera.addEventListener('click', async () => {
    if (stream) {
        isFrontCamera = !isFrontCamera;
        // Stop previous stream
        stream.getTracks().forEach((track) => {
            track.stop();
        });
        if (isFrontCamera) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                video.srcObject = stream;
                video.style.transform = 'scaleX(-1)';
            } catch (err) {
                alert(err);
            }
        } else {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
                video.style.transform = 'none';
            } catch (err) {
                alert(err);
            }
        }
    }
});

let curr_talk_index = 0;

// 发起大模型请求
function formChat(talk_index) {
    /*当开启视频聊天时（videoChat==true），要求speech_rec_ready和image_upload_ready都是true；
    否则仅要求speech_rec_ready是true*/
    if (speech_rec_ready && (image_upload_ready || ~videoChat)) {
        speech_rec_ready = false;
        image_upload_ready = false;
        if (state == 0) {
            document.getElementById('captionText').textContent = '';
            const token = localStorage.getItem('token');
            const talk_speed = localStorage.getItem('speed') || 8;
            startAudio()
            fetch(`/agent/chat_stream?query=${rec_result}&agent=${selectedAgent}&videoOpen=${videoChat}`, {
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

                        // 如果当前不是结束标志，则将文本进行语音合成
                        if (!(jsonString.includes("<END>")) && !audio_stop && talk_index == curr_talk_index) {
                            document.getElementById('captionText').textContent += jsonString;
                            socket.emit("agent_stream_audio", jsonString, talk_speed);
                        }

                        // 继续读取下一个数据
                        return reader.read().then(processText);
                    });
                })
                .catch(error => {
                    console.error('[phone.js][socket.on][agent_speech_recognition_finished] Error fetching stream:', error);
                });
        }

    }
}

// 将视频帧发往后端的函数
function captureAndSendFrame() {
    if (videoChat) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        const token = localStorage.getItem('token');
        const talk_speed = localStorage.getItem('speed') || 8;
        fetch('/agent/upload_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 添加 token 到请求头
            },
            body: JSON.stringify({ "image": imageData, "state": state })
        })
            .then(response => response.json())
            .then(data => {
                if (data["message"] != "Success") {
                    console.log('Error:', data);
                    captureAndSendFrame()
                }
                else {
                    console.log('Frame uploaded successfully:', data);
                    if (state == 1 && "obstacle_info" in data) {
                        if (data["obstacle_info"].length != 0) {
                            const detected_item = data["obstacle_info"][0]["label"];
                            const distant = data["obstacle_info"][0]["distant"]
                            const left_loc = data["obstacle_info"][0]["left"]
                            const top_loc = data["obstacle_info"][0]["top"]
                            const obstacle_loc_info = `画面${calcLocation(top_loc, left_loc)}${detected_item}距离${distant.toFixed(2)}米。`;
                            document.getElementById('captionText').textContent = obstacle_loc_info;
                            socket.emit("agent_stream_audio", obstacle_loc_info, talk_speed);
                            // 设置等待时间
                            setTimeout(function () {
                                captureAndSendFrame()
                            }, 1);
                        }
                        else { captureAndSendFrame() }
                    }

                    else if (state == 2 && "item_info" in data) {
                        if (data['item_info'].length != 0) {
                            const left_loc = data["item_info"][0]["left"]
                            const top_loc = data["item_info"][0]["top"]
                            const item_loc_info = `${find_item_name}在画面${calcLocation(top_loc, left_loc)}。`;
                            document.getElementById('captionText').textContent = item_loc_info;
                            socket.emit("agent_stream_audio", item_loc_info, talk_speed);
                            setTimeout(function () {
                                captureAndSendFrame()
                            }, 1);
                        }
                        else { captureAndSendFrame() }
                    }

                    else if (state == 0) {
                        image_upload_ready = true;
                        formChat(curr_talk_index)
                    }
                }
            })
            .catch(error => {
                console.error('Error uploading frame:', error);
            });
    }
}

// 前端避障，尚在开发
// async function loadModel() {
//     const model = await cocoSsd.load();
//     return model;
// }

// async function detectFrame(model) {
//     const canvas = document.querySelector('.frame-window');
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const context = canvas.getContext('2d');
//     const predictions = await model.detect(video);
//     context.clearRect(0, 0, canvas.width, canvas.height);
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);
//     predictions.forEach(prediction => {
//         context.beginPath();
//         context.rect(...prediction.bbox);
//         context.lineWidth = 2;
//         context.strokeStyle = 'red';
//         context.fillStyle = 'red';
//         context.font = '0.2rem Arial';
//         context.stroke();
//         context.fillText(prediction.class, prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10);
//     });
//     canvas.style.display = 'block';
//     video.style.display = 'none';
//     requestAnimationFrame(() => detectFrame(model));
// }

// async function main() {
//     const model = await loadModel();
//     detectFrame(model);
// }

function calcLocation(top, left) {
    let x_describe = '';
    let y_describe = '';
    let final_describle = '';

    if (left <= 0.33)
        x_describe = '左'
    else if (left <= 0.67)
        x_describe = '中'
    else if (left <= 1)
        x_describe = '右'

    if (top <= 0.33)
        y_describe = '上'
    else if (top <= 0.67)
        y_describe = '中'
    else if (top <= 1)
        y_describe = '下'

    if (x_describe != '中' || y_describe != '中')
        final_describle = x_describe + y_describe;
    else
        final_describle = "中央"

    return final_describle
}

// phone 界面大小适配
const html = document.querySelector('html');
html.style.fontSize = (window.innerWidth * 100) / 412 + 'px';

const goBack = document.querySelector('.goBack');
const hangUp = document.querySelector('.hangUp');

/**
 * 用户状态
 * 0: 等待说话
 * 1: 正在说话
 */
let userStatus = 0;

goBack.addEventListener('click', () => {
    window.location.href = '/agent';
});

hangUp.addEventListener('click', () => {
    window.location.href = '/agent';
});

/* 处理音量大小测定 start
----------------------------------------------------------*/

// 在页面右上角添加新容器，用于显示当前音频的平均分贝值
const dbDisplay = document.createElement('div');
dbDisplay.style.cssText = 'width: 30%; font-size: 10px; position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; border-radius: 4px; z-index: 1000;';
container.appendChild(dbDisplay);

// 获取静音阈值
let SILENCE_THRESHOLD = localStorage.getItem('SILENCE_THRESHOLD');
if (SILENCE_THRESHOLD) {
    console.log('[phone.js][window.onload] 获取静音阈值:', SILENCE_THRESHOLD);
}
// 如果本地静音阈值不存在，则设置默认值
else {
    SILENCE_THRESHOLD = -30;
}
/**
 * @description 检测用户是否已经停止讲话
 * @returns {Boolean} 用户是否已经停止讲话
 */
function detectSilence(analyser, dataArray) {
    const db = detectDB(analyser, dataArray);

    // 更新分贝值
    dbDisplay.textContent = "当前分贝值: " + db;

    return db < SILENCE_THRESHOLD;
}

/* 处理音量大小测定 end
----------------------------------------------------------*/

// 取消检查静音的计时器
function stopCheckSilenceTimer() {
    clearInterval(checkSilenceTimer);
    checkSilenceTimer = null;
}

// 启动检查静音的计时器
function startCheckSilenceTimer() {
    // 使用 setInterval，每隔一段时间（ms）检查一次用户是否停止讲话
    if (!micClose) {
        checkSilenceTimer = setInterval(checkSilence, 100);
    }
}

// 退出避障
function exit_obstacle_void() {
    state = 0
    obstacle_avoid = false;
    // socket.emit("agent_stream_audio", "##<state=1 exit>");
}

// 退出寻物
function exit_find_item() {
    state = 0
    find_item = false;
    const talk_speed = localStorage.getItem('speed') || 8;
    socket.emit("agent_stream_audio", "##<state=2 exit>", talk_speed);
}

// 退出功能模式
function exitFuncModel() {
    document.querySelector('.endFunc').style.display = 'none';
    if (obstacle_avoid) {
        stopAudio()
        startCheckSilenceTimer()
        finishShutUpStatus()
        exit_obstacle_void()
    }
    else if (find_item) {
        stopAudio()
        startCheckSilenceTimer()
        finishShutUpStatus()
        exit_find_item()
    }
}

// 避障启动函数
function startAvoidObstacle() {
    state = 1;
    stopCheckSilenceTimer()
    stopAudio()
    finishShutUpStatus()
    statusDiv.textContent = "避障模式";
    if (vudio.dance()) { vudio.pause() }

    waveShape.style.display = 'none';
    document.querySelector('.endFunc').style.display = 'flex';

    if (!videoChat) {
        openCamera.click()
    }
    if (!obstacle_avoid) {
        obstacle_avoid = true;
        document.getElementById('captionText').textContent = '避障模式已开启'
        const talk_speed = localStorage.getItem('speed') || 8;
        socket.emit("agent_stream_audio", "##<state=1>", talk_speed);
        startAudio()
    }
}

// 寻物启动函数
let find_item_name = '';

window.startFindItem = function (item_name) {
    state = 2;
    stopCheckSilenceTimer();
    stopAudio();
    finishShutUpStatus();
    statusDiv.textContent = "寻物模式";
    if (vudio.dance()) { vudio.pause(); }

    document.querySelector('.endFunc').style.display = 'flex';

    closeModalButton.click();
    if (!videoChat) {
        openCamera.click();
    }
    if (!find_item) {
        find_item = true;
        find_item_name = item_name;
        document.getElementById('captionText').textContent = `开始寻找${item_name}`
        const talk_speed = localStorage.getItem('speed') || 8;
        socket.emit("agent_stream_audio", `##<state=2>${item_name}`, talk_speed);
        startAudio();
    }
}

window.onload = async () => {
    // 根据当前智能体选择设置智能体头像
    const botImage = document.querySelector('.container img');
    if (selectedAgent === 'psychologicalAgent') {
        botImage.src = '../static/images/psychologicalAgent.jpg';
    } else {
        botImage.src = '../static/images/defaultAgent.jpg';
    }

    // 检查 URL 中的查询参数
    const urlParams1 = new URLSearchParams(window.location.search);
    const camera = urlParams1.get('camera');

    // 如果查询参数中包含 camera=on，则打开摄像头
    if (camera === 'on') {
        openCamera.click();
    }

    // 音频上下文
    let audioContext;
    // 录制器
    let rec;
    // 音频流
    let input;

    // 获取音频流
    let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[phone.js][window.onload] 创建 getUserMedia 音频流成功...");

    // 初始化音频分析器
    const { analyser, dataArray } = await initAudioAnalyser(audioStream);

    // 静音定时器
    let silenceTimer = null;

    // 用于表示对话开始
    // 用户刚进入页面时，默认没有说过话，防止还没说话就上传音频
    let conversationStarted = false;

    // 静音持续时间阈值（单位：毫秒）
    const SILENCE_DURATION = 2000;

    // 是否录制完毕
    let recordingFinished = false;

    // 检测用户是否停止讲话
    checkSilence = function () {
        console.log('[phone.js][checkSilence] 检测用户是否正在说话中...');

        // 如果用户停止讲话，则设置短暂的静音等待
        if (detectSilence(analyser, dataArray)) {

            // 如果静音定时器不存在，且用户已经说过话了，则设置静音定时器
            if (!silenceTimer && conversationStarted) {
                silenceTimer = setTimeout(() => {
                    // 停止检测用户是否正在说话
                    if (checkSilenceTimer) {
                        stopCheckSilenceTimer()
                    }

                    // 停止录音
                    stopRecording();

                    // 创建 WAV blob 并传递给 createDownloadLink
                    rec.exportWAV(upload_audio);

                    // 是否录制完毕
                    recordingFinished = true;
                    startShutUpStatus()

                }, SILENCE_DURATION);
            }
            if (userStatus == 1) {
                console.log('[phone.js][checkSilence] 用户停止讲话...');
                userStatus = 0;
            }
        }
        // 如果用户正在讲话，则设置录音状态
        else {
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }

            // 如果用户还没有说过话，则设置对话开始标志
            if (!conversationStarted) {
                conversationStarted = true;
            }

            if (!recordingFinished) {
                continueRecording();
            } else {
                startRecording();
                recordingFinished = false;
            }
            if (userStatus == 0) {
                console.log('[phone.js][checkSilence] 用户正在讲话...');
                userStatus = 1;
            }
        }
    }

    startCheckSilenceTimer()

    // ----- 音频波形可视化 start -----
    vudio = new window.Vudio(audioStream, waveShape, {
        effect: 'waveform',
        accuracy: 16,
        width: window.innerWidth * 100 / 412 * 1.5,
        height: window.innerWidth * 100 / 412 * 1,
        waveform: {
            maxHeight: 80,
            minHeight: 0,
            spacing: 5,
            color: '#fff',
            shadowBlur: 0,
            shadowColor: '#f00',
            fadeSide: true,
            horizontalAlign: 'center',
            verticalAlign: 'middle',
            radius: 20
        }
    });
    vudio.dance();
    // ----- 音频波形可视化 end -----


    /* 处理音频录制 start 
    ------------------------------------------------------------*/

    function startRecording() {
        if (state == 0) {
            captureAndSendFrame()
        }
        // 创建新的音频上下文，这是 Web Audio API 的核心对象
        audioContext = new AudioContext();

        // 将麦克风的音频流 (stream) 转换为音频源节点
        input = audioContext.createMediaStreamSource(audioStream);

        // 创建一个新的 Recorder 实例，用于录制音频
        // numChannels: 1 表示使用单声道录音，用于减少文件大小，如果声道为 2，文件会变成两倍大小
        rec = new Recorder(input, { numChannels: 1 })

        // 启动录制过程
        rec.record()

    }

    function continueRecording() {

        // 启动录制过程
        rec.record()

    }

    function stopRecording() {
        console.log("[phone.js][stopRecording] 停止录音...");

        // 告诉录制器停止录制
        rec.stop();

    }

    function upload_audio(blob) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function (e) {
            if (this.readyState === 4) {
                // console.log("[phone.js][upload_audio] response:", e.target.responseText);
            }
        };
        const fd = new FormData();
        fd.append("audio_data", blob, "recorded_audio.wav");
        const sampleRate = audioContext.sampleRate;
        fd.append("sample_rate", sampleRate);
        const token = localStorage.getItem('token');
        console.log("[phone.js][upload_audio] 上传音频数据...");
        xhr.open("POST", "/agent/upload_audio", true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.send(fd);
    }
    /* 处理音频录制 end 
    ------------------------------------------------------------*/

    // 开始录音
    startRecording();

    /* 处理音频播放 start 
    ------------------------------------------------------------*/

    /**
     * @description 监听后端发送的 agent_play_audio_chunk 事件
     * - 音频播放模块的起点
     * - 后端会将音频数据分段发送过来，该函数需要将这些音频数据分段存储到队列中，并开始播放
     */
    socket.on('agent_play_audio_chunk', function (data) {
        const user = localStorage.getItem('user');
        if (data.user !== user) return;
        if (!audio_stop) {
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
            // 表示音频播放结束
            isPlaying = false;

            if (state === 0) {
                // 开始检测用户是否正在说话
                startCheckSilenceTimer()
                // 设置音频动画状态
                finishShutUpStatus()
            }

            console.log('[phone.js][playNextAudio] 音频队列中没有音频数据，停止播放...');

            return;
        }
        console.log('[agent.js][playNextAudio] audioQueue:', audioQueue);

        // 从队列中取出下一个音频
        const nextAudioData = audioQueue.shift();

        // 如果音频数据不为空，则播放音频
        if (nextAudioData) {

            // 标识音频正在播放
            isPlaying = true;

            // 将音频数据转换为 Blob 对象
            const audioBlob = new Blob([nextAudioData], { type: 'audio/mp3' });

            // 创建音频 URL
            const audioURL = URL.createObjectURL(audioBlob);

            // 设置音频播放器元素的播放源
            audioPlayer.src = audioURL;

            // 音频播放前先确认静音定时器取消
            stopCheckSilenceTimer()

            // 播放音频
            audioPlayer.play().then(() => {
                console.log('[phone.js][playNextAudio] 音频片段播放中...');
            }).catch(error => {
                console.log('[phone.js][playNextAudio] 音频片段播放失败.', error);
            });
            startShutUpStatus()
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

    /* 处理音频播放 end
    ------------------------------------------------------------*/


    /* 处理音频识别 start 
    ------------------------------------------------------------*/

    /**
     * @description 语音识别结束后，将识别结果发送给后端，并开始语音对话
     */

    socket.on('agent_speech_recognition_finished', async function (data) {
        const user = localStorage.getItem('user');
        if (data.user !== user) return;
        rec_result = data['rec_result'];

        if (!rec_result) {
            console.log('[phone.js][socket.on][agent_speech_recognition_finished] 音频识别结果为空.');
            return;
        }
        console.log('[phone.js][socket.on][agent_speech_recognition_finished] 音频识别结果: %s', rec_result);

        // 根据语音识别的结果执行不同的任务
        if (rec_result.includes("避") || rec_result.includes("模")) {  // 加强鲁棒性
            startAvoidObstacle()  // 进入避障模式
        }

        else if (rec_result.includes("寻")) {
            findItemButton.click()  // 进入寻物模式
        }

        // 仅当对话模式是修改speech_rec_ready为true
        else if (state == 0) {
            speech_rec_ready = true;
            // 使用定位
            if (rec_result.includes("位置")) {
                let location_result = await requestLocaion();
                let prompt = location_result['prompt'];
                rec_result = prompt + rec_result;
            }
            formChat(curr_talk_index);
        }
    })

    // 避障socket
    socket.on('obstacle_avoid', function (data) {
        const user = localStorage.getItem('user');
        if (data.user !== user) return;
        const flag = data["flag"];
        if (flag == "begin") {
            captureAndSendFrame();
        }
    })

    // 寻物socket
    socket.on('find_item', function (data) {
        const user = localStorage.getItem('user');
        if (data.user !== user) return;
        const flag = data["flag"];
        if (flag == "begin") {
            captureAndSendFrame();
        }
    })

    /* 处理音频识别 end 
    ------------------------------------------------------------*/

    // 退出功能键逻辑
    const endFuncButton = document.querySelector('.endFunc');
    endFuncButton.addEventListener('click', () => {
        endFuncButton.style.display = 'none';
        exitFuncModel()
    });

    // 避障逻辑
    const obstacleAvoidButton = document.querySelector('.optionButton.avoidObstacle');
    obstacleAvoidButton.addEventListener('click', () => {
        exitFuncModel();
        startAvoidObstacle();
        // 前端避障，处开发阶段，尚未启用
        // main()
    });

    // 寻物逻辑
    const findItemModal = document.getElementById('findItemModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const overlay = document.getElementById('overlay');

    const findItemButton = document.querySelector('.optionButton.findItem');
    findItemButton.addEventListener('click', () => {
        exitFuncModel();
        overlay.style.display = 'block';
        findItemModal.style.display = 'block';
        loadGallery();
    });

    closeModalButton.addEventListener('click', () => {
        overlay.style.display = 'none';
        findItemModal.style.display = 'none';
        const gallery = document.getElementById('gallery');
        while (gallery.firstChild) {
            gallery.removeChild(gallery.firstChild);
        }
    });

    function loadGallery() {
        const token = localStorage.getItem('token');
        fetch('/images', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                const gallery = document.getElementById('gallery');
                data.forEach(image => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.innerHTML = `
                            <button onclick="startFindItem('${image.name}')">
                                <img src="${image.url}" alt="${image.name}">
                                <p>${image.name}</p>
                            </button>
                        `;
                    gallery.appendChild(item);
                });
            })
            .catch(error => console.error('Error fetching images:', error));
    }

    // 定位逻辑
    let H5_locate_key, geocode_key;
    // 获取api_key（存危险，需优化）
    fetch('/gaode_api')
        .then(response => response.json())
        .then(data => {
            // 将 JSON 数据转换为字符串
            H5_locate_key = data.H5_locate;
            geocode_key = data.geocode;
            let script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${H5_locate_key}`
            document.head.appendChild(script);
        })
        .catch(error => {
            console.error('Error fetching JSON file:', error);
        });

    //解析定位结果
    function onComplete(location_data) {
        let str = [];
        const geoLocation = location_data.position;
        str.push('定位成功！\n定位结果：' + location);
        str.push('定位类别：' + location_data.location_type);
        if (location_data.accuracy) {
            str.push('精度：' + location_data.accuracy + ' 米');
        }  // 如为浏览器精确定位结果则没有精度信息
        str.push('是否经过偏移：' + (location_data.isConverted ? '是' : '否'));
        console.log(str.join('\n'));

        const apiUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${geocode_key}&location=${geoLocation}&poitype=&radius=&extensions=all&roadlevel=0`;

        return fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const formattedAddress = data.regeocode.formatted_address;
                console.log('位置信息:', formattedAddress);
                const prompt = `我当前的位置是：${formattedAddress}，定位精度${location_data.accuracy}米。请结合环境信息简洁回答。我的提问是：`;
                const location_info = `你位于${formattedAddress}，定位精度${location_data.accuracy}米。`;
                return { prompt, location_info };
            })
            .catch(error => {
                console.error('请求出错:', error);
                const prompt = `你地理编码逆解析失败，仅可知我当前经纬坐标为(${geoLocation})。请结合环境信息简洁回答。我的提问是：`;
                const location_info = `地理编码逆解析失败，你当前经纬坐标为：${geoLocation}。`;
                return { prompt, location_info };
            });
    }

    // 解析定位错误信息
    function onError(data) {
        console.error('定位失败。\n失败原因排查信息:' + data.message + '\n浏览器返回信息：' + data.originMessage)
        let prompt = "你定位失败，无法获得我的位置信息。请结合环境信息简洁回答。我的提问是："
        let location_info = "定位超时，无法获得你的位置信息。"
        return { 'prompt': prompt, 'location_info': location_info }
    }

    function requestLocaion() {
        return new Promise((resolve, reject) => {
            const timeout = 5000; // 设置超时时间
            const startTime = Date.now();

            const checkAmapReady = setInterval(() => {
                if (typeof AMap !== 'undefined') {
                    clearInterval(checkAmapReady);
                    AMap.plugin('AMap.Geolocation', function () {
                        const geolocation = new AMap.Geolocation({
                            enableHighAccuracy: true,  // 是否使用高精度定位，默认:true
                            timeout: 5000,  // 超过多少毫秒后停止定位，默认：5s
                        });
                        geolocation.getCurrentPosition(function (status, result) {
                            if (status == 'complete') {
                                // 成功时的处理
                                onComplete(result).then(resolve).catch(reject);
                            } else {
                                // 失败时的处理
                                resolve(onError(result));
                            }
                        });
                    });
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkAmapReady);
                    reject(new Error('AMap is not defined within the timeout period'));
                }
            }, 100);
        });
    }

    const currLocButton = document.querySelector('.optionButton.currentLocation');
    currLocButton.addEventListener('click', async () => {
        exitFuncModel();
        stopCheckSilenceTimer();
        stopAudio();
        finishShutUpStatus();
        statusDiv.textContent = '获取位置';
        if (vudio.dance()) { vudio.pause() }
        let location_result = await requestLocaion();
        let location_info = location_result['location_info']
        document.getElementById('captionText').textContent = location_info;
        const talk_speed = localStorage.getItem('speed') || 8;
        socket.emit("agent_stream_audio", location_info, talk_speed);
        startAudio();
    });

    const envDesButton = document.querySelector('.optionButton.environmentDescription');
    envDesButton.addEventListener('click', async () => {
        if (!videoChat) { await openCamera.click() }
        exitFuncModel();
        stopCheckSilenceTimer();
        stopAudio();
        finishShutUpStatus();
        statusDiv.textContent = '环境描述';
        if (vudio.dance()) { vudio.pause() }

        let complexity = localStorage.getItem('complexity');
        if (complexity === null) {
            complexity = "详细";
            localStorage.setItem('complexity', complexity);
        }
        let prompt_des = "";
        if (complexity == "详细") {
            prompt_des = "充分捕捉环境信息，客观详细地";
        }
        else if (complexity == "简洁") {
            prompt_des = "简洁地";
        }
        rec_result = `请${prompt_des}描述环境。`;
        speech_rec_ready = true;
        captureAndSendFrame();
    });

    // 检查 URL 中的查询参数
    const urlParams = new URLSearchParams(window.location.search);
    const avoidObstacle = urlParams.get('avoidObstacle');
    const findItem = urlParams.get('findItem');
    const envDescription = urlParams.get('envDescription');
    const currentLocation = urlParams.get('currentLocation');

    // 如果查询参数中包含 avoidObstacle=true，则触发避障按钮点击事件
    if (avoidObstacle === 'true') {
        document.querySelector('.optionButton.avoidObstacle').click();
    }

    // 如果查询参数中包含 findItem=true，则触发寻物按钮点击事件
    else if (findItem === 'true') {
        document.querySelector('.optionButton.findItem').click();
    }

    // 如果查询参数中包含 envDescription=true，则触发环境描述按钮点击事件
    else if (envDescription === 'true') {
        document.querySelector('.optionButton.environmentDescription').click();
    }

    // 如果查询参数中包含 currentLocation=true，则触发获取位置按钮点击事件
    else if (currentLocation === 'true') {
        document.querySelector('.optionButton.currentLocation').click();
    }
}