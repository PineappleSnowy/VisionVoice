// document.write(window.innerWidth,"a",window.innerHeight);//412 * 784
//定义基准rem
const html = document.querySelector('html');
html.style.fontSize = window.innerWidth * 100 / 412 + 'px';

let stream;
let audioStream;
let vudio;
const goBack = document.querySelector('.goBack');
const toggleCamera = document.querySelector('.toggleCamera');
const openCamera = document.querySelector('.openCamera');
const hangUp = document.querySelector('.hangUp');
const container = document.querySelector('.container');
const video = document.querySelector('video');
const img = document.querySelector('img');
const audio = document.querySelector('#audio');
const waveShape = document.querySelector('#waveShape');
let videoChat = false;
let isFrontCamera = false;

goBack.addEventListener('click', () => {
    window.location.href = './index.html';
});

hangUp.addEventListener('click', () => {
    window.location.href = './index.html';
});

openCamera.addEventListener('click', async () => {
    try {
        videoChat = !videoChat;
        if (videoChat) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
                video.srcObject = stream;
            }catch(err) {
                if (err.name === 'NotAllowedError') {
                    alert('请允许访问您的摄像头！');
                } else if (err.name === 'NotFoundError') {
                    alert('未找到可用的摄像头！');
                } else {
                    alert('发生错误: ' + err.message);
                }
            }

            video.style.display = 'block';
            container.classList.add('shifted');
            toggleCamera.style.display = 'block';
            img.style.display = 'none';
            goBack.style.color = 'white';
            toggleCamera.style.color = 'white';
        } else {
            stream.getTracks().forEach((track) => {
                track.stop();
            });
            video.srcObject = null;
            video.style.display = 'null';
            container.classList.remove('shifted');
            toggleCamera.style.display = 'none';
            img.style.display = 'block';
            goBack.style.color = 'black';
        }
    } catch (err) {
        console.log(err);
    }

});

toggleCamera.addEventListener('click', async () => {
    if (stream) {
        
        isFrontCamera = !isFrontCamera;
        // Stop previous stream
        stream.getTracks().forEach((track) => {
            track.stop();
        });
        if(isFrontCamera){
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false});
                video.srcObject = stream;
            } catch (err) {
                alert(err);
            }
        }else{
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
            } catch (err) {
                alert(err);
            }
        }
        
    }
});

window.onload = async () => {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // audio.srcObject = audioStream;
        vudio = new window.Vudio(audioStream, waveShape, {
            effect: 'waveform', // 当前只有'waveform'这一个效果，还有lighting效果
            accuracy: 16, // 精度,实际表现为波形柱的个数，范围16-16348，必须为2的N次方
            width: window.innerWidth * 100 / 412 * 1.5, // canvas宽度，会覆盖canvas标签中定义的宽度
            height: window.innerWidth * 100 / 412 * 1, // canvas高度，会覆盖canvas标签中定义的高度
            waveform: {
                maxHeight: 80, // 最大波形高度
                minHeight: 0, // 最小波形高度
                spacing: 5, // 波形间隔
                color: '#000', // 波形颜色，可以传入数组以生成渐变色
                shadowBlur: 0, // 阴影模糊半径
                shadowColor: '#f00', // 阴影颜色
                fadeSide: true, // 渐隐两端
                horizontalAlign: 'center', // 水平对齐方式，left/center/right
                verticalAlign: 'middle', // 垂直对齐方式 top/middle/bottom
                radius: 20 //添加属性，设置圆角
            }
        
        });
        vudio.dance();
    }catch(err) {
        alert(err);
    }
};