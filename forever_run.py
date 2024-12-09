import subprocess
import time

def run_program():
    while True:
        # 使用指定的解释器运行另一个Python程序
        process = subprocess.Popen(['pyt', 'your_script.py'])
        
        # 每六小时重启一次
        time.sleep(3 * 60 * 60)
        
        # 终止当前运行的程序
        process.terminate()
        process.wait()

if __name__ == "__main__":
    run_program()