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
            images.append({
                'name': filename,
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
    old_path = os.path.join(IMAGE_FOLDER, old_name)
    new_path = os.path.join(IMAGE_FOLDER, new_name)
    try:
        os.rename(old_path, new_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route("/hello")
def hello():
    return "Hello World!"

if __name__ == '__main__':
    app.run(debug=True)