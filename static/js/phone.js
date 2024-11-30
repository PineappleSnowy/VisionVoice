// 创建socket连接，并附上token用于后端验证
const token = localStorage.getItem('token');
const socket = io({
    query: {
        token: token
    }
});

// 摄像头开关逻辑
let stream;
const toggleCamera = document.querySelector('.toggleCamera');  // 切换摄像头
const openCamera = document.querySelector('.openCamera');  // 打开摄像头
const container = document.querySelector('.container');
const video = document.querySelector('video');
const img = document.querySelector('img');
const audio = document.querySelector('#audio');
const waveShape = document.querySelector('#waveShape');
let videoChat = false;
let isFrontCamera = false;
let state = 0;  // 状态标识，0：普通对话 1：避障 2：寻物
let obstacle_avoid = false;

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
            // 关闭摄像头时退出避障模式
            if (state == 1) {
                exit_obstacle_void()
            }

            stream.getTracks().forEach((track) => {
                track.stop();
            });
            video.srcObject = null;
            video.style.display = 'null';
            container.classList.remove('shifted');
            toggleCamera.style.display = 'none';
            img.style.display = 'block';
            goBack.style.color = 'black';
        }
    } catch (err) {
        console.log(err);
    }

});

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
            } catch (err) {
                alert(err);
            }
        } else {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
            } catch (err) {
                alert(err);
            }
        }
    }
});

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
                console.log('Frame uploaded successfully:', data);
                if (state == 1) {
                    if (data["obstacle_info"].length != 0) {
                        const detected_item = data["obstacle_info"][0]["label"];
                        const distant = data["obstacle_info"][0]["distant"]
                        socket.emit("agent_stream_audio", `画面右侧${detected_item}距离${distant.toFixed(2)}米。`);
                    }
                    // 设置等待时间
                    setTimeout(function () {
                        captureAndSendFrame()
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error uploading frame:', error);
            });
    }
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

/**
 * @function initAudioAnalyser
 * @description 初始化音频分析器
 * @param {MediaStream} stream 音频流
 * @returns {Object} 音频分析器和数据数组
 */
async function initAudioAnalyser(stream) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    return {
        analyser,
        dataArray
    };
}

// 使用 let 关键字修饰静音阈值
let SILENCE_THRESHOLD = -20;

/**
 * @description 校准环境噪音，修改全局的 SILENCE_THRESHOLD 值
 * @param {AnalyserNode} analyser 音频分析器
 * @param {Float32Array} dataArray 数据数组
 * @param {Number} duration 检测时长，单位：毫秒
 * @returns {Promise<Number>} 环境噪音阈值
 */
async function calibrateNoiseLevel(analyser, dataArray, duration = 1000) {
    console.log('[phone.js][calibrateNoiseLevel] 开始检测环境噪音...');
    return new Promise((resolve) => {
        const samples = [];
        const sampleInterval = 100; // 每100ms采样一次
        const startTime = Date.now();

        const sampleNoise = () => {
            if (Date.now() - startTime >= duration) {

                // 计算平均噪音水平
                const averageNoise = samples.reduce((a, b) => a + b, 0) / samples.length;

                // 设置阈值为平均噪音上浮5分贝
                const newThreshold = averageNoise + 5;
                console.log(`[phone.js][calibrateNoiseLevel] 环境噪音基准: ${averageNoise.toFixed(2)}dB, 设置阈值: ${newThreshold.toFixed(2)}dB`);
                resolve(newThreshold);
                return;
            }

            analyser.getFloatTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += Math.abs(dataArray[i]);
            }
            const average = sum / dataArray.length;
            const db = 20 * Math.log10(average);
            samples.push(db);

            setTimeout(sampleNoise, sampleInterval);
        };

        sampleNoise();
    });
}

/**
 * @description 检测用户是否已经停止讲话
 * @param {AnalyserNode} analyser 音频分析器
 * @param {Float32Array} dataArray 数据数组
 * @returns {Boolean} 用户是否已经停止讲话
 */
function detectSilence(analyser, dataArray) {
    analyser.getFloatTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i]);
    }
    const average = sum / dataArray.length;
    const db = 20 * Math.log10(average);
    return db < SILENCE_THRESHOLD;
}

function exit_obstacle_void() {
    state = 0
    obstacle_avoid = false;
    socket.emit("agent_stream_audio", "##<state=1 exit>");
}

window.onload = async () => {
    // 检查 URL 中的查询参数
    const urlParams = new URLSearchParams(window.location.search);
    const camera = urlParams.get('camera');

    // 如果查询参数中包含 camera=on，则打开摄像头
    if (camera === 'on') {
        openCamera.click();
    }

    // 获取音频流
    let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[phone.js][window.onload] 创建 getUserMedia 音频流成功...");

    // 初始化音频分析器
    const { analyser, dataArray } = await initAudioAnalyser(audioStream);

    // 在开始录音前进行环境噪音检测
    SILENCE_THRESHOLD = await calibrateNoiseLevel(analyser, dataArray);
    console.log('[phone.js][window.onload] 环境噪音校准完成, 静音阈值:', SILENCE_THRESHOLD);

    // 静音定时器
    let silenceTimer;

    // 静音持续时间阈值（单位：毫秒）
    const SILENCE_DURATION = 2000;

    // 是否录制完毕
    let recordingFinished = false;

    // 检测用户是否停止讲话
    function checkSilence() {
        console.log('[phone.js][checkSilence] 检测用户是否正在说话中...');

        // 如果用户停止讲话，则设置短暂的静音等待
        if (detectSilence(analyser, dataArray)) {

            // 如果静音定时器不存在，则设置静音定时器
            if (!silenceTimer) {
                silenceTimer = setTimeout(() => {
                    // 停止检测用户是否说话
                    clearTimeout(checkSilenceTimer);
                    checkSilenceTimer = null;

                    // 停止录音
                    stopRecording();

                    // 创建 WAV blob 并传递给 createDownloadLink
                    rec.exportWAV(upload_audio);

                    // 是否录制完毕
                    recordingFinished = true;

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

    // 使用 setInterval，每 333ms 检查一次用户是否停止讲话
    let checkSilenceTimer = setInterval(checkSilence, 333);

    // ----- 音频波形可视化 start -----
    const waveShape = document.querySelector('#waveShape');
    let vudio;
    vudio = new window.Vudio(audioStream, waveShape, {
        effect: 'waveform',
        accuracy: 16,
        width: window.innerWidth * 100 / 412 * 1.5,
        height: window.innerWidth * 100 / 412 * 1,
        waveform: {
            maxHeight: 80,
            minHeight: 0,
            spacing: 5,
            color: '#000',
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
        // 创建新的音频上下文，这是Web Audio API的核心对象
        audioContext = new AudioContext();

        // 将麦克风的音频流(stream)转换为音频源节点
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
            playNextAudio();
        }

        // 如果正在播放音频，则暂停波形图动画（波形动画暂停表示大模型正在讲话）
        if (isPlaying) {
            vudio.pause();
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

            // 开始检测用户是否正在说话
            checkSilenceTimer = setInterval(checkSilence, 333);

            console.log('[phone.js][playNextAudio] 音频队列中没有音频数据，停止播放...');

            // 如果波形图动画处于暂停状态，则开始播放（波形动画启动表示用户可以讲话）
            if (vudio.paused()) {
                vudio.dance();
            }

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

            // 播放音频
            audioPlayer.play().then(() => {
                console.log('[phone.js][playNextAudio] 音频片段播放中...');
            }).catch(error => {
                console.log('[phone.js][playNextAudio] 音频片段播放失败.', error);
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

    /* 处理音频播放 end
    ------------------------------------------------------------*/


    /* 处理音频识别 start 
    ------------------------------------------------------------*/

    /**
     * @description 语音识别结束后，将识别结果发送给后端，并开始语音对话
     */
    socket.on('agent_speech_recognition_finished', function (data) {
        const rec_result = data['rec_result'];

        if (!rec_result) {
            console.log('[phone.js][socket.on][agent_speech_recognition_finished] 音频识别结果为空.');
            return;
        }
        const token = localStorage.getItem('token');
        console.log('[phone.js][socket.on][agent_speech_recognition_finished] 音频识别结果: %s', rec_result);
        // 根据语音识别的结果执行不同的任务
        if (rec_result.includes("避") || rec_result.includes("模")) {  // 加强鲁棒性
            state = 1;
            if (!videoChat) {
                openCamera.click()
            }
        }
        else if (rec_result.includes("退出")) {
            exit_obstacle_void()
            return;
        }

        if (state == 0) {
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
                        if (!(jsonString.includes("<END>"))) {
                            socket.emit("agent_stream_audio", jsonString);
                        }

                        // 继续读取下一个数据
                        return reader.read().then(processText);
                    });
                })
                .catch(error => {
                    console.error('[phone.js][socket.on][agent_speech_recognition_finished] Error fetching stream:', error);
                });
        }
        else if (state == 1 && !obstacle_avoid) {
            obstacle_avoid = true;
            socket.emit("agent_stream_audio", "##<state=1>");
        }
    })
    // 避障socket
    socket.on('obstacle_avoid', function (data) {
        const flag = data["flag"];
        if (flag == "begin") {
            captureAndSendFrame();
        }
    })
    /* 处理音频识别 end 
    ------------------------------------------------------------*/

    const findItemButton = document.querySelector('.findItem');
    const findItemModal = document.getElementById('findItemModal');
    const closeModalButton = document.getElementById('closeModalButton');

    findItemButton.addEventListener('click', () => {
        findItemModal.style.display = 'block';
        loadGallery();
    });

    closeModalButton.addEventListener('click', () => {
        findItemModal.style.display = 'none';
        const gallery = document.getElementById('gallery');
        while (gallery.firstChild) {
            gallery.removeChild(gallery.firstChild);
        }
    });

    function loadGallery() {
        fetch('/images')
            .then(response => response.json())
            .then(data => {
                const gallery = document.getElementById('gallery');
                data.forEach(image => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.innerHTML = `
                            <button onclick="console.log('${image.name}'">
                                <img src="${image.url}" alt="${image.name}">
                                <p>${image.name}</p>
                            </button>
                        `;
                    gallery.appendChild(item);
                });
            })
            .catch(error => console.error('Error fetching images:', error));
    }
}