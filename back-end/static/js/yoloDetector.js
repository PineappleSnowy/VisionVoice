// const resnetModelPath = '/static/models/resnet-v2-tfjs-50-feature-vector-v2/model.json';
const yoloModelPath = '/static/models/yolo11s_web_model/model.json';

const labels = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
    "toothbrush"
];

const labelen_ch = {
    "person": "人",
    "bicycle": "自行车",
    "car": "汽车",
    "motorcycle": "摩托车",
    "airplane": "飞机",
    "bus": "公交车",
    "train": "火车",
    "truck": "卡车",
    "boat": "船",
    "traffic light": "交通信号灯",
    "fire hydrant": "消防栓",
    "stop sign": "停车标志",
    "parking meter": "停车计费器",
    "bench": "长椅",
    "bird": "鸟",
    "cat": "猫",
    "dog": "狗",
    "horse": "马",
    "sheep": "羊",
    "cow": "牛",
    "elephant": "大象",
    "bear": "熊",
    "zebra": "斑马",
    "giraffe": "长颈鹿",
    "backpack": "背包",
    "umbrella": "雨伞",
    "handbag": "手提包",
    "tie": "领带",
    "suitcase": "行李箱",
    "frisbee": "飞盘",
    "skis": "滑雪板",
    "snowboard": "单板滑雪板",
    "sports ball": "运动球",
    "kite": "风筝",
    "baseball bat": "棒球棒",
    "baseball glove": "棒球手套",
    "skateboard": "滑板",
    "surfboard": "冲浪板",
    "tennis racket": "网球拍",
    "bottle": "瓶子",
    "wine glass": "酒杯",
    "cup": "杯子",
    "fork": "叉子",
    "knife": "刀",
    "spoon": "勺子",
    "bowl": "碗",
    "banana": "香蕉",
    "apple": "苹果",
    "sandwich": "三明治",
    "orange": "橙子",
    "broccoli": "西兰花",
    "carrot": "胡萝卜",
    "hot dog": "热狗",
    "pizza": "披萨",
    "donut": "甜甜圈",
    "cake": "蛋糕",
    "chair": "椅子",
    "couch": "沙发",
    "potted plant": "盆栽植物",
    "bed": "床",
    "dining table": "餐桌",
    "toilet": "马桶",
    "tv": "电视",
    "laptop": "笔记本电脑",
    "mouse": "鼠标",
    "remote": "遥控器",
    "keyboard": "键盘",
    "cell phone": "手机",
    "microwave": "微波炉",
    "oven": "烤箱",
    "toaster": "烤面包机",
    "sink": "水槽",
    "refrigerator": "冰箱",
    "book": "书",
    "clock": "时钟",
    "vase": "花瓶",
    "scissors": "剪刀",
    "teddy bear": "泰迪熊",
    "hair drier": "吹风机",
    "toothbrush": "牙刷",
    "unknown": "障碍物"
};

let yoloModel = null;
let featureModel = null;

async function loadModel() {
    const models = await tf.io.listModels();
    console.log('当前缓存的模型:', models);

    try {
        if (models['indexeddb://yolo11s_web_model']) {
            yoloModel = await tf.loadGraphModel('indexeddb://yolo11s_web_model');
            console.log("成功从缓存中加载yolo模型");
        } else {
            throw new Error('yolo模型在缓存中未找到');
        }
    } catch (error) {
        console.error('从缓存加载yolo模型失败:', error);
        yoloModel = await tf.loadGraphModel(yoloModelPath);
        console.log("成功从本地加载yolo模型");
        try {
            await yoloModel.save('indexeddb://yolo11s_web_model');
            console.log("成功将yolo模型保存到缓存");
        } catch (saveError) {
            console.error('保存yolo模型到缓存失败:', saveError);
        }
    }

    try {
        if (models['indexeddb://mobilenet-model']) {
            featureModel = await tf.loadGraphModel('indexeddb://mobilenet-model');
            console.log("成功从缓存中加载mobilenet模型");
        } else {
            throw new Error('mobilenet模型在缓存中未找到');
        }
    } catch (error) {
        console.error('从缓存加载mobilenet模型失败:', error);
        // featureModel = await tf.loadGraphModel(resnetModelPath);
        // 加载 MobileNet 模型
        if (typeof mobilenet === 'undefined') {
            console.log('正在加载 MobileNet 模型...');
            await new Promise(resolve => {
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet';
                script2.onload = resolve;
                document.head.appendChild(script2);
            });
        }
        const mobileNetModel = await mobilenet.load({
            version: 2,
            alpha: 1.0
        });
        featureModel = mobileNetModel.model;    // 获取内部的 tf.GraphModel
        console.log("成功从CDN加载mobilenet模型");
        try {
            await featureModel.save('indexeddb://mobilenet-model');
            console.log("成功将mobilenet模型保存到缓存");
        } catch (saveError) {
            console.error('保存mobilenet模型到缓存失败:', saveError);
        }
    }

    return [yoloModel, featureModel];
}

async function preprocessImage(img) {
    return tf.tidy(() =>
        tf.browser.fromPixels(img)
            .resizeBilinear([224, 224])
            .div(255.0)
            .expandDims()
    );
}

async function extractDeepFeatures(image) {
    let tensor = null;
    let features = null;
    try {
        tensor = await preprocessImage(image);
        features = await featureModel.predict(tensor);
        const featureArray = await features.data();

        console.log('特征提取成功，特征维度:', featureArray.length);
        return featureArray;
    } catch (error) {
        console.error('特征提取失败:', error);
        return null;
    } finally {
        if (tensor) tensor.dispose();
        if (features) features.dispose();
    }
}

async function extractMultiScaleFeatures(image) {
    const angles = [0, 90, 180, 270];
    const scales = [2];
    let allFeatures = [];

    try {
        for (const scale of scales) {
            for (const angle of angles) {
                const rotatedCanvas = document.createElement('canvas');
                const rotatedCtx = rotatedCanvas.getContext('2d');

                // 计算旋转后的尺寸
                const diagonal = Math.sqrt(image.width * image.width + image.height * image.height);
                rotatedCanvas.width = diagonal;
                rotatedCanvas.height = diagonal;

                // 在canvas中心进行旋转
                rotatedCtx.translate(diagonal / 2, diagonal / 2);
                rotatedCtx.rotate(angle * Math.PI / 180);
                rotatedCtx.drawImage(
                    image,
                    -image.width / 2, -image.height / 2,
                    image.width, image.height
                );

                // 缩放处理
                let scaledCanvas;
                if (rotatedCanvas.width * rotatedCanvas.height < 30000) {
                    scaledCanvas = document.createElement('canvas');
                    const scaledCtx = scaledCanvas.getContext('2d');
                    scaledCanvas.width = Math.round(rotatedCanvas.width * scale);
                    scaledCanvas.height = Math.round(rotatedCanvas.height * scale);
                    scaledCtx.drawImage(
                        rotatedCanvas,
                        0, 0,
                        scaledCanvas.width, scaledCanvas.height
                    );
                } else {
                    scaledCanvas = rotatedCanvas;
                }

                const features = await extractDeepFeatures(scaledCanvas);
                if (features) {
                    allFeatures.push(features);
                }

                rotatedCanvas.width = 1;
                rotatedCanvas.height = 1;
                scaledCanvas.width = 1;
                scaledCanvas.height = 1;
            }
        }

        if (allFeatures.length === 0) {
            console.error('特征提取失败');
            return null;
        }

        // 融合所有特征
        const combinedFeatures = new Array(allFeatures[0].length).fill(0);
        for (let i = 0; i < combinedFeatures.length; i++) {
            combinedFeatures[i] = Math.max(...allFeatures.map(f => f[i]));
        }

        return combinedFeatures;
    } catch (error) {
        console.error('特征提取错误:', error);
        return null;
    }
}

function computeSimilarity(feature1, feature2) {
    try {
        if (!feature1 || !feature2 || feature1.length !== feature2.length) {
            return 0;
        }

        // 曼哈顿距离
        let manhattanDistance = 0;
        for (let i = 0; i < feature1.length; i++) {
            manhattanDistance += Math.abs(feature1[i] - feature2[i]);
        }
        const manhattanSimilarity = 1 / (1 + manhattanDistance);

        // 欧氏距离
        let euclideanDistance = 0;
        for (let i = 0; i < feature1.length; i++) {
            euclideanDistance += Math.pow(feature1[i] - feature2[i], 2);
        }
        euclideanDistance = Math.sqrt(euclideanDistance);
        const euclideanSimilarity = 1 / (1 + euclideanDistance);

        // 余弦相似度
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        for (let i = 0; i < feature1.length; i++) {
            dotProduct += feature1[i] * feature2[i];
            magnitudeA += feature1[i] * feature1[i];
            magnitudeB += feature2[i] * feature2[i];
        }
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);

        console.log('相似度详情:', {
            曼哈顿相似度: manhattanSimilarity.toFixed(4),
            欧氏相似度: euclideanSimilarity.toFixed(4),
            余弦相似度: cosineSimilarity.toFixed(4)
        });

        return manhattanSimilarity + euclideanSimilarity + cosineSimilarity;
    } catch (error) {
        console.error('计算相似度时出错:', error);
        return 0;
    }
}

class YoloDetector {
    constructor() {
        this.initialized = false;
        this.inputShape = null;
        this.templateFeature = [];
        this.templateClass = null;
        // this.init();  // 在类外部再显示初始化，便于进程统一
        this.minSimilarityThreshold = 0.37;
        this.maxSimilarityThreshold = 0.47;
        this.categoryGroups = {
            '餐具': ['fork', 'knife', 'spoon', 'bowl', 'cup', 'wine glass', 'bottle'],
            '电子设备': ['tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone'],
            '家具': ['chair', 'couch', 'bed', 'dining table', 'bench'],
            '厨房电器': ['microwave', 'oven', 'toaster', 'refrigerator', 'sink'],
            '食物': ['banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake'],
            '交通工具': ['bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat'],
            '动物': ['bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'],
            '运动器材': ['frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket']
        };
    }

    async init() {
        try {
            [yoloModel, featureModel] = await loadModel();
            this.inputShape = yoloModel.inputs[0].shape;
            this.initialized = this.inputShape != null;
            console.log("模型初始化完成");
        } catch (error) {
            console.error("模型初始化失败:", error);
            this.initialized = false;
        }
    }

    async getTemplate(template) {
        if (!this.initialized) {
            console.error('模型未初始化');
            [yoloModel, featureModel] = await loadModel();
            console.log("模型加载成功");
            this.inputShape = yoloModel.inputs[0].shape;
            this.initialized = this.inputShape != null;
        }

        this.templateFeature = [];
        this.templateClass = null;

        const detections = await this.generalDetect(template);
        if (detections.length === 0) {
            console.error('模板特征提取失败');
            return -1;
        }

        let maxPixelDetection = null;
        let maxPixelCount = 0;
        for (let detection of detections) {
            if (['person', 'tv', 'laptop', 'bench', 'chair', 'couch', 'bed',
                'dining table', 'refrigerator', 'toilet', 'book', 'sink', 'microwave', 'oven',
                'potted plant', 'traffic light', 'stop sign', 'parking meter'].includes(detection.class)) {
                continue;
            }

            const pixelCount = detection.bbox.width * detection.bbox.height;
            if (pixelCount > maxPixelCount) {
                maxPixelCount = pixelCount;
                maxPixelDetection = detection;
            }
        }

        if (maxPixelDetection) {
            const { x, y, width, height } = maxPixelDetection.bbox;
            const roiCanvas = document.createElement('canvas');
            const roiCtx = roiCanvas.getContext('2d');
            roiCanvas.width = width;
            roiCanvas.height = height;
            roiCtx.drawImage(template, x, y, width, height, 0, 0, width, height);

            const features = await extractMultiScaleFeatures(roiCanvas);
            if (features == null) {
                console.error('模板特征提取失败');
                return -1;
            }

            this.templateClass = maxPixelDetection.class;
            console.log('模板类别:', this.templateClass);
            this.templateFeature.push(features);
        }

        if (this.templateFeature.length == 0) {
            console.error('模板特征提取失败');
            return -1;
        }

        return 0;
    }

    calculateAdaptiveThreshold(objectSize) {
        const minSize = 0.01;
        const maxSize = 0.2;

        const sizeRatio = Math.min(Math.max((objectSize - minSize) / (maxSize - minSize), 0), 1);
        const nonLinearRatio = Math.pow(sizeRatio, 0.3);

        const threshold = this.minSimilarityThreshold +
            (this.maxSimilarityThreshold - this.minSimilarityThreshold) * nonLinearRatio;

        console.log('阈值计算:', {
            非线性比例: nonLinearRatio.toFixed(4),
            最终阈值: threshold.toFixed(4)
        });

        return threshold;
    }

    getCategory(className) {
        for (const [category, items] of Object.entries(this.categoryGroups)) {
            if (items.includes(className)) {
                return category;
            }
        }
        return className; // 如果没有找到对应的类别组，返回原始类别
    }

    async detect(image, options = {}) {
        if (!this.initialized) {
            console.error('模型未初始化');
            [yoloModel, featureModel] = await loadModel();
            console.log("模型加载成功");
            this.inputShape = yoloModel.inputs[0].shape;
            this.initialized = this.inputShape != null;
        }

        try {
            const detections = await this.generalDetect(image, options);
            if (detections.length == 0) {
                console.log('未检测到目标');
                return [];
            }

            let results = [];
            const templateCategory = this.getCategory(this.templateClass);

            for (let detection of detections) {
                const detectionCategory = this.getCategory(detection.class);
                if (detectionCategory !== templateCategory) {
                    console.log(`跳过不匹配的类别组: ${detectionCategory}, 期望类别组: ${templateCategory}`);
                    continue;
                }

                const { x, y, width, height } = detection.bbox;
                const roiCanvas = document.createElement('canvas');
                const roiCtx = roiCanvas.getContext('2d');
                roiCanvas.width = width;
                roiCanvas.height = height;
                roiCtx.drawImage(image, x, y, width, height, 0, 0, width, height);

                const features = await extractMultiScaleFeatures(roiCanvas);

                roiCanvas.width = 1;
                roiCanvas.height = 1;

                if (!features) continue;

                let maxSimilarity = 0;
                for (let templateFeature of this.templateFeature) {
                    const similarity = computeSimilarity(templateFeature, features);
                    maxSimilarity = Math.max(maxSimilarity, similarity);
                }

                const objectSize = (width * height) / (image.width * image.height);
                const adaptiveThreshold = this.calculateAdaptiveThreshold(objectSize);

                if (maxSimilarity > adaptiveThreshold) {
                    results.push({
                        x, y, width, height,
                        similarity: maxSimilarity,
                        threshold: adaptiveThreshold,
                        class: detection.class
                    });
                }
            }

            if (results.length == 0) {
                console.log(`未找到匹配的${this.templateClass}目标`);
                return [];
            }

            // 选择最佳匹配结果
            const bestResult = results.reduce((best, current) => {
                const bestScore = best.similarity;
                const currentScore = current.similarity;
                // const bestScore = best.similarity / best.threshold;
                // const currentScore = current.similarity / current.threshold;                
                return currentScore > bestScore ? current : best;
            }, results[0]);

            const x_center = (bestResult.x + bestResult.width / 2) / image.width;
            const y_center = (bestResult.y + bestResult.height / 2) / image.height;

            console.log('检测结果:', {
                left: x_center,
                top: y_center,
                width: bestResult.width / image.width,
                height: bestResult.height / image.height,
                similarity: bestResult.similarity,
                threshold: bestResult.threshold,
                class: bestResult.class
            });

            return [{
                left: x_center,
                top: y_center,
                width: bestResult.width / image.width,
                height: bestResult.height / image.height,
                class: bestResult.class
            }];

        } catch (error) {
            console.error('检测过程发生错误:', error);
            return [];
        }
    }

    async detect_obs(image, options = {}) {
        if (!this.initialized) {
            console.error('模型未初始化');
            [yoloModel, featureModel] = await loadModel();
            console.log("模型加载成功");
            this.inputShape = yoloModel.inputs[0].shape;
            this.initialized = this.inputShape != null;
        }

        let distanceDic = {}; // 用于比较，获取最近障碍物标签以及距离
        let distanceDicAll = {}; // 存储所有障碍物位置信息
        try {
            const detections = await this.generalDetect(image, options);
            if (detections.length == 0) {
                console.log('未检测到目标');
                return [];
            }
            let i = 0;
            for (let detection of detections) {
                i = i + 1;
                const { x, y, width, height } = detection.bbox;
                let label_0 = detection.class
                const score = detection.score;
                if (score <= 0.8) {
                    label_0 = "unknown";
                }
                const roiCanvas = document.createElement('canvas');
                const roiCtx = roiCanvas.getContext('2d');
                roiCanvas.width = width;
                roiCanvas.height = height;
                roiCtx.drawImage(image, x, y, width, height, 0, 0, width, height);
                roiCanvas.width = 1;
                roiCanvas.height = 1;

                const label_1 = label_0 + i;
                const y2 = y + height;
                const distanceReal = -8.42969910e-12 * Math.pow(y2, 4) + 2.48549357e-09 * Math.pow(y2, 3) + 1.12279819e-05 * Math.pow(y2, 2) - 1.14428737e-02 * y2 + 3.65615061e+00;
                // const distanceReal = 6.88448838e-13 * Math.pow(y2, 4) - 2.27144172e-09 * Math.pow(y2, 3) + 3.19109921e-06 * Math.pow(y2, 2) - 3.16104347e-03 * y2 + 2.06059217e+00;
                // const distanceReal = -1.94372972e-10 * Math.pow(y2, 4) + 3.64277250e-07 * Math.pow(y2, 3) - 2.44495517e-04 * Math.pow(y2, 2) + 6.62975001e-02 * y2 - 4.91398633e+00;
                const x_centor = x + width / 2;
                const y_centor = y + height / 2;
                // const left = x_centor / image.width;
                // const top = y_centor / image.height;
                const left = x_centor / 640.0;
                const top = y_centor / 640.0;
                distanceDic[label_1] = distanceReal;
                distanceDicAll[label_1] = [labelen_ch[label_0], distanceReal, left, top, y2]
            }
            let labelMin, distanceMin;
            for (const [key, value] of Object.entries(distanceDic)) {
                if (distanceMin === undefined || value < distanceMin) {
                    labelMin = key;
                    distanceMin = value;
                }
            }

            console.log('检测结果:', {
                class: distanceDicAll[labelMin][0],
                distance: distanceDicAll[labelMin][1],
                left: distanceDicAll[labelMin][2],
                top: distanceDicAll[labelMin][3],
                y2: distanceDicAll[labelMin][4],
            });

            return [{
                class: distanceDicAll[labelMin][0],
                distance: distanceDicAll[labelMin][1],
                left: distanceDicAll[labelMin][2],
                top: distanceDicAll[labelMin][3]
            }]
        } catch (error) {
            console.error('检测过程发生错误:', error);
            return [];
        }
    }

    yoloPreprocess(image) {
        if (!image) { throw new Error('输入图像不能为空'); }

        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(image);
            const [h, w] = tensor.shape.slice(0, 2);
            const maxSize = Math.max(w, h);
            const padding = [[0, maxSize - h], [0, maxSize - w], [0, 0]];
            const paddedTensor = tensor.pad(padding);

            const normalizedTensor = tf.image
                .resizeBilinear(paddedTensor, [this.inputShape[1], this.inputShape[2]])
                .div(255.0)
                .expandDims(0);

            return {
                tensor: normalizedTensor,
                scale: {
                    x: this.inputShape[1] / maxSize,
                    y: this.inputShape[2] / maxSize,
                    originalWidth: w,
                    originalHeight: h
                }
            };
        });
    }

    async generalDetect(image, options = {}) {
        if (!this.initialized) { throw new Error("请先调用initialize()初始化模型"); }

        const defaults = {
            scoreThreshold: 0.35,
            iouThreshold: 0.45,
            maxDetections: 20
        };
        const config = { ...defaults, ...options };

        let tensors = [];
        try {
            const { tensor: inputTensor, scale } = this.yoloPreprocess(image);
            tensors.push(inputTensor);

            const result = await yoloModel.execute(inputTensor);
            const outputs = Array.isArray(result) ? result : [result];
            tensors.push(...outputs);

            const boxesOutput = outputs[0];
            const masksOutput = outputs.length > 1 ? outputs[1] : null;

            const transposedBoxes = boxesOutput.transpose([0, 2, 1]);
            tensors.push(transposedBoxes);

            // 使用tf.tidy处理同步操作
            const [boxes, scores, classes] = tf.tidy(() => {
                const w = transposedBoxes.slice([0, 0, 2], [-1, -1, 1]);
                const h = transposedBoxes.slice([0, 0, 3], [-1, -1, 1]);
                const x1 = tf.sub(transposedBoxes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
                const y1 = tf.sub(transposedBoxes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
                const boxes = tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze();

                const scoresStart = 4;
                const rawScores = transposedBoxes.slice([0, 0, scoresStart], [-1, -1, labels.length]).squeeze();
                return [boxes, rawScores.max(1), rawScores.argMax(1)];
            });
            tensors.push(boxes, scores, classes);

            // 执行NMS
            const selectedIndices = await tf.image.nonMaxSuppressionAsync(
                boxes, scores, config.maxDetections, config.iouThreshold, config.scoreThreshold
            );

            // 收集结果
            const boxesData = boxes.gather(selectedIndices).dataSync();
            const scoresData = scores.gather(selectedIndices).dataSync();
            const classesData = classes.gather(selectedIndices).dataSync();
            const masksData = masksOutput ? masksOutput.gather(selectedIndices).dataSync() : null;

            const validDetections = [];
            for (let i = 0; i < scoresData.length; i++) {
                if (isNaN(scoresData[i]) || scoresData[i] < config.scoreThreshold) continue;

                // 将检测框坐标转换回原图尺寸
                const [y1, x1, y2, x2] = boxesData.slice(i * 4, (i + 1) * 4);
                const originalX1 = (x1 / scale.x);
                const originalY1 = (y1 / scale.y);
                const originalX2 = (x2 / scale.x);
                const originalY2 = (y2 / scale.y);

                if (originalX1 >= originalX2 || originalY1 >= originalY2) continue;

                // 提取对应的掩码数据
                let mask = null;
                if (masksData) {
                    const maskWidth = Math.round(originalX2 - originalX1);
                    const maskHeight = Math.round(originalY2 - originalY1);
                    try {
                        mask = new Float32Array(masksData.slice(
                            i * maskWidth * maskHeight,
                            (i + 1) * maskWidth * maskHeight
                        ));
                    } catch (error) {
                        console.warn('掩码数据提取失败:', error);
                        mask = null;
                    }
                }

                validDetections.push({
                    bbox: {
                        x: originalX1,
                        y: originalY1,
                        width: originalX2 - originalX1,
                        height: originalY2 - originalY1
                    },
                    class: labels[classesData[i]],
                    score: scoresData[i],
                    mask: mask
                });
            }

            tensors.forEach(t => t && t.dispose());

            if (!validDetections.length) {
                console.log('没有检测到任何目标');
            } else {
                console.log(`检测到 ${validDetections.length} 个目标`);
            }

            return validDetections;
        } catch (error) {
            console.error('检测过程中发生错误:', error);
            return [];
        }
    }

    release() {
        this.templateFeature = [];
        this.templateClass = null;
    }
}

// 将YoloDetector添加到window对象，使其成为全局可访问
window.YoloDetector = YoloDetector;
