/**
 * 该模块用于处理音频的播放
 */

var audioList = []; // 保存音频数据的列表
var audioIndex = 0; // 当前播放的音频索引

// 获取音频播放器元素
const audioPlayer = document.getElementById('audioPlayer');

// 播放下一个音频
function playNextAudio() {
    // console.log('[audio.js][playNextAudio] audioList[audioIndex]: %s', audioList[audioIndex]);
    if (audioList[audioIndex] != undefined) {
        pauseDiv.style.backgroundImage = `url('${'./static/images/pause.png'}')`;
        var audioBlob = new Blob([audioList[audioIndex]], { type: 'audio/mp3' });
        var audioURL = URL.createObjectURL(audioBlob);

        audioPlayer.src = audioURL;

        try {
            audioPlayer.play();
            console.log('音频片段播放中...');
        } catch (error) {
            console.log('音频片段播放失败.');
            console.log('错误信息：', error);
        }
    } else {
        console.log('undefined audioIndex: %d', audioIndex);
    }
}

// 监听音频播放结束事件
audioPlayer.onended = function () {
    // console.log('[audio.js][audioPlayer.onended] audioIndex: %d', audioIndex);
    audioIndex++;
    pauseDiv.style.backgroundImage = `url('${'./static/images/pause_inactive.png'}')`;
    playNextAudio();
};

// 监听后端发送的 agent_play_audio_chunk 事件
socket.on('agent_play_audio_chunk', function (data) {
    // console.log('[audio.js][socket.on][agent_play_audio_chunk] data: %s', data);
    var index = data['index'];
    var audioData = data['audio_chunk']; // 后端发送的音频数据

    // 将音频数据添加到音频列表
    audioList[index] = audioData;

    // 如果当前没有音频正在播放，开始播放
    if (audioPlayer.paused) {
        audioPlayer.pause();
        // console.log("播放ing..");
        playNextAudio();
    }
});


// 监听后端发送的 agent_speech_rec 语音识别事件（agent.js 未使用）
socket.on('agent_speech_rec', function (data) {
    var rec_result = data['rec_result'];
    console.log('[audio.js][socket.on][agent_speech_rec] rec_result: %s', rec_result);
    textArea.value += rec_result;
    sendMessage()
})