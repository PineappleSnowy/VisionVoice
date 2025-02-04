/* 该文件为有声相册模块的内容 */

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    const socket = io({
        pingTimeout: 60000,  // 设置较大的 pingTimeout
        pingInterval: 30000,  // 设置较大的 pingInterval
        query: {
            token: token
        }
    });

    socket.on('image_talk_finished', function (data) {
        console.log("图片解析完成")
        const imageName = data.image_name;
        const images = document.querySelectorAll(`img[label="${imageName}"]`);
        images.forEach(img => {
            const overlay = img.parentElement.parentElement.querySelector('.overlay');
            overlay.style.display = 'none';
        });
    });

    let photo_id = 0;  // 当前照片序号
    fetch('/images?mode=album', {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('gallery');
            data.forEach(image => {
                photo_id += 1;
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `
                    <button class="image-talk" onclick="playAudio('${image.name}', event)">
                        <img src="${image.url}" label="${image.name}" aria-label="照片${photo_id}，点击朗读" alt="照片${photo_id}，点击朗读">
                    </button>
                    <button class="audio-control" onclick="controlAudio(event)" aria-label="开关声音"></button>
                    <button class="full-screen" onclick="fullScreen(event)" aria-label="照片问答"></button>
                `;
                if (!image.finish_des) {
                    console.log('Image not finished:', image.name);
                    const overlay = document.createElement('div');
                    overlay.className = 'overlay';
                    overlay.innerHTML = `
                        <div class="text">正在解析</div>
                        `;
                    item.appendChild(overlay);
                }
                gallery.appendChild(item);
            });
        })
        .catch(error => console.error('Error fetching images:', error));

    const albumAdd = document.getElementById('album-add');
    const addButton = document.getElementById('addButton');
    const cameraButton = document.getElementById('cameraButton');
    const albumButton = document.getElementById('albumButton');
    const fileInput = document.getElementById('fileInput');

    addButton.addEventListener('click', function () {
        if (albumAdd.classList.contains('expanded')) {
            albumAdd.classList.remove('expanded');
        } else {
            albumAdd.classList.add('expanded');
        }
        cameraButton.style.display = cameraButton.style.display == 'none' ? 'inline-block' : 'none';
        albumButton.style.display = albumButton.style.display == 'none' ? 'inline-block' : 'none';
    });

    cameraButton.addEventListener('click', function () {
        fileInput.setAttribute('capture', 'camera');
        fileInput.click();
    });

    albumButton.addEventListener('click', function () {
        fileInput.removeAttribute('capture');
        fileInput.setAttribute('multiple', 'multiple');
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        const files = fileInput.files;
        if (files.length > 0) {
            const gallery = document.getElementById('gallery');
            const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const randomNum = Math.floor(10000 + Math.random() * 90000);
                const newFileName = `${timestamp}_${i}_${randomNum}`;
                const reader = new FileReader();
                reader.onload = function (e) {
                    console.log('Uploading image:', newFileName);
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.innerHTML = `
                        <button class="image-talk" onclick="playAudio('${newFileName}', event)">
                            <img src="${e.target.result}" label="${newFileName}" aria-label="点击朗读照片" alt="点击朗读照片">
                        </button>
                        <button class="audio-control" onclick="controlAudio(event)" aria-label="开关声音"></button>
                        <button class="full-screen" onclick="fullScreen(event)" aria-label="照片问答"></button>
                        <div class="overlay">
                            <div class="text">正在解析</div>
                        </div>
                    `;
                    if (gallery.firstChild) {
                        gallery.insertBefore(item, gallery.firstChild);
                    } else {
                        gallery.appendChild(item);
                    }
                };
                reader.readAsDataURL(file);
                formData.append('files', file, newFileName);
            }

            const token = localStorage.getItem('token');
            fetch('/save_album_images', {
                method: 'POST',
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (!data.success) {
                        console.error('Error uploading images:', data.error);
                        showError(data.error);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    disableButtons(false);
                    showError('上传图片时发生错误！');
                });
        } else {
            console.log("Inputed files are empty");
        }
        albumAdd.classList.remove('expanded');
        cameraButton.style.display = 'none';
        albumButton.style.display = 'none';
    });
});

function disableButtons(disable) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = disable;
    });
}

const audioPlayer = document.getElementById('audioPlayer');

function playAudio(audioName, event) {
    cameraButton.style.display = 'none';
    albumButton.style.display = 'none';

    audioPlayer.pause();  // 先暂停当前正在播放的音频
    // 隐藏所有的 audio-control 和 full-screen 按钮
    document.querySelectorAll('.audio-control').forEach(button => button.style.display = 'none');
    document.querySelectorAll('.full-screen').forEach(button => button.style.display = 'none');

    // 获取点击的画廊元素
    const curr_gallery_item = event.currentTarget.parentElement;
    // 显示 audio-control 和 full-screen 按钮
    const audioControlButton = curr_gallery_item.querySelector('.audio-control');
    const fullScreenButton = curr_gallery_item.querySelector('.full-screen');
    audioControlButton.style.display = 'flex';
    fullScreenButton.style.display = 'flex';

    const token = localStorage.getItem('token');
    fetch(`/get_audio?audio_name=${audioName}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            audioPlayer.src = url;
            audioPlayer.play();

        })
        .catch(error => {
            console.error('Error fetching audio:', error);
        });
}

function controlAudio(event) {
    event.stopPropagation();
    cameraButton.style.display = 'none';
    albumButton.style.display = 'none';
    
    // 控制音频的逻辑
    audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
}

let album_chat_history = [];

function fullScreen(event) {
    event.stopPropagation();
    cameraButton.style.display = 'none';
    albumButton.style.display = 'none';

    // 全屏显示的逻辑
    audioPlayer.pause();
    const imageDetail = document.getElementById('imageDetail');
    imageDetail.style.display = 'block';
    const image = event.currentTarget.parentElement.querySelector('img');
    imageDetail.innerHTML = `
        <div class="image-detail-header">
            <button class="back-button" aria-label="返回我的页面">&#8592;</button>
            照片问答
            <button class="delete-button" aria-label="删除该照片"></button>
        </div>
        <div class="image-container">
            <img src="${image.src}" label="${image.label}">
        </div>
        <div id="chat-container" aria-live="polite" aria-atomic="true"></div>
        <div id="chat-input-container" role="form">
            <textarea id="agent-chat-textarea" placeholder="输入消息..." aria-label="输入消息"></textarea>
            <button id="send-button" aria-label="发送消息">发送</button>
        </div>`;
    fetch(`/get_image_des`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ image_name: image.label })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                album_chat_history.push({ "role": "assistant", "text": data.image_des })  // 将照片描述加入对话历史

                const chatMessageBot = document.createElement('div');
                chatMessageBot.className = 'chat-messages-bot';
                const chatBubbleBot = document.createElement('div');
                chatBubbleBot.className = 'chat-bubble-bot';
                chatBubbleBot.textContent = data.image_des;
                chatMessageBot.appendChild(chatBubbleBot);
                document.getElementById('chat-container').appendChild(chatMessageBot);
                document.getElementById('chat-container').scrollTo(0, document.getElementById('chat-container').scrollHeight);
            } else {
                console.error('Error fetching chat messages:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching chat messages:', error);
        });

    document.querySelector('.back-button').addEventListener('click', function () {
        imageDetail.style.display = 'none';
        album_chat_history = [];  // 清空对话历史
    });
    imageDetail.style.display = 'block';
    document.getElementById('send-button').addEventListener('click', function () {
        const input = document.getElementById('agent-chat-textarea');
        let message = input.value.trim();
        message = message.replace(/(\r\n|\n|\r)/gm, '');
        if (message) {
            addMessage(message);
            sendMessageToAgent(message, image.label);
            message = ''
            input.value = ''; // 清空输入框
        }
    });
    document.querySelector('.delete-button').addEventListener('click', function () {
        disableButtons(true);
        const token = localStorage.getItem('token');
        fetch('/delete_image?mode=album', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ image_name: image.label })
        })
            .then(response => response.json())
            .then(data => {
                disableButtons(false);
                const statusMessage = document.getElementById('statusMessage');
                if (data.success) {
                    document.querySelector('.back-button').click();
                    const galleryItem = image.parentElement.parentElement;
                    galleryItem.remove();
                    showStatus('删除图片成功', 'green');
                } else {
                    showStatus('删除图片失败', 'red');
                }
            })
            .catch(error => {
                disableButtons(false);
                console.error('Error:', error);
                showStatus('删除图片时发生错误！', 'red');
            });
    });
}

let curr_talk_index = 0;  // 标识当前对话

function sendMessageToAgent(message, image_name) {
    album_chat_history.push({ "role": "user", "text": message })  // 将用户消息加入对话历史

    if (curr_talk_index >= Number.MAX_SAFE_INTEGER) {
        curr_talk_index = 0;
    }
    curr_talk_index += 1;
    const talk_index = curr_talk_index;
    const chatMessageBot = document.createElement('div');
    chatMessageBot.className = 'chat-messages-bot';
    const chatBubbleBot = document.createElement('div');
    chatBubbleBot.className = 'chat-bubble-bot';

    chatMessageBot.appendChild(chatBubbleBot);
    document.getElementById('chat-container').appendChild(chatMessageBot);
    document.getElementById('chat-container').scrollTo(0, document.getElementById('chat-container').scrollHeight);  // 滚动到底部

    const token = localStorage.getItem('token');
    fetch('/album_talk', {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ album_chat_history: album_chat_history, image_name: image_name })
    })
        .then(response => {
            let reader = response.body.getReader();

            // 逐块读取并处理数据
            return reader.read().then(function processText({ done, value }) {
                if (done) {
                    album_chat_history.push({ "role": "assistant", "text": chatBubbleBot.textContent })
                    return;
                }
                // 如果对话序号对不上，则停止响应
                if (talk_index !== curr_talk_index) {
                    album_chat_history.push({ "role": "assistant", "text": chatBubbleBot.textContent })
                    return;
                }

                let jsonString = new TextDecoder().decode(value); // 将字节流转换为字符串

                chatBubbleBot.textContent += jsonString;

                // 继续读取下一个数据
                return reader.read().then(processText);
            });
        })
        .catch(error => {
            console.error('Error fetching stream:', error);
        });
}

function addMessage(message) {
    const chatMessageUser = document.createElement('div');
    chatMessageUser.className = 'chat-messages-user';
    const chatBubbleUser = document.createElement('div');
    chatBubbleUser.className = 'chat-bubble-user';
    chatBubbleUser.textContent = message;

    chatMessageUser.appendChild(chatBubbleUser);
    document.getElementById('chat-container').appendChild(chatMessageUser);
    document.getElementById('chat-container').scrollTo(0, document.getElementById('chat-container').scrollHeight);
}

function showStatus(message, color) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.style.color = color;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2000);
}
