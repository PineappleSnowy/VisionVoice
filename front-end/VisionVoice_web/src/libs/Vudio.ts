/**
 * This module is modified by StarsAC, adding an option to set radius of the wave shape.
 * November 10th, 2024.
 * 
 * This module is modified by StarsAC, fitting ES6 and TypeScript.
 * April 3rd, 2025.
 * 
 * 
 * Web音频数据可视化模块
 * @author Margox
 * @version 0.0.1
 */

// 定义选项类型
interface WaveformOption {
  maxHeight: number;
  minHeight: number;
  spacing: number;
  color: string | string[];
  shadowBlur: number;
  shadowColor: string;
  fadeSide: boolean;
  horizontalAlign: 'center' | 'left' | 'right';
  verticalAlign: 'middle' | 'top' | 'bottom';
  prettify: boolean;
  radius: number;
}

interface LightingOption {
  maxHeight: number;
  lineWidth: number;
  color: string;
  shadowBlur: number;
  shadowColor: string;
  fadeSide: boolean;
  horizontalAlign: 'center' | 'left' | 'right';
  verticalAlign: 'middle' | 'top' | 'bottom';
}

interface VudioOption {
  effect: 'waveform' | 'lighting';
  accuracy: number;
  width: number;
  height: number;
  waveform: WaveformOption;
  lighting: LightingOption;
}

// 定义默认选项
const __default_option: VudioOption = {
  effect: 'waveform',
  accuracy: 128,
  width: 256,
  height: 100,
  waveform: {
    maxHeight: 80,
    minHeight: 1,
    spacing: 1,
    color: '#f00',
    shadowBlur: 0,
    shadowColor: '#f00',
    fadeSide: true,
    horizontalAlign: 'center',
    verticalAlign: 'middle',
    prettify: true,
    radius: 0
  },
  lighting: {
    maxHeight: 80,
    lineWidth: 0,
    color: '#f00',
    shadowBlur: 0,
    shadowColor: '#f00',
    fadeSide: true,
    horizontalAlign: 'center',
    verticalAlign: 'middle'
  }
};

// 合并选项的函数
function __mergeOption(...options: Partial<VudioOption>[]): VudioOption {
  let __result: any = {};

  options.forEach((argument:any) => {
    for (const __prop in argument) {
      if (Object.prototype.hasOwnProperty.call(argument, __prop)) {
        const __value = argument[__prop];
        if (typeof __value === 'object' && __value !== null) {
          __result[__prop] = __mergeOption(__result[__prop] as Partial<VudioOption>, __value);
        } else {
          __result[__prop] = __value;
        }
      }
    }
  });

  return __result as VudioOption;
}

// 定义 Vudio 类
class Vudio {
  audioSrc: HTMLAudioElement | MediaStream;
  canvasEle: HTMLCanvasElement;
  option: VudioOption;
  meta: { spr: number };
  stat: number;
  freqByteData: Uint8Array | null;
  analyser: AnalyserNode | any;
  context2d: CanvasRenderingContext2D | any;
  width: number | any;
  height: number | any;

  constructor(audioSource: HTMLAudioElement | MediaStream, canvasElement: HTMLCanvasElement, option?: Partial<VudioOption>) {
    if (!['[object HTMLAudioElement]', '[object MediaStream]'].includes(Object.prototype.toString.call(audioSource))) {
      throw new TypeError('Invalid Audio Source');
    }

    if (Object.prototype.toString.call(canvasElement) !== '[object HTMLCanvasElement]') {
      throw new TypeError('Invalid Canvas Element');
    }

    this.audioSrc = audioSource;
    this.canvasEle = canvasElement;
    this.option = __mergeOption(__default_option, option || {});
    this.meta = {} as { spr: number };
    this.stat = 0;
    this.freqByteData = null;
    this.__init();
  }

  private __init() {
    const audioContext = new (window.AudioContext)();
    const source = this.audioSrc instanceof MediaStream
      ? audioContext.createMediaStreamSource(this.audioSrc)
      : audioContext.createMediaElementSource(this.audioSrc);
    const dpr = window.devicePixelRatio || 1;

    this.analyser = audioContext.createAnalyser();
    this.meta.spr = audioContext.sampleRate;

    source.connect(this.analyser);
    this.analyser.fftSize = this.option.accuracy * 2;
    // this.analyser.connect(audioContext.destination);// 此行代码控制是否实时播放录制的声音

    this.freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
    this.context2d = this.canvasEle.getContext('2d')!;
    this.width = this.option.width;
    this.height = this.option.height;

    // ready for HD screen
    this.context2d.canvas.width = this.width * dpr;
    this.context2d.canvas.height = this.height * dpr;
    this.context2d.scale(dpr, dpr);
  }

  private __rebuildData(freqByteData: Uint8Array, horizontalAlign: 'center' | 'left' | 'right') {
    let __freqByteData: number[];

    if (horizontalAlign === 'center') {
      __freqByteData = [
        ...Array.from(freqByteData).reverse().splice(this.option.accuracy / 2, this.option.accuracy / 2),
        ...Array.from(freqByteData).splice(0, this.option.accuracy / 2)
      ];
    } else if (horizontalAlign === 'left') {
      __freqByteData = Array.from(freqByteData);
    } else {
      __freqByteData = Array.from(freqByteData).reverse();
    }

    return __freqByteData;
  }

  private __animate() {
    if (this.stat === 1) {
      if (this.freqByteData) {
        this.analyser.getByteFrequencyData(this.freqByteData);
        const effectFunc = this.__effects()[this.option.effect];
        if (typeof effectFunc === 'function') {
          effectFunc(this.freqByteData);
        }
        requestAnimationFrame(this.__animate.bind(this));
      }
    }
  }

  private __testFrame() {
    if (this.freqByteData) {
      this.analyser.getByteFrequencyData(this.freqByteData);
      const effectFunc = this.__effects()[this.option.effect];
      if (typeof effectFunc === 'function') {
        effectFunc(this.freqByteData);
      }
    }
  }

  private __effects() {
    const __that = this;

    return {
      lighting: function (freqByteData: Uint8Array) {
        const __lightingOption = __that.option.lighting;
        const __freqByteData = __that.__rebuildData(freqByteData, __lightingOption.horizontalAlign);
        const __maxHeight = __lightingOption.maxHeight / 2;
        let __isStart = true;
        let __fadeSide = true;
        let __x: number;
        let __y: number;

        if (__lightingOption.horizontalAlign !== 'center') {
          __fadeSide = false;
        }

        // clear canvas
        __that.context2d.clearRect(0, 0, __that.width, __that.height);

        // draw lighting
        __that.context2d.lineWidth = __lightingOption.lineWidth;
        __that.context2d.strokeStyle = __lightingOption.color;
        __that.context2d.beginPath();
        __freqByteData.forEach((value, index) => {
          __x = (__that.width / __that.option.accuracy) * index;
          __y = (value / 256) * __maxHeight;

          if (__lightingOption.verticalAlign === 'middle') {
            __y = (__that.height - value) / 2 - __maxHeight / 2;
          } else if (__lightingOption.verticalAlign === 'bottom') {
            __y = __that.height - value;
          } else if (__lightingOption.verticalAlign === 'top') {
            __y = value;
          } else {
            __y = (__that.height - value) / 2 - __maxHeight / 2;
          }

          if (__isStart) {
            __that.context2d.moveTo(__x, __y);
            __isStart = false;
          } else {
            __that.context2d.lineTo(__x, __y);
          }
        });
        __that.context2d.stroke();
      },

      waveform: function (freqByteData: Uint8Array) {
        const __waveformOption = __that.option.waveform;
        let __fadeSide = __waveformOption.fadeSide;
        let __prettify = __waveformOption.prettify;
        const __freqByteData = __that.__rebuildData(freqByteData, __waveformOption.horizontalAlign);
        let __maxHeight: number;
        let __width: number;
        let __height: number;
        let __left: number;
        let __top: number;
        let __color: string | string[];
        let __linearGradient: CanvasGradient | null = null;
        let __pos: number;

        if (__waveformOption.horizontalAlign !== 'center') {
          __fadeSide = false;
          __prettify = false;
        }

        // clear canvas
        __that.context2d.clearRect(0, 0, __that.width, __that.height);

        // draw waveform
        __freqByteData.forEach((value, index) => {
          __width = (__that.width - __that.option.accuracy * __waveformOption.spacing) / __that.option.accuracy;
          __left = index * (__width + __waveformOption.spacing);
          if (__waveformOption.spacing !== 1) {
            __left += __waveformOption.spacing / 2;
          }

          if (__prettify) {
            if (index <= __that.option.accuracy / 2) {
              __maxHeight = (1 - (__that.option.accuracy / 2 - 1 - index) / (__that.option.accuracy / 2)) * __waveformOption.maxHeight;
            } else {
              __maxHeight = (1 - (index - __that.option.accuracy / 2) / (__that.option.accuracy / 2)) * __waveformOption.maxHeight;
            }
          } else {
            __maxHeight = __waveformOption.maxHeight;
          }

          __height = (value / 256) * __maxHeight;
          __height = __height < __waveformOption.minHeight ? __waveformOption.minHeight : __height;

          if (__waveformOption.verticalAlign === 'middle') {
            __top = (__that.height - __height) / 2;
          } else if (__waveformOption.verticalAlign === 'top') {
            __top = 0;
          } else if (__waveformOption.verticalAlign === 'bottom') {
            __top = __that.height - __height;
          } else {
            __top = (__that.height - __height) / 2;
          }

          __color = __waveformOption.color;

          if (Array.isArray(__color)) {
            __linearGradient = __that.context2d.createLinearGradient(
              __left,
              __top,
              __left,
              __top + __height
            );

            __color.forEach((color, index) => {
              if (Array.isArray(color)) {
                __pos = color[0];
                color = color[1];
              } else if (index === 0 || index === __color.length - 1) {
                __pos = index / (__color.length - 1);
              } else {
                __pos = index / __color.length + 0.5 / __color.length;
              }
              __linearGradient!.addColorStop(__pos, color);
            });

            __that.context2d.fillStyle = __linearGradient;
          } else {
            __that.context2d.fillStyle = __color;
          }

          if (__waveformOption.shadowBlur > 0) {
            __that.context2d.shadowBlur = __waveformOption.shadowBlur;
            __that.context2d.shadowColor = __waveformOption.shadowColor;
          }

          if (__fadeSide) {
            if (index <= __that.option.accuracy / 2) {
              __that.context2d.globalAlpha = 1 - (__that.option.accuracy / 2 - 1 - index) / (__that.option.accuracy / 2);
            } else {
              __that.context2d.globalAlpha = 1 - (index - __that.option.accuracy / 2) / (__that.option.accuracy / 2);
            }
          } else {
            __that.context2d.globalAlpha = 1;
          }

          // 使用 roundRect 方法绘制带有圆角的矩形
          __that.context2d.beginPath();
          __that.context2d.roundRect(__left, __top, __width, __height, __waveformOption.radius);
          __that.context2d.fill();
        });
      }
    };
  }

  // 开始
  dance() {
    if (this.stat === 0) {
      this.stat = 1;
      this.__animate();
    }
    return this;
  }

  // 暂停
  pause() {
    this.stat = 0;
    return this;
  }

  // 获取暂停状态
  paused() {
    return this.stat === 0;
  }

  // 改变参数
  setOption(option: Partial<VudioOption>) {
    this.option = __mergeOption(this.option, option);
  }
}

export { Vudio };
