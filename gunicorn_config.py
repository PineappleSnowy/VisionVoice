# gunicorn_config.py

bind = "0.0.0.0:443"
workers = 4
certfile = "/ssl/cert.pem"
keyfile = "/ssl/cert.key"