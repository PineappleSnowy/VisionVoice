#!/bin/bash

# 定义Python程序的路径，替换成你实际的Python脚本路径
python_script_path="run.py"

while true; do
    # 启动Python程序，后台运行，你可以根据Python程序的实际需求调整启动参数等情况
    /usr/bin/python3 $python_script_path &
    pid=$!
    echo "Python program started with PID: $pid"

    # 睡眠6小时（6 * 60 * 60 秒）
    sleep $((3 * 60 * 60))

    # 尝试杀死之前启动的Python程序进程
    if kill -0 $pid 2>/dev/null; then
        echo "Stopping the Python program..."
        kill $pid
        wait $pid 2>/dev/null
        echo "Python program stopped"
    else
        echo "Python program already stopped"
    fi
done