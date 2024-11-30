from flask import Flask, jsonify, send_from_directory, render_template, request
import os

app = Flask(__name__)

@app.route('/', methods=['GET'])
def route():
    return render_template("photo_manage.html")

# 设置图片文件夹路径
IMAGE_FOLDER = './user_images/images'

@app.route('/images', methods=['GET'])
def get_images():
    images = []
    for filename in os.listdir(IMAGE_FOLDER):
        if filename.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            name, ext = os.path.splitext(filename)
            images.append({
                'name': name,
                'url': f'/image/{filename}'
            })
    return jsonify(images)

@app.route('/image/<filename>', methods=['GET'])
def get_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

@app.route('/rename_image', methods=['POST'])
def rename_image():
    data = request.get_json()
    old_name = data['oldName']
    new_name = data['newName']
    
    # 查找旧文件名对应的文件
    old_file = None
    for filename in os.listdir(IMAGE_FOLDER):
        name, ext = os.path.splitext(filename)
        if name == old_name:
            old_file = filename
            break
    
    if old_file is None:
        return jsonify({'success': False, 'error': 'Old file not found'})

    old_path = os.path.join(IMAGE_FOLDER, old_file)
    new_path = os.path.join(IMAGE_FOLDER, new_name + os.path.splitext(old_file)[1])
    
    try:
        os.rename(old_path, new_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)