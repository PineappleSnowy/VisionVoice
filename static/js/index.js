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
    if (localStorage.getItem('islogin') === '1' && localStorage.getItem('token')) {
        window.location.href = '/agent';
    }
});

