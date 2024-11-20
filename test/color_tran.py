from PIL import Image

def change_visible_to_white(image_path, output_path):
    # 打开图像
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # 检查像素的透明度
        if item[3] > 0:  # 如果像素是可见的
            new_data.append((255, 255, 255, item[3]))  # 将颜色变为白色，保留原来的透明度
        else:
            new_data.append(item)  # 保留原来的像素

    # 更新图像数据
    img.putdata(new_data)
    # 保存图像
    img.save(output_path)

# 使用示例
change_visible_to_white("./static/images/phone.png", "./test/output.png")