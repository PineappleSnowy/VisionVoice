"""
gunicorn配置文件，可使用gunicorn服务器以多进程方式运行后端
bash命令：gunicorn -c gunicorn_config.py run:app
"""

bind = "0.0.0.0:443"
workers = 3
worker_class = "gevent"  # 或者使用 "eventlet"
certfile = "/ssl/cert.pem"
keyfile = "/ssl/cert.key"
timeout = 50  # 设置超时时间，如果一个请求在指定的时间内没有完成，Gunicorn 将会终止该请求并重新启动 worker