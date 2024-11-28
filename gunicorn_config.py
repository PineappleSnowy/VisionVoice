"""
gunicorn配置文件，可使用gunicorn服务器以多进程方式运行后端
bash命令：gunicorn -c gunicorn_config.py run:app
"""

bind = "0.0.0.0:443"
workers = 4
certfile = "/ssl/cert.pem"
keyfile = "/ssl/cert.key"