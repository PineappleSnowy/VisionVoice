function logout() {
    // 清除 session 存储
    sessionStorage.clear();
    
    // 也清除 localStorage
    localStorage.clear();
    
    // 重定向到首页
    window.location.href = '/';
}

document.querySelector('.option.logout').addEventListener('click', logout);
