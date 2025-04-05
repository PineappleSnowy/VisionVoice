from flask import (
    Blueprint,
    request,
    jsonify,
    send_from_directory
)
import os
import json




USER_IMAGE_FOLDER = "./user_images/"
gallery_images_bp = Blueprint("gallery_images", __name__)


# 寻物画廊相关API

@gallery_images_bp.route("/galleryImages", methods=["GET"])
def get_images():
    images = []
    curr_user = "StarsAC"
    user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user, "item_images")
    user_album_folder = os.path.join(USER_IMAGE_FOLDER, curr_user, "album", "images")

    if not os.path.exists(user_image_folder):
        os.makedirs(user_image_folder)
    if not os.path.exists(user_album_folder):
        os.makedirs(user_album_folder)

    mode = request.args.get("mode", "find_item")

    if mode == "album":
        target_folder = user_album_folder

        talk_speed_config_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "talk_speed_config.json"
        )

        if not os.path.exists(talk_speed_config_path):  # 初始化语速配置文件
            with open(talk_speed_config_path, "w") as f:
                album_images = os.listdir(
                    os.path.join(USER_IMAGE_FOLDER, curr_user, "album", "images")
                )
                album_images_withot_ext = [
                    os.path.splitext(image)[0] for image in album_images
                ]
                talk_speed_config = {image: 8 for image in album_images_withot_ext}
                json.dump(talk_speed_config, f)
    else:
        target_folder = user_image_folder

    # 获取文件列表并按文件名逆序排序
    file_list = sorted(os.listdir(target_folder), reverse=True)

    for filename in file_list:
        if filename.endswith((".jpg")):
            name, ext = os.path.splitext(filename)
            images.append(
                {
                    "name": name,
                    "url": f"http://localhost/image/{curr_user}/{filename}?mode={mode}",
                    "finish_des": os.path.exists(
                        os.path.join(
                            USER_IMAGE_FOLDER,
                            curr_user,
                            "album",
                            "audios",
                            name + ".mp3",
                        )
                    ),
                }
            )

    return jsonify(images)


@gallery_images_bp.route("/galleryImages", methods=["POST"])
def save_item_image():
    curr_user = "StarsAC"
    user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user, "item_images")

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    file = request.files["file"]
    filename = file.filename
    if filename == "":
        return jsonify({"success": False, "error": "No selected file"}), 400
    if file:
        name, ext = os.path.splitext(filename)
        new_filename = name + ".jpg"
        if os.path.exists(os.path.join(user_image_folder, new_filename)):
            return jsonify({"success": False, "error": "该图片已存在！"}), 400
        try:
            file.save(os.path.join(user_image_folder, new_filename))
        except Exception as e:
            return jsonify({"success": False, "error": "图片保存失败！"}), 400
        return (
            jsonify(
                {
                    "success": True,
                    "image_name": name,
                    "image_url": f"http://localhost/image/{curr_user}/{new_filename}?mode=find_item",
                }
            ),
            200,
        )
    return jsonify({"success": False, "error": "File upload failed"}), 400


@gallery_images_bp.route("/image/<user>/<filename>", methods=["GET"])
def get_image(user, filename):
    mode = request.args.get("mode", "find_item")
    if mode == "album":
        user_image_folder = os.path.join(USER_IMAGE_FOLDER, user, "album", "images")
    else:
        user_image_folder = os.path.join(USER_IMAGE_FOLDER, user, "item_images")
    return send_from_directory(user_image_folder, filename)


@gallery_images_bp.route("/galleryImages", methods=["PUT"])
def rename_image():
    curr_user = "StarsAC"
    user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user, "item_images")

    data = request.get_json()
    old_name = data["oldName"]
    new_name = data["newName"]

    # 查找旧文件名对应的文件
    old_file = None
    for filename in os.listdir(user_image_folder):
        name, ext = os.path.splitext(filename)
        if name == old_name:
            old_file = filename
            break

    if old_file is None:
        print(f"Old file not found: {old_name}")
        return jsonify({"success": False, "error": "Old file not found"}), 400

    old_path = os.path.join(user_image_folder, old_file)
    new_file = new_name + os.path.splitext(old_file)[1]
    new_path = os.path.join(user_image_folder, new_file)

    try:
        os.rename(old_path, new_path)
        return (
            jsonify(
                {
                    "success": True,
                    "url": f"http://localhost/image/{curr_user}/{new_file}",
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Rename failed: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 400


@gallery_images_bp.route("/galleryImages", methods=["DELETE"])
def delete_image():
    curr_user = "StarsAC"
    mode = request.args.get("mode", "find_item")
    data = request.get_json()
    image_name = data["image_name"]
    # 查找文件名对应的文件
    file_to_delete = None
    if mode == "album":
        talk_speed_config_path = os.path.join(
            USER_IMAGE_FOLDER, curr_user, "album", "talk_speed_config.json"
        )
        with open(talk_speed_config_path, "r") as f:
            talk_speed_config = json.load(f)
        if image_name in talk_speed_config:
            del talk_speed_config[image_name]
            with open(talk_speed_config_path, "w") as f:
                json.dump(talk_speed_config, f)
        delete_folders = ["album/images", "album/audios", "album/texts"]
    else:
        delete_folders = ["item_images"]
    for folder in delete_folders:
        user_image_folder = os.path.join(USER_IMAGE_FOLDER, curr_user, folder)
        for filename in os.listdir(user_image_folder):
            name_without_ext, ext = os.path.splitext(filename)
            if name_without_ext == image_name:
                file_to_delete = filename
                file_path = os.path.join(user_image_folder, file_to_delete)
                try:
                    os.remove(file_path)
                    break
                except Exception as e:
                    return jsonify({"success": False, "error": str(e)}), 400
    if file_to_delete is None:
        return jsonify({"success": False, "error": "File not found"}), 400
    return (
        jsonify(
            {"success": True, "url": f"/image/{curr_user}/{file_to_delete}?mode={mode}"}
        ),
        200,
    )


