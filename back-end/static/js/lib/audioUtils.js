/**
 * @fileoverview 音频处理模块
 * @description 该模块用于处理音频相关的操作
 * @author Yang-ZhiHang
 */


/**
 * @function initAudioAnalyser
 * @description 初始化音频分析器
 * @param {MediaStream} stream 音频流
 * @returns {Object} 音频分析器和数据数组
 */
async function initAudioAnalyser(stream) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    return {
        analyser,
        dataArray
    };
}

/**
* @description 计算当前音频的平均分贝值
* @returns {Number} 当前音频的平均分贝值
*/
function detectDB(analyser, dataArray) {

    // 获取当前音频的时域数据
    analyser.getFloatTimeDomainData(dataArray);
 
    // 计算平均值
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i]);
    }
    const average = sum / dataArray.length;
 
    // 计算分贝值
    const db = 20 * Math.log10(average);
 
    return db;
 }

export { initAudioAnalyser, detectDB };
