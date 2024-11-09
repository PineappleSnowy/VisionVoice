// document.write(window.innerWidth,"a",window.innerHeight);//412 * 784
//定义基准rem
const html = document.querySelector('html');
html.style.fontSize = window.innerWidth * 100 / 412 + 'px';

let stream;
const goBack = document.querySelector('.goBack');
const toggleCamera = document.querySelector('.toggleCamera');
const openCamera = document.querySelector('.openCamera');
const hangUp = document.querySelector('.hangUp');
const container = document.querySelector('.container');
const video = document.querySelector('video');
const img = document.querySelector('img');
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
            stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: "environment"}, audio: false });
            video.srcObject = stream;
            video.play();
            video.style.display = 'block';
            container.classList.add('shifted');
            toggleCamera.style.display = 'block';
            img.style.display = 'none';
            goBack.style.color = 'white';
            toggleCamera.style.color = 'white';
        } else {
            video.srcObject = null;
            video.style.display = 'null';
            container.classList.remove('shifted');
            toggleCamera.style.display = 'none';
            img.style.display = 'block';
            goBack.style.color = 'black';
        }
    }catch (err) {
        console.log(err);
    }

});

toggleCamera.addEventListener('click',async ()=>{
    if (stream) {
        video.srcObject = null;
        stream.getTracks().forEach(track => track.stop());
        isFrontCamera = !isFrontCamera;
        const constraints = { video: { facingMode: isFrontCamera ? 'user' : 'environment' } };
        console.log(constraints);
        try{
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
        }catch(err){
            alert(err);
        }
        
    }
});