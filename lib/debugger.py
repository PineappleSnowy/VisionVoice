def error(file, func, msg):
    print(f"\033[91m[{file}]{func}]: {msg}\033[0m")

def info(file, func, msg):
    print(f"\033[92m[{file}][func: {func}][info] {msg}\033[0m")

def success(file, func, msg):
    print(f"\033[93m[{file}][func: {func}][success] {msg}\033[0m")

