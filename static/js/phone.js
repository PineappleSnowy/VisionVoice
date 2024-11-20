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

// 静音阈值(单位:分贝)
const SILENCE_THRESHOLD = -40;

/**
 * @function detectSilence
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

window.onload = async () => {

    // 获取音频流
    let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[test.html][window.onload] 创建 getUserMedia 音频流成功...");

    // 初始化音频分析器
    const { analyser, dataArray } = await initAudioAnalyser(audioStream);

    // 静音定时器
    let silenceTimer;

    // 静音持续时间阈值（单位：毫秒）
    const SILENCE_DURATION = 2000;

    // 是否录制完毕
    let recordingFinished = false;

    // 检测用户是否停止讲话
    function checkSilence() {

        // 如果用户停止讲话，则设置短暂的静音等待
        if (detectSilence(analyser, dataArray)) {

            // 如果静音定时器不存在，则设置静音定时器
            if (!silenceTimer) {
                silenceTimer = setTimeout(() => {
                    stopRecording();

                    // 创建 WAV blob 并传递给 createDownloadLink
                    rec.exportWAV(upload_audio);

                    // 是否录制完毕
                    recordingFinished = true;

                }, SILENCE_DURATION);
            }
            if (userStatus == 1) {
                console.log('[test.html][checkSilence] 用户停止讲话...');
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
                console.log('[test.html][checkSilence] 用户正在讲话...');
                userStatus = 1;
            }
        }
    }

    // 使用 setInterval，每 333ms 检查一次用户是否停止讲话
    setInterval(checkSilence, 333);

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

        // 创建新的音频上下文，这是Web Audio API的核心对象
        audioContext = new AudioContext();

        // 将麦克风的音频流(stream)转换为音频源节点
        input = audioContext.createMediaStreamSource(audioStream);

        // 创建一个新的 Recorder 实例，用于录制音频
        // numChannels: 1 表示使用单声道录音，用于减少文件大小
        rec = new Recorder(input, { numChannels: 1 })

        // 启动录制过程
        rec.record()

    }

    function continueRecording() {

        // 启动录制过程
        rec.record()

    }

    function stopRecording() {
        console.log("[test.html][stopRecording] 停止录音...");

        // 告诉录制器停止录制
        rec.stop();

    }

    function upload_audio(blob) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function (e) {
            if (this.readyState === 4) {
                // console.log("[test.html][upload_audio] response:", e.target.responseText);
            }
        };
        const fd = new FormData();
        fd.append("audio_data", blob, "recorded_audio.wav");
        const sampleRate = audioContext.sampleRate;
        fd.append("sample_rate", sampleRate);
        const token = localStorage.getItem('token');
        console.log("[test.html][upload_audio] 上传音频数据...");
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

    // 创建 socket 连接
    const socket = io();

    // 保存音频数据的列表
    var audioList = [];

    // 当前播放的音频索引
    var audioIndex = 0;

    // 获取音频播放器元素
    const audioPlayer = document.getElementById('audioPlayer');

    // 播放下一个音频
    function playNextAudio() {
        if (audioList[audioIndex] != undefined) {
            const audioBlob = new Blob([audioList[audioIndex]], { type: 'audio/mp3' });
            const audioURL = URL.createObjectURL(audioBlob);

            audioPlayer.src = audioURL;

            try {
                audioPlayer.play();
            } catch (error) {
                console.log('[phone.js][playNextAudio] 音频片段播放失败.', error);
            }
        } else {
            // 如果波形图动画处于暂停状态，则开始播放
            if (vudio.paused()) {
                // console.log('[phone.js][playNextAudio] 波形暂停信息', vudio.paused());
                vudio.dance();
            }
            console.log('[phone.js][playNextAudio] undefined audioIndex: %d', audioIndex);
        }
    }

    // 监听音频播放结束事件
    audioPlayer.onended = function () {
        audioIndex++;
        playNextAudio();
    };

    // 监听后端发送的 agent_play_audio_chunk 事件
    socket.on('agent_play_audio_chunk', function (data) {
        const index = data['index'];
        const audioData = data['audio_chunk']; // 后端传来的音频数据

        // 将音频数据添加到音频列表
        audioList[index] = audioData;

        // 如果波形图动画正在播放，则暂停
        if (!vudio.paused()) {
            // console.log('[phone.js][socket.on][agent_play_audio_chunk] 波形暂停信息', vudio.paused());
            vudio.pause();
        }

        // 如果当前没有音频正在播放，开始播放
        if (audioPlayer.paused) {
            audioPlayer.pause();
            playNextAudio();
        }
    });

    let index = 0;

    /**
     * @description 语音识别结束后，将识别结果发送给后端，并开始语音对话
     */
    socket.on('agent_speech_recognition_finished', function (data) {
        const rec_result = data['rec_result'];
        if (!rec_result) {
            console.log('[test.html][socket.on][agent_speech_recognition_finished] 音频识别结果为空.');
            return;
        }
        const token = localStorage.getItem('token');
        console.log('[test.html][socket.on][agent_speech_recognition_finished] 音频识别结果: %s', rec_result);

        fetch(`/agent/chat_stream?query=${rec_result}`, {
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

                    socket.emit("agent_stream_audio", { "index": index, "answer": jsonString })
                    index += 1;

                    // 继续读取下一个数据
                    return reader.read().then(processText);
                });
            })
            .catch(error => {
                console.error('[phone.js][socket.on][agent_speech_recognition_finished] Error fetching stream:', error);
            });
    })
    /* 处理音频播放 end
    ------------------------------------------------------------*/
}