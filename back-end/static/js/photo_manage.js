/* 该文件为帮我寻物物品模板管理模块的内容 */

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    fetch('/images', {
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
                            <button onclick="openModal('${image.url}', '${image.name}', this)">
                                <img src="${image.url}" alt="${image.name}">
                                <p>${image.name}</p>
                            </button>
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
        disableButtons(true);
        const file = fileInput.files[0];
        if (file) {
            // 禁用所有按钮
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('token');
            fetch('/save_item_image', {
                method: 'POST',
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const gallery = document.getElementById('gallery');
                        const item = document.createElement('div');
                        item.className = 'gallery-item';
                        item.innerHTML = `
                        <button onclick="openModal('${data.image_url}', '${data.image_name}', this)">
                            <img src="${data.image_url}" alt="${data.image_name}">
                            <p>${data.image_name}</p>
                        </button>
                        `;
                        gallery.appendChild(item);
                        // 显示myModal窗口
                        item.querySelector('button').click();
                    } else {
                        console.error('Error uploading image:', data.error);
                        showError(data.error);
                    }
                    // 启用所有按钮
                    disableButtons(false);
                })
                .catch(error => {
                    console.error('Error:', error);
                    // 启用所有按钮
                    disableButtons(false);
                    showError('上传图片时发生错误！');
                });
        }
        else {
            disableButtons(false);
            console.log("Inputed file is empty")
        }
        footer.classList.remove('expanded');
        addButton.style.display = 'block';
        cameraButton.style.display = 'none';
        albumButton.style.display = 'none';
        cancelButton.style.display = 'none';
    });

    function findGalleryItemByAlt(altText) {
        const galleryItems = document.querySelectorAll('.gallery-item');
        for (let item of galleryItems) {
            const img = item.querySelector('img');
            if (img && img.alt === altText) {
                return item;
            }
        }
        return null;
    }

    document.getElementById('deleteButton').addEventListener('click', function () {
        if (!deleteButton_clicked) {
            deleteButton_clicked = true;
            disableButtons(true);
            const imageName = document.getElementById('modalImage').alt;
            const token = localStorage.getItem('token');
            fetch('/delete_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ image_name: imageName })
            })
                .then(response => response.json())
                .then(data => {
                    const statusMessage = document.getElementById('statusMessage');
                    if (data.success) {
                        statusMessage.textContent = '删除成功';
                        statusMessage.style.color = 'green';
                        const galleryItem = findGalleryItemByAlt(imageName);
                        galleryItem.remove();
                        setTimeout(() => {
                            deleteButton_clicked = false;
                            disableButtons(false);
                            document.getElementById('backButton').click();
                        }, 500);
                    } else {
                        statusMessage.textContent = '删除失败';
                        statusMessage.style.color = 'red';
                        deleteButton_clicked = false;
                        disableButtons(false);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    const statusMessage = document.getElementById('statusMessage');
                    statusMessage.textContent = '删除失败';
                    statusMessage.style.color = 'red';
                    deleteButton_clicked = false;
                    disableButtons(false);
                });
        }
    });

    document.getElementById('backButton').addEventListener('click', function () {
        const modal = document.getElementById('myModal');
        modal.style.display = 'none';
        document.getElementById('statusMessage').textContent = '';
    });
});

function disableButtons(disable) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = disable;
    });
}

let renameButton_clicked = false;
let deleteButton_clicked = false;

function openModal(url, name, button) {
    const modal = document.getElementById('myModal');
    const modalImage = document.getElementById('modalImage');
    const imageName = document.getElementById('imageName');
    const statusMessage = document.getElementById('statusMessage');

    modal.style.display = 'block';
    modalImage.src = url;
    modalImage.alt = name;
    imageName.value = name;

    // 直接赋值新的点击事件，覆盖之前的事件
    document.getElementById('renameButton').onclick = function () {
        if (!renameButton_clicked) {
            renameButton_clicked = true;
            document.getElementById('renameButton').disabled = true;
            disableButtons(true);
            const newName = document.getElementById('imageName').value;
            console.log(button);
            const oldName = button.querySelector('p').innerText;
            console.log('oldName:', oldName);

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
                    renameButton_clicked = false;
                    disableButtons(false)
                    if (data.success) {
                        console.log('Image name updated successfully');
                        modalImage.alt = newName;
                        // 更新前端显示的图片名称
                        button.querySelector('p').innerText = newName;
                        button.querySelector('img').alt = newName;
                        console.log('button:', button);
                        button.setAttribute('onclick', `openModal('${data.url}', '${newName}', this)`);

                        statusMessage.textContent = '修改成功';
                        statusMessage.style.color = 'green';
                    } else {
                        console.error('Error updating image name');
                        statusMessage.textContent = '修改失败';
                        statusMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    renameButton_clicked = false;
                    disableButtons(false);
                    console.error('Error:', error);
                    statusMessage.textContent = '修改失败';
                    statusMessage.style.color = 'red';
                });
        }
    };
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