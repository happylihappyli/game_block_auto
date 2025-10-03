import pyttsx3
import time

# 初始化语音引擎
def initialize_engine():
    engine = pyttsx3.init()
    # 设置语速
    engine.setProperty('rate', 150)
    # 设置音量
    engine.setProperty('volume', 1.0)
    # 设置中文语音（尝试获取可用的中文语音）
    voices = engine.getProperty('voices')
    for voice in voices:
        if 'chinese' in voice.id.lower() or 'china' in voice.id.lower() or 'mandarin' in voice.id.lower():
            engine.setProperty('voice', voice.id)
            break
    return engine

# 播放语音提示
def play_voice_prompt(message="主人运行完毕，过来看看！"):
    try:
        engine = initialize_engine()
        engine.say(message)
        engine.runAndWait()
        print(f"已播放语音提示: {message}")
    except Exception as e:
        print(f"播放语音失败: {e}")

if __name__ == "__main__":
    # 主程序执行时的语音提示
    play_voice_prompt()