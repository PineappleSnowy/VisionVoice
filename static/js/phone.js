//定义基准 rem
const html = document.querySelector('html');
html.style.fontSize = window.innerWidth * 100 / 412 + 'px';

let stream;
let audioStream;
let vudio;
const goBack = document.querySelector('.goBack');
const toggleCamera = document.querySelector('.toggleCamera');
const openCamera = document.querySelector('.openCamera');
const hangUp = document.querySelector('.hangUp');
const container = document.querySelector('.container');
const video = document.querySelector('video');
const img = document.querySelector('img');
const audio = document.querySelector('#audio');
const waveShape = document.querySelector('#waveShape');
let videoChat = false;
let isFrontCamera = false;
let mediaRecorder;
let audioChunks = [];
let silenceTimer;
const SILENCE_THRESHOLD = 50; // 静音阈值
const SILENCE_DURATION = 2000; // 静音持续时间阈值(2秒)

goBack.addEventListener('click', () => {
    window.location.href = '/agent';
});

hangUp.addEventListener('click', () => {
    window.location.href = '/agent';
});

openCamera.addEventListener('click', async () => {
    try {
        videoChat = !videoChat;
        if (videoChat) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
                video.srcObject = stream;
            }catch(err) {
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
        if(isFrontCamera){
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false});
                video.srcObject = stream;
            } catch (err) {
                alert(err);
            }
        }else{
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
            } catch (err) {
                alert(err);
            }
        }
        
    }
});

// 初始化音频分析器
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

// 检测音量
function detectSilence(analyser, dataArray) {
    analyser.getFloatTimeDomainData(dataArray);
    let sum = 0;
    for(let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i]);
    }
    const average = sum / dataArray.length;
    const db = 20 * Math.log10(average);
    return db < SILENCE_THRESHOLD;
}

/**
 * @description 在页面加载完成后初始化音频分析器
 */
window.onload = async () => {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const { analyser, dataArray } = await initAudioAnalyser(audioStream);
        
        // 创建媒体录制器
        mediaRecorder = new MediaRecorder(audioStream);

        // 当媒体录制器有数据可用时，将数据添加到音频数据列表中
        mediaRecorder.ondataavailable = (event) => {
            console.log('[phone.js][ondataavailable] event: %s', event);
            audioChunks.push(event.data);
        };

        // 当媒体录制器停止时，将音频数据上传到后端
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio_data', audioBlob);
            formData.append('sample_rate', '16000');
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/agent/upload_audio', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.log('[phone.js][onstop] error: %s', error.message);
            }
            
            audioChunks = [];
            
            // 重新开始录音
            mediaRecorder.start();
        };
        
        // 开始录音并检测静音
        mediaRecorder.start();
        
        // 定期检查是否静音
        function checkSilence() {
            if(detectSilence(analyser, dataArray)) {
                if(!silenceTimer) {
                    silenceTimer = setTimeout(() => {
                        mediaRecorder.stop();
                        silenceTimer = null;
                    }, SILENCE_DURATION);
                }
            } else {
                if(silenceTimer) {
                    clearTimeout(silenceTimer);
                    silenceTimer = null;
                }
            }
            requestAnimationFrame(checkSilence);
        }
        
        checkSilence();
        
        // 初始化音频可视化
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
    } catch(err) {
        alert(err);
    }

    // 检查 URL 参数，决定是否自动开启摄像头
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('camera') === 'on') {
        openCamera.click();
    }
};
