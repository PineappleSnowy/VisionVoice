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
        return jsonify({'success': False, 'error': 'Old file not found'}), 400

    old_path = os.path.join(IMAGE_FOLDER, old_file)
    new_path = os.path.join(IMAGE_FOLDER, new_name +
                            os.path.splitext(old_file)[1])

    try:
        os.rename(old_path, new_path)
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    file = request.files['file']
    filename = file.filename
    if filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    if file:
        if os.path.exists(os.path.join(IMAGE_FOLDER, filename)):
            return jsonify({'success': False, 'error': 'File already exists'}), 400
        file.save(os.path.join(IMAGE_FOLDER, filename))
        name, ext = os.path.splitext(filename)
        return jsonify({'success': True, 'image_name': name, 'image_url': f"/image/{filename}"}), 200
    return jsonify({'success': False, 'error': 'File upload failed'}), 400


@app.route('/delete_image', methods=['POST'])
def delete_image():
    data = request.get_json()
    name = data['name']

    # 查找文件名对应的文件
    file_to_delete = None
    for filename in os.listdir(IMAGE_FOLDER):
        name_without_ext, ext = os.path.splitext(filename)
        if name_without_ext == name:
            file_to_delete = filename
            break

    if file_to_delete is None:
        return jsonify({'success': False, 'error': 'File not found'}), 400

    file_path = os.path.join(IMAGE_FOLDER, file_to_delete)

    try:
        os.remove(file_path)
        return jsonify({'success': True, 'url': f'/image/{file_to_delete}'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)
