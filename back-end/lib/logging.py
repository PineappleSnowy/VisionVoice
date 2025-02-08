def error(file: str, func: str, msg: str):
    print(f"\033[91m[{file}][{func}]: {msg}\033[0m")


def info(file: str, func: str, msg: str, color: str = "white"):
    if color == "white":
        print(f"\033[97m[{file}][{func}] {msg}\033[0m")
    elif color == "green":
        print(f"\033[92m[{file}][{func}] {msg}\033[0m")
    elif color == "yellow":
        print(f"\033[93m[{file}][{func}] {msg}\033[0m")
    elif color == "red":
        print(f"\033[91m[{file}][{func}] {msg}\033[0m")
    elif color == "blue":
        print(f"\033[94m[{file}][{func}] {msg}\033[0m")
    else:
        print(f"\033[97m[{file}][{func}] {msg}\033[0m")


def success(file: str, func: str, msg: str):
    print(f"\033[92m[{file}][{func}] {msg}\033[0m")
