function logout() {
    // 清除 localStorage
    localStorage.clear();
    
    // 清除 cookie，设置过期时间为过去时间并指定路径
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'nickname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
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

getUserInfo();
