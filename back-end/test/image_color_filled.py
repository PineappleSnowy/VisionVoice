from PIL import Image

def convert_to_white(image_path, output_path):
    # 打开图像
    img = Image.open(image_path).convert("RGBA")
    
    # 获取图像数据
    data = img.getdata()
    
    # 创建一个新的数据列表
    new_data = []
    
    # 遍历每个像素
    for item in data:
        # 如果像素是透明的，保持不变
        if item[3] == 0:
            new_data.append(item)
        else:
            # 将可见部分转为白色
            new_data.append((255, 255, 255, 255))
    
    # 更新图像数据
    img.putdata(new_data)
    
    # 保存图像
    img.save(output_path, "PNG")

# 示例使用
convert_to_white(r"back-end\static\images\arrow_right.png", r"back-end\static\images\arrow_right1.png")