/**
 * @fileoverview Token 验证模块
 * @description 该模块用于验证用户登录 token 的有效性，并返回相应的验证结果
 * @author Yang-ZhiHang
 */

document.addEventListener("DOMContentLoaded", verifyToken);

/**
 * @function verifyToken
 * @description 检查本地存储的 token 是否有效
 */
function verifyToken() {
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
                    // 通过验证后的操作
                    localStorage.setItem('user', data.user);
                } else {
                    console.error('Token 验证失败:', data.message);
                    alert('Token 验证失败，请重新登录');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('islogin');
                    window.location.href = '/';
                }
            })
            .catch(error => {
                console.error('请求错误:', error);
                alert('Token 验证失败，请重新登录');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('islogin');
                window.location.href = '/';
            });
    } else {
        window.location.href = '/';
    }
}

