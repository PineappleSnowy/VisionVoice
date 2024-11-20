from PIL import Image, ImageFilter

def thicken_lines(image_path, output_path, thickness=2):
    # 打开图像
    img = Image.open(image_path).convert("L")  # 转换为灰度图像
    img = img.point(lambda p: p > 128 and 255)  # 二值化处理

    # 创建一个新的图像用于存储结果
    thickened_img = Image.new("L", img.size, 255)

    # 遍历图像的每个像素
    for x in range(img.width):
        for y in range(img.height):
            if img.getpixel((x, y)) == 0:  # 如果是线条像素
                for dx in range(-thickness, thickness + 1):
                    for dy in range(-thickness, thickness + 1):
                        if 0 <= x + dx < img.width and 0 <= y + dy < img.height:
                            thickened_img.putpixel((x + dx, y + dy), 0)

    # 保存图像
    thickened_img.save(output_path)

# 使用示例
thicken_lines("./static/images/phone.png", "./test/output_thickened.png", thickness=2)