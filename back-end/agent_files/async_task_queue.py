"""
该模块用于管理多线程任务队列，按请求顺序获取任务结果
"""

from typing import Dict

import sys

sys.path.append("..")

try:
    from lib import logging
except:
    raise ImportError("未发现自定义的 logging 模块.")

import threading


class AsyncTaskQueue:
    def __init__(self):

        # 存储任务的序号和结果
        self.results: Dict[int, str] = {}

        # 当前需要获取的结果序号
        self.current_index = 0
        
        # 任务总数
        self.task_count = 0

        # 结果更新的事件
        self.result_event = threading.Event()

        # 存储正在执行的任务
        self.tasks = {}

        # 用于线程安全，如果其他线程已经持有锁，那么该线程要等待锁的释放
        self.lock = threading.Lock()

    def add_task_sync(self, func, *args, **kwargs):
        """
        添加任务并立即在后台线程执行
        """

        # 分配任务编号
        with self.lock:
            task_index = self.task_count
            self.task_count += 1

        def task_wrapper():
            try:
                result = func(*args, **kwargs)

                logging.info("async_task_queue", "add_task_sync", f"合成 {args[0]} 的任务加入了队列", color="blue")

                # 保存任务结果
                with self.lock:
                    self.results[task_index] = result

                    # 通知 "已经有返回的结果了"
                    self.result_event.set()

            except Exception as e:
                logging.error("async_task_queue", "task_wrapper", f"任务执行错误: {e}")

        # 在新线程中执行任务
        thread = threading.Thread(target=task_wrapper)
        thread.start()
        self.tasks[task_index] = thread

    def get_next_result_sync(self):
        """
        按照添加任务的顺序获取下一个结果
        """
        while True:
            with self.lock:
                # 检查当前序号的结果是否已经返回
                if self.current_index in self.results:
                    result = self.results.pop(self.current_index)

                    # 如果任务已经完成，则从 tasks 中移除
                    if self.current_index in self.tasks:
                        self.tasks.pop(self.current_index)

                    # 更新当前序号
                    self.current_index += 1

                    return result

            # 等待新的结果
            self.result_event.clear()

            # 添加超时，提供退出机制，避免死锁
            self.result_event.wait(timeout=1) 

    def is_empty(self):
        """
        检查是否还有未完成的任务
        """
        with self.lock:
            return len(self.tasks) == 0 and len(self.results) == 0

    def reset(self):
        """
        重置任务队列
        """
        with self.lock:
            self.results = {}
            self.current_index = 0
            self.task_count = 0
            self.tasks = {}
            self.result_event.clear()