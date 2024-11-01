document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                console.log('Token 验证成功');
                console.log('当前用户：', data.user);
                localStorage.setItem('user', data.user);
                localStorage.setItem('isLogin', 1);
                // 通过验证后的操作
            } else {
                console.error('Token 验证失败:', data.message);
                alert('Token 验证失败，请重新登录');
                localStorage.removeItem('token');
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('请求错误:', error);
            alert('Token 验证失败，请重新登录');
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    } else {
        window.location.href = '/';
    }
});
