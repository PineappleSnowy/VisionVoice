function logout() {
    // 清除 localStorage
    localStorage.clear();

    // 直接获取当前域名
    const domain = window.location.hostname;
    
    // 明确指定要清除的 cookie
    const cookiesToClear = ['token', 'username', 'nickname'];
    
    cookiesToClear.forEach(name => {
        // 尝试不同的组合来清除 cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
        
        // 如果是子域名，尝试清除主域名的 cookie
        if (domain.split('.').length > 2) {
            const mainDomain = domain.split('.').slice(-2).join('.');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${mainDomain}`;
        }
    });

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
