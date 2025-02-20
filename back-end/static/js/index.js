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
                
                if (!localStorage.getItem('phone')) {
                    const cookieNickname = await getCookie('phone');
                    if (cookieNickname) {
                        localStorage.setItem('phone', cookieNickname);
                    } else {
                        localStorage.setItem('phone', '手机号获取失败');
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
    const phoneLogin = document.getElementById("phone_login");
    const passwordLogin = document.getElementById("password_login");
    const loginMessage = document.getElementById("login_message");

    if (phoneLogin.classList.contains('active')) {
        const phone = document.getElementById("login_phone").value;
        if (!phone) {
            loginMessage.textContent = '请输入手机号';
            loginMessage.className = 'message error';
            loginMessage.style.display = 'block';
            return;
        }

        const code = document.getElementById("phone_code").value;
        if (!code) {
            loginMessage.textContent = '请输入验证码';
            loginMessage.className = 'message error';
            loginMessage.style.display = 'block';
            return;
        }

        // 验证验证码
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: phone,
                code: code,
                login_type: 'phone',  // 手机号登录
                usage: 'login'
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("[index.js][handleLogin] data:", data);

                if (data.code === 200) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('username', data.user_info.username);
                    localStorage.setItem('phone', phone);
                    localStorage.setItem('nickname', data.user_info.nickname);
                    loginMessage.textContent = data.message;
                    loginMessage.className = 'message success';
                    loginMessage.style.display = 'block';

                    // 延迟200ms后跳转，让用户看到成功消息
                    setTimeout(() => {
                        window.location.href = '/agent';
                    }, 200);
                } else {
                    loginMessage.textContent = data.message || '登录失败';
                    loginMessage.className = 'message error';
                    loginMessage.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loginMessage.textContent = '登录失败，请重试';
                loginMessage.className = 'message error';
                loginMessage.style.display = 'block';
            });

    } else if (passwordLogin.classList.contains('active')) {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

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
                    password: encryptedPassword,
                    login_type: 'password',  // 密码登录
                    usage: 'login'
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        localStorage.setItem('token', data.access_token);
                        localStorage.setItem('username', username)
                        localStorage.setItem('phone', data.user_info.phone);
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
    }

};

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
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
});

// 点击切换登录方式
document.addEventListener('DOMContentLoaded', function () {
    const passwordLogin = document.getElementById('password_login');
    const phoneLogin = document.getElementById('phone_login');
    const slider = document.getElementById('slider');
    const phoneLoginContainer = document.getElementById('login-type-phone');
    const passwordLoginContainer = document.getElementById('login-type-password');

    passwordLogin.addEventListener('click', function () {
        passwordLogin.classList.add('active');
        phoneLogin.classList.remove('active');
        slider.classList.add('pwd-login');
        phoneLoginContainer.style.display = 'none';
        passwordLoginContainer.style.display = 'block';
    });


    phoneLogin.addEventListener('click', function () {
        phoneLogin.classList.add('active');
        passwordLogin.classList.remove('active');
        slider.classList.remove('pwd-login');
        phoneLoginContainer.style.display = 'block';
        passwordLoginContainer.style.display = 'none';
    });
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
    const phone = document.getElementById("register_phone").value;
    const code = document.getElementById("register_code").value;
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
                nickname: nickname,
                phone: phone,
                code: code,
                usage: 'register'
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    registerMessage.textContent = data.message;
                    registerMessage.className = 'message success';
                    registerMessage.style.display = 'block';
                    // 尝试过使用前端 Cookie 存储信息，但有些用户可能禁用 Cookie
                    // 后端 Cookie 存储信息增加服务器负担，故改用 localStorage 存储信息
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('username', username);
                    localStorage.setItem('nickname', nickname);

                    // 延迟1秒后跳转，让用户看到成功消息
                    setTimeout(() => {
                        window.location.href = '/agent';
                    }, 200);
                } else {
                    registerMessage.textContent = data.message;
                    registerMessage.className = 'message error';
                    registerMessage.style.display = 'block';
                }
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


/* 验证码业务逻辑 start
----------------------------------------------------------*/
const getCodeBtnLogin = document.getElementById('get_code_btn_login');
const getCodeBtnRegister = document.getElementById('get_code_btn_register');

getCodeBtnLogin.addEventListener('click', async () => {
    const loginMessage = document.getElementById("login_message");
    const phone = document.getElementById('login_phone').value;
    if (!phone) {
        loginMessage.textContent = '请输入手机号';
        loginMessage.className = 'message error';
        loginMessage.style.display = 'block';
        return;
    }

    const response = await fetch('/send-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phone, usage: 'login' })
    });

    const data = await response.json();
    if (data.code === 200) {
        loginMessage.textContent = data.message;
        loginMessage.className = 'message success';
        loginMessage.style.display = 'block';
    } else {
        loginMessage.textContent = data.message;
        loginMessage.className = 'message error';
        loginMessage.style.display = 'block';
    }

    // 开始60秒倒计时
    let countdown = 60;
    getCodeBtnLogin.disabled = true;
    getCodeBtnLogin.style.backgroundColor = '#ccc';
    const timer = setInterval(() => {
        getCodeBtnLogin.textContent = `${countdown}秒后重新获取`;
        countdown--;
        if (countdown < 0) {
            clearInterval(timer);
            getCodeBtnLogin.disabled = false;
            getCodeBtnLogin.textContent = '获取验证码';
            getCodeBtnLogin.style.backgroundColor = '#3eb575';
        }
    }, 1000);
});

getCodeBtnRegister.addEventListener('click', async () => {
    const loginMessage = document.getElementById("login_message");
    const phone = document.getElementById('register_phone').value;
    if (!phone) {
        loginMessage.textContent = '请输入手机号';
        loginMessage.className = 'message error';
        loginMessage.style.display = 'block';
        return;
    }

    const response = await fetch('/send-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phone, usage: 'register' })
    });

    const data = await response.json();
    if (data.code === 200) {
        loginMessage.textContent = data.message;
        loginMessage.className = 'message success';
        loginMessage.style.display = 'block';
    } else {
        loginMessage.textContent = data.message;
        loginMessage.className = 'message error';
        loginMessage.style.display = 'block';
    }

    // 开始60秒倒计时
    let countdown = 60;
    getCodeBtnRegister.disabled = true;
    getCodeBtnRegister.style.backgroundColor = '#ccc';
    const timer = setInterval(() => {
        getCodeBtnRegister.textContent = `${countdown}秒后重新获取`;
        countdown--;
        if (countdown < 0) {
            clearInterval(timer);
            getCodeBtnRegister.disabled = false;
            getCodeBtnRegister.textContent = '获取验证码';
            getCodeBtnRegister.style.backgroundColor = '#3eb575';
        }
    }, 1000);
});




/* 验证码业务逻辑 end
----------------------------------------------------------*/