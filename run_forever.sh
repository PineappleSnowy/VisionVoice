#!/bin/bash

while true
do
    # 使用指定的Python解释器运行run.py程序
    /usr/bin/python3 run.py &
    pid=$!
    # 每三小时（10800秒，可按需调整为6小时即21600秒）重启一次
    sleep 10800
    # 终止正在运行的程序
    kill $pid
    wait $pid
done