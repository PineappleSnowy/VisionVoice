/**
 * @fileoverview 主页模块
 * @description 该模块用于处理主页的登录和注册功能
 * @author Yang-ZhiHang
 */

import { sha256 } from './lib/secretUtils.js';
import { initAudioAnalyser, detectDB } from './lib/audioUtils.js';

const login_button = document.getElementById("login_button");
const register_button = document.getElementById("register_button");

// 首先尝试从 cookie 中获取 token
const getCookie = async (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const tokenValue = parts.pop().split(';').shift();
        return tokenValue
    }
    return null;
};

// 检查是否处于登录状态
const checkLoginStatus = async () => {
    
    // 添加显示 cookie 的 div
    const cookieDisplay = document.createElement('div');
    cookieDisplay.style.cssText = 'width: 41%; font-size: 10px; position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; border-radius: 4px; z-index: 1000;';
    document.body.appendChild(cookieDisplay);

    // 从 cookie 中获取 username 和 nickname
    const cookieUsername = await getCookie('username');
    const cookieNickname = await getCookie('nickname');

    // 如果 cookie 中存在这些值,则保存到 localStorage
    if (cookieUsername) {
        localStorage.setItem('username', cookieUsername);
    } else {
        localStorage.setItem('username', '用户名获取失败');
    }
    if (cookieNickname) {
        localStorage.setItem('nickname', cookieNickname);
    } else {
        localStorage.setItem('nickname', '昵称获取失败');
    }

    console.log("[index.js][checkLoginStatus] cookie:", document.cookie);

    // 显示 cookie 到 div 中
    cookieDisplay.textContent = '当前 Cookie: ' + (document.cookie || '无');

    // 优先从 cookie 获取 token
    const cookieToken = await getCookie('token');
    console.log("[index.js][checkLoginStatus] cookieToken:", cookieToken);

    // 如果 cookie 中有 token，则使用 cookie 中的 token
    // 否则使用 localStorage 中的 token
    const token = cookieToken || localStorage.getItem('token');

    if (token) {
        try {
            const response = await fetch('/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.valid) {
                // 将 cookie 中的 token 设置到 localStorage 中
                localStorage.setItem('token', token);
                // 跳转到 agent 主页
                window.location.href = '/agent';
            } else {
                localStorage.removeItem('token');
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
};

// 立即执行检查登录状态
checkLoginStatus();

/* 登录板块 start
----------------------------------------------------------*/
const handleLogin = () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("login_message");

    if (!username || !password) {
        loginMessage.textContent = '用户名和密码不能为空';
        loginMessage.className = 'message error';
        loginMessage.style.display = 'block';
        return;
    }

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
                    localStorage.setItem('username', username);
                    localStorage.setItem('nickname', data.user_info.nickname);
                    loginMessage.textContent = data.message;
                    loginMessage.className = 'message success';
                    loginMessage.style.display = 'block';

                    // 延迟1秒后跳转，让用户看到成功消息
                    setTimeout(() => {
                        window.location.href = '/agent';
                    }, 200);
                } else {
                    loginMessage.textContent = data.message || '登录失败';
                    loginMessage.className = 'message error';
                    loginMessage.style.display = 'block';
                }
            }).catch(error => {
                console.error('Error:', error);
                loginMessage.textContent = '登录失败，请重试';
                loginMessage.className = 'message error';
                loginMessage.style.display = 'block';
            });
    });
};

// 防止重复触发的标志：touchstart 和 click 事件同时触发时，会导致重复触发
// let touchStarted = false;

// // 触摸事件，用于适应移动端
// login_button.addEventListener("tap", (e) => {
//     touchStarted = true;
//     handleLogin();
//     e.preventDefault(); // 阻止默认行为
// });

login_button.addEventListener("click", (e) => {
    // 只有在没有触发 touchstart 的情况下才执行
    // if (!touchStarted) {
        handleLogin();
    // }
    // touchStarted = false;
});

// 点击跳转至注册页面
document.getElementById('go_to_register').addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'block';
});
/* 登录板块 end
----------------------------------------------------------*/


/* 注册板块 start
----------------------------------------------------------*/
register_button.addEventListener("click", () => {
    const nickname = document.getElementById("register_nickname").value;
    const username = document.getElementById("register_username").value;
    const password = document.getElementById("register_password").value;
    const confirmPassword = document.getElementById("register_confirm_password").value;
    const registerMessage = document.getElementById("register_message");

    if (!nickname || !username || !password || !confirmPassword) {
        registerMessage.textContent = '所有字段都不能为空';
        registerMessage.className = 'message error';
        registerMessage.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        registerMessage.textContent = '两次输入的密码不一致，请重新输入';
        registerMessage.className = 'message error';
        registerMessage.style.display = 'block';
        return;
    }

    sha256(password).then(encryptedPassword => {
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: encryptedPassword,
                nickname: nickname
            })
        })
            .then(response => response.json())
            .then(data => {
                registerMessage.textContent = data.message;
                registerMessage.className = 'message success';
                registerMessage.style.display = 'block';

                // 尝试过使用前端 Cookie 存储信息，但有些用户可能禁用 Cookie
                // 后端 Cookie 存储信息增加服务器负担，故改用 localStorage 存储信息
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', username);
                localStorage.setItem('nickname', nickname);

                window.location.href = '/agent';
            }).catch(error => {
                console.error('Error:', error);
                registerMessage.textContent = '注册失败，请重试';
                registerMessage.className = 'message error';
                registerMessage.style.display = 'block';
            });
    });
});


document.getElementById('back_to_login').addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
});
/* 注册板块 end
----------------------------------------------------------*/

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
