"""
异步任务测试 - 立即执行并实时获取有序结果
"""

import asyncio
from typing import Dict

import sys

sys.path.append("..")
from lib import logging


class AsyncTaskQueue:
    def __init__(self):
        # 存储任务的序号和结果
        self.results: Dict[int, str] = {}
        # 当前需要获取的结果序号
        self.current_index = 0
        # 任务总数
        self.task_count = 0

        # 结果更新的事件
        self.result_event = asyncio.Event()

    async def add_task(self, coro):
        """
        添加任务并立即执行

        Args:
            coro: coroutine 协程对象
        """

        # 分配任务编号
        task_index = self.task_count
        self.task_count += 1

        # 创建任务
        task = asyncio.create_task(coro)

        def callback(t: asyncio.Task):
            """
            任务完成后的回调函数

            Args:
                t: asyncio.Task 已完成的 Future 任务对象
            """
            try:
                # 保存任务结果
                self.results[task_index] = t.result()
                logging.info(
                    "async_test",
                    "add_task",
                    f"有任务完成，快去看看：{self.results}",
                    "green",
                )

                # 通知 "已经有返回的结果了"
                self.result_event.set()

            except Exception as e:
                logging.error("async_test", "add_task", f"任务执行错误: {e}", "red")

        # 添加任务完成后的回调函数
        # 当任务完成时，会调用回调函数，并将任务结果保存到 results 字典中
        task.add_done_callback(callback)

    async def get_next_result(self):
        """
        获取下一个按序完成的结果
        """
        while True:

            # 检查下一个任务是否已经返回结果
            if self.current_index in self.results:
                result = self.results.pop(self.current_index)
                logging.info(
                    "async_test", "get_next_result", f"获得结果: {result}", "green"
                )
                self.current_index += 1
                return result

            logging.info("async_test", "get_next_result", "没看着", "yellow")
            # 清空事件，避免轮询
            self.result_event.clear()

            # 等待新的结果
            await self.result_event.wait()
            logging.info("async_test", "get_next_result", "收到！", "green")


async def main():
    # 创建任务队列
    task_queue = AsyncTaskQueue()

    # 添加第一个任务（5秒任务）
    await task_queue.add_task(long_task())

    # 等待1秒后添加第二个任务
    await asyncio.sleep(1)
    await task_queue.add_task(short_task())

    # 开始获取结果的任务
    for _ in range(2):
        await task_queue.get_next_result()
        # print(f"获得第{i+1}个结果:", result)


async def long_task():
    """模拟一个耗时5秒的任务"""
    print("开始执行5秒任务...")
    await asyncio.sleep(5)
    return "5秒任务结果"


async def short_task():
    """模拟一个耗时1秒的任务"""
    print("开始执行1秒任务...")
    await asyncio.sleep(1)
    return "1秒任务结果"


if __name__ == "__main__":
    asyncio.run(main())
