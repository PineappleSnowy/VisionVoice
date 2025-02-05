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
async function verifyToken() {
    const token = localStorage.getItem('token');
    
    // // 添加显示 token 的 div
    // const tokenDisplay = document.createElement('div');
    // tokenDisplay.style.cssText = 'width: 41%; font-size: 10px; position: fixed; top: 40px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; border-radius: 4px; z-index: 1000;';
    // document.body.appendChild(tokenDisplay);
    // // 显示 token 状态
    // tokenDisplay.textContent = 'Token: ' + (token || '未获取到 token');

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
                console.log('Token 验证成功');
                console.log('当前用户：', data.user);
                // tokenDisplay.textContent = 'Token: ' + token + ' (验证成功)';
                localStorage.setItem('user', data.user);
            } else {
                console.error('Token 验证失败:', data.message);
                // tokenDisplay.textContent = 'Token: ' + token + ' (验证失败)';
                alert('Token 验证失败，请重新登录');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('islogin');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('请求错误:', error);
            alert('Token 验证失败，请重新登录');
            localStorage.removeItem('token');
            localStorage.removeItem('user'); 
            window.location.href = '/';
        }
    } else {
        tokenDisplay.textContent = 'Token: 未获取到 token，即将跳转到首页';
        window.location.href = '/';
    }
}

