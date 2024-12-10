#!/bin/bash

# 定义Python程序所在的目录，根据实际情况调整
python_script_dir="/root/new_VisionVoice_UI"
# 定义Python程序的文件名，替换成你实际的Python脚本文件名（假设在上述目录下）
python_script_name="run.py"
python_script_path="${python_script_dir}/${python_script_name}"

while true; do
    # 先切换到指定目录
    cd $python_script_dir
    if [ $? -ne 0 ]; then
        echo "Failed to change directory to $python_script_dir"
        exit 1
    fi

    # 使用sudo启动Python程序，后台运行，你可以根据Python程序的实际需求调整启动参数等情况
    sudo /usr/bin/python3 $python_script_path &
    pid=$!
    echo "Python program started with PID: $pid"

    # 睡眠3小时（3 * 60 * 60 秒）
    sleep $((3 * 60 * 60))

    # 尝试杀死之前启动的Python程序进程
    if kill -0 $pid 2>/dev/null; then
        echo "Stopping the Python program..."
        sudo kill $pid
        wait $pid 2>/dev/null
        echo "Python program stopped"
    else
        echo "Python program already stopped"
    fi
done