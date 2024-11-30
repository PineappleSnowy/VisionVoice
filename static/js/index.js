/**
 * @fileoverview 主页模块
 * @description 该模块用于处理主页的登录和注册功能
 * @author Yang-ZhiHang
 */

const login_button = document.getElementById("login_button");
const register_button = document.getElementById("register_button");

// SHA-256 加密密码
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 登录处理函数
const handleLogin = () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    sha256(password).then(encryptedPassword => {
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: encryptedPassword
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('islogin', 1);
                    alert(data.message);
                    window.location.href = '/agent';
                }
            }).catch(error => {
                console.error('Error:', error);
                alert('登录失败，请重试');
            });
    });
};

// 防止重复触发的标志
let touchStarted = false;

// 添加 touchstart 事件
login_button.addEventListener("tap", (e) => {
    touchStarted = true;
    handleLogin();
    e.preventDefault(); // 阻止默认行为
});

// 修改 click 事件
login_button.addEventListener("click", (e) => {
    if (!touchStarted) { // 只有在没有触发 touchstart 的情况下才执行
        handleLogin();
    }
    touchStarted = false;
});

// 注册
register_button.addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    sha256(password).then(encryptedPassword => {
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: encryptedPassword
            })
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
            }).catch(error => {
                console.error('Error:', error);
                alert('注册失败，请重试');
            });
    });
});

// 检查是否处于登录状态
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('islogin') === '1') {
        const token = localStorage.getItem('token');
        fetch('/verify-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.valid) {
                    window.location.href = '/agent';
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('islogin');
                }
            });
    }
});

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
async function calibrateNoiseLevel(analyser, dataArray, duration = 3000) {
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
    // 获取音频流
    let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[phone.js][window.onload] 创建 getUserMedia 音频流成功...");

    // 初始化音频分析器
    const { analyser, dataArray } = await initAudioAnalyser(audioStream);

    // 在开始录音前进行环境噪音检测
    SILENCE_THRESHOLD = await calibrateNoiseLevel(analyser, dataArray);
    console.log('[phone.js][window.onload] 环境噪音校准完成, 静音阈值:', SILENCE_THRESHOLD);
    localStorage.setItem('SILENCE_THRESHOLD', SILENCE_THRESHOLD);
}

/* 处理环境噪音获取 end
----------------------------------------------------------*/

