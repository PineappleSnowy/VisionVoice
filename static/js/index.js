const login_button = document.getElementById("login_button");

// 使用 SHA-256 加密密码
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

login_button.addEventListener("click", () => {
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
                console.log(data);
                localStorage.setItem('token', data.access_token);
                window.location.href = '/agent';
                alert(data.message);
            }).catch(error => {
                console.error('Error:', error);
                alert('登录失败，请重试');
            });
    });
});

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
                console.log(data);
                alert(data.message);
            }).catch(error => {
                console.error('Error:', error);
                alert('注册失败，请重试');
            });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('isLogin') === '1') {
        window.location.href = '/agent';
    }
});
