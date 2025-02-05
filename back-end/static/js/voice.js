//webkitURL 已被弃用，但仍然存在
URL = window.URL || window.webkitURL;

var gumStream; 						// 从 getUserMedia() 获取的流
var rec; 							// Recorder.js 对象
var input; 							// 我们将要录制的 MediaStreamAudioSourceNode

// AudioContext 的替代方案（在不可用时）
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext // 用于帮助我们录制的音频上下文

var microphone = document.getElementById("microphone");
var is_active = false;

function stopRecording() {
	microphone.style.backgroundImage = "url('./static/images/voice.png')";
	console.log("[voice.js][stopRecording] 停止录音...");
	// 告诉录制器停止录制
	rec.stop();

	// 停止麦克风访问
	gumStream.getAudioTracks()[0].stop();

	// 创建 WAV blob 并传递给 createDownloadLink
	rec.exportWAV(upload_audio);
}

function startRecording() {
	microphone.style.backgroundImage = "url('./static/images/voice_pushed.png')";
	console.log("[voice.js][startRecording] 开始录音...");
	/*
		一个简单的约束对象，对于更高级的音频功能，请查看
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
	var constraints = { audio: true, video: false }
	/*
		我们正在使用基于标准承诺的 getUserMedia()
		https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("[voice.js][startRecording] getUserMedia() 成功，已创建流，正在初始化 Recorder.js ...");
		/*
			在调用 getUserMedia() 后创建音频上下文
			在通过 AirPods 进行录制时，sampleRate 可能会在调用 getUserMedia() 后更改，就像在 macOS 上一样
			sampleRate 默认为您在操作系统中为播放设备设置的值
		*/
		audioContext = new AudioContext();

		/*  为以后使用将 gumStream 赋值  */
		gumStream = stream;

		/* 使用该流 */
		input = audioContext.createMediaStreamSource(stream);
		/* 
			创建 Recorder 对象并配置以记录单声道音频
			录制2个声道将使文件大小翻倍
		*/
		rec = new Recorder(input, { numChannels: 1 })

		// 启动录制过程
		rec.record()

		console.log("recording start");

	}).catch(function (err) {
		// 如果 getUserMedia() 失败，则启用录制按钮
		console.log("erro in getUserMedia()")
	});
}

// function recording() {
// 	is_active = !is_active;
// 	if (is_active) {
// 		microphone.style.backgroundImage = "url('./static/images/voice_pushed.png')";
// 		console.log("microphone clicked");
// 		/*
// 			一个简单的约束对象，对于更高级的音频功能，请查看
// 			https://addpipe.com/blog/audio-constraints-getusermedia/
// 		*/
// 		var constraints = { audio: true, video: false }
// 		/*
// 			我们正在使用基于标准承诺的 getUserMedia()
// 			https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
// 		*/
// 		navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
// 			console.log("getUserMedia() 成功，已创建流，正在初始化 Recorder.js ...");
// 			/*
// 				在调用 getUserMedia() 后创建音频上下文
// 				在通过 AirPods 进行录制时，sampleRate 可能会在调用 getUserMedia() 后更改，就像在 macOS 上一样
// 				sampleRate 默认为您在操作系统中为播放设备设置的值
// 			*/
// 			audioContext = new AudioContext();

// 			/*  为以后使用将 gumStream 赋值  */
// 			gumStream = stream;

// 			/* 使用该流 */
// 			input = audioContext.createMediaStreamSource(stream);
// 			/* 
// 				创建 Recorder 对象并配置以记录单声道音频
// 				录制2个声道将使文件大小翻倍
// 			*/
// 			rec = new Recorder(input, { numChannels: 1 })

// 			// 启动录制过程
// 			rec.record()

// 			console.log("recording start");

// 		}).catch(function (err) {
// 			// 如果 getUserMedia() 失败，则启用录制按钮
// 			console.log("erro in getUserMedia()")
// 		});
// 	}
// 	else {
// 		microphone.style.backgroundImage = "url('./static/images/voice.png')";
// 		console.log("stop recording");
// 		// 告诉录制器停止录制
// 		rec.stop();

// 		// 停止麦克风访问
// 		gumStream.getAudioTracks()[0].stop();

// 		// 创建 WAV blob 并传递给 createDownloadLink
// 		rec.exportWAV(upload_audio);
// 	}

// }

function upload_audio(blob) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function (e) {
		if (this.readyState === 4) {
			console.log("服务器返回：", e.target.responseText);
		}
	};
	var fd = new FormData();
	fd.append("audio_data", blob, "recorded_audio.wav");
	var sampleRate = audioContext.sampleRate;
	fd.append("sample_rate", sampleRate);
	console.log("[voice.js][upload_audio] 上传音频数据...");
	xhr.open("POST", "/agent/upload_audio", true);
	xhr.send(fd);
}