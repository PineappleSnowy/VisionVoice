from PIL import Image
import os

def convert_images_to_jpg(folder_path):
    # 获取文件夹中的所有文件
    for filename in os.listdir(folder_path):
        # 获取文件的完整路径
        file_path = os.path.join(folder_path, filename)
        
        # 检查文件是否为图片
        if filename.endswith(('.png', '.jpeg', '.gif', '.bmp')):
            # 打开图片
            with Image.open(file_path) as img:
                # 获取文件名（不包括扩展名）
                name, ext = os.path.splitext(filename)
                
                # 新的文件路径
                new_file_path = os.path.join(folder_path, name + '.jpg')
                
                # 将图片转换为 RGB 模式并保存为 JPG 格式
                img.convert('RGB').save(new_file_path, 'JPEG')
                
                # 删除原始文件
                os.remove(file_path)
                print(f"Converted {filename} to {name}.jpg")

# 指定文件夹路径
folder_path = './back-end/user_images/'

# 调用函数进行转换
convert_images_to_jpg(folder_path)