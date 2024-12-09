"""用于合成所需的固定音频"""
from agent_files.agent_speech_synthesis import agent_audio_generate

if __name__ == "__main__":
    audio_file_path = ".cache/find_end.wav"
    with open(audio_file_path, "wb") as audio_file:
        audio_file.write(agent_audio_generate("寻物模式已关闭。"))
