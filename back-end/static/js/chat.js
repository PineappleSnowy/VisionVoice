var selectedAgent = 'defaultAgent'; // 默认智能体

document.addEventListener('DOMContentLoaded', function() {
    selectedAgent = localStorage.getItem('selectedAgent') || 'defaultAgent'; // 从本地存储中获取选择的智能体
});

function selectChatAgent(agent) {
    selectedAgent = agent;
    localStorage.setItem('selectedAgent', agent); // 将选择的智能体存储到本地存储
}