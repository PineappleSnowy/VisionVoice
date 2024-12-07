function logout() {
    // 清除 localStorage
    localStorage.clear();
    
    // 重定向到首页
    window.location.href = '/';
}

document.querySelector('.option.logout').addEventListener('click', logout);

// 获取用户信息
function getUserInfo() {
    const username = localStorage.getItem('username');
    const nickname = localStorage.getItem('nickname');

    document.querySelector('.username').textContent = nickname;
    document.querySelector('.user-account').textContent = `账号: ${username}`;
}

window.onload = getUserInfo;
