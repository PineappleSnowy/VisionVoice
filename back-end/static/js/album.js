/* 该文件为帮我寻物物品模板管理模块的内容 */

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
        const images = document.querySelectorAll(`img[alt="${imageName}"]`);
        images.forEach(img => {
            const overlay = img.parentElement.parentElement.querySelector('.overlay');
            overlay.style.display = 'none';
        });
    });

    fetch('/images?mode=album', {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('gallery');
            data.forEach(image => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `
                    <button class="image-talk" onclick="playAudio('${image.name}', event)">
                        <img src="${image.url}" alt="${image.name}">
                    </button>
                    <button class="audio-control" onclick="controlAudio(event)"></button>
                    <button class="full-screen" onclick="fullScreen(event)"></button>
                `;
                gallery.appendChild(item);
            });
        })
        .catch(error => console.error('Error fetching images:', error));

    const footer = document.getElementById('footer');
    const addButton = document.getElementById('addButton');
    const cameraButton = document.getElementById('cameraButton');
    const albumButton = document.getElementById('albumButton');
    const cancelButton = document.getElementById('cancelButton');
    const fileInput = document.getElementById('fileInput');

    addButton.addEventListener('click', function () {
        footer.classList.add('expanded');
        addButton.style.display = 'none';
        cameraButton.style.display = 'inline-block';
        albumButton.style.display = 'inline-block';
        cancelButton.style.display = 'block';
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

    cancelButton.addEventListener('click', function () {
        footer.classList.remove('expanded');
        addButton.style.display = 'block';
        cameraButton.style.display = 'none';
        albumButton.style.display = 'none';
        cancelButton.style.display = 'none';
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
                            <img src="${e.target.result}" alt="${newFileName}">
                        </button>
                        <button class="audio-control" onclick="controlAudio(event)"></button>
                        <button class="full-screen" onclick="fullScreen(event)"></button>
                        <div class="overlay">
                            <div class="text">正在解析</div>
                        </div>
                    `;
                    gallery.appendChild(item);
                };
                reader.readAsDataURL(file);
                formData.append('files', file, newFileName);
            }

            const token = localStorage.getItem('token');
            fetch('/save_item_images', {
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
        footer.classList.remove('expanded');
        addButton.style.display = 'block';
        cameraButton.style.display = 'none';
        albumButton.style.display = 'none';
        cancelButton.style.display = 'none';
    });

    document.getElementById('deleteButton').addEventListener('click', function () {
        disableButtons(true);
        const imageName = document.getElementById('modalImage').alt;
        const token = localStorage.getItem('token');
        fetch('/delete_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: imageName })
        })
            .then(response => response.json())
            .then(data => {
                disableButtons(false);
                const statusMessage = document.getElementById('statusMessage');
                if (data.success) {
                    statusMessage.textContent = '删除成功';
                    statusMessage.style.color = 'green';
                    const galleryItem = document.querySelector(`button[onclick="playAudio('${imageName}')"]`).parentElement;
                    galleryItem.remove();
                } else {
                    statusMessage.textContent = '删除失败';
                    statusMessage.style.color = 'red';
                }
            })
            .catch(error => {
                disableButtons(false);
                const statusMessage = document.getElementById('statusMessage');
                statusMessage.textContent = '删除失败';
                statusMessage.style.color = 'red';
            });
    });

    document.getElementById('backButton').addEventListener('click', function () {
        const modal = document.getElementById('myModal');
        modal.style.display = 'none';
        statusMessage.textContent = '';
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

function controlAudio (event) {
    event.stopPropagation();
    // 控制音频的逻辑
    audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
}

function fullScreen(event) {
    event.stopPropagation();
    // 全屏显示的逻辑
}

function openModal(url, name, button) {
    const modal = document.getElementById('myModal');
    const modalImage = document.getElementById('modalImage');
    const imageName = document.getElementById('imageName');
    const statusMessage = document.getElementById('statusMessage');

    modal.style.display = 'block';
    modalImage.src = url;
    modalImage.alt = name;
    imageName.value = name;

    document.getElementById('saveButton').addEventListener('click', function () {
        disableButtons(true)
        const newName = document.getElementById('imageName').value;
        const oldName = button.querySelector('p').innerText;

        const token = localStorage.getItem('token');
        // 发送请求到后端修改图片名称
        fetch('/rename_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ oldName: oldName, newName: newName })
        })
            .then(response => response.json())
            .then(data => {
                disableButtons(false)
                if (data.success) {
                    console.log('Image name updated successfully');

                    // 更新前端显示的图片名称
                    button.querySelector('p').innerText = newName;
                    button.querySelector('img').alt = newName;
                    button.setAttribute('onclick', `playAudio('${newName}')`);

                    statusMessage.textContent = '修改成功';
                    statusMessage.style.color = 'green';
                } else {
                    console.error('Error updating image name');
                    statusMessage.textContent = '修改失败';
                    statusMessage.style.color = 'red';
                }
            })
            .catch(error => {
                disableButtons(false);
                console.error('Error:', error);
                statusMessage.textContent = '修改失败';
                statusMessage.style.color = 'red';
            });
    });
}

// 获取底栏和画廊的元素
const footer = document.getElementById('footer');
const gallery = document.getElementById('gallery');

// 监听底栏高度的变化
const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
        if (entry.target === footer) {
            // 动态调整画廊的高度
            const footerHeight = entry.contentRect.height;
            gallery.style.paddingBottom = `${footerHeight}px`;
        }
    }
});

// 开始观察底栏
observer.observe(footer);

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 2000);
}
