/**
 * @fileoverview 主页模块
 * @description 该模块用于处理主页的登录和注册功能
 * @author Yang-ZhiHang
 */

import { sha256 } from './lib/secretUtils.js';

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
    // const cookieDisplay = document.createElement('div');
    // cookieDisplay.style.cssText = 'width: 41%; font-size: 10px; position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; border-radius: 4px; z-index: 1000;';
    // document.body.appendChild(cookieDisplay);


    console.log("[index.js][checkLoginStatus] cookie:", document.cookie);

    // 显示 cookie 到 div 中
    // cookieDisplay.textContent = '当前 Cookie: ' + (document.cookie || '无');

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
                
                // 当 localStorage 中没有 username 和 nickname 时，从 cookie 中获取
                if (!localStorage.getItem('username')) {
                    const cookieUsername = await getCookie('username');
                    if (cookieUsername) {
                        localStorage.setItem('username', cookieUsername);
                    } else {
                        localStorage.setItem('username', '用户名获取失败');
                    }
                }
                
                if (!localStorage.getItem('nickname')) {
                    const cookieNickname = await getCookie('nickname');
                    if (cookieNickname) {
                        localStorage.setItem('nickname', cookieNickname);
                    } else {
                        localStorage.setItem('nickname', '昵称获取失败');
                    }
                }
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
