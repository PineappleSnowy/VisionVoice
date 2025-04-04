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
async function initAudioAnalyser(stream: MediaStream): Promise<{ analyser: AnalyserNode; dataArray: Float32Array }> {
  const audioContext: AudioContext = new AudioContext();
  const analyser: AnalyserNode = audioContext.createAnalyser();
  const microphone: MediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
  microphone.connect(analyser);
  analyser.fftSize = 2048;
  const bufferLength: number = analyser.frequencyBinCount;
  const dataArray: Float32Array = new Float32Array(bufferLength);

  return {
      analyser,
      dataArray
  };
}

/**
* @description 计算当前音频的平均分贝值
* @param {AnalyserNode} analyser 音频分析器
* @param {Float32Array} dataArray 存储音频数据的数组
* @returns {number} 当前音频的平均分贝值
*/
function detectDB(analyser: AnalyserNode, dataArray: Float32Array): number {
  // 获取当前音频的时域数据
  analyser.getFloatTimeDomainData(dataArray);

  // 计算平均值
  let sum: number = 0;
  for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i]);
  }
  const average: number = sum / dataArray.length;

  // 计算分贝值
  const db: number = 20 * Math.log10(average);

  return db;
}

export { initAudioAnalyser, detectDB };