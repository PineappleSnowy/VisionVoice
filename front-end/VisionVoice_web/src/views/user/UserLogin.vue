<template>
  <div class="container">
    <!-- 登录容器 -->
    <div class="login" role="form" aria-label="登录表单" v-show="isLogin">

      <h2>欢迎登录</h2>
      <div class="switch">
        <span class="phone_login" :class="{ active: isPhoneLogin }" @click="isPhoneLogin = true">手机验证码登录</span>
        <span class="password_login" :class="{ active: !isPhoneLogin }" @click="isPhoneLogin = false">账号密码登录</span>
        <div class="slider" :class="{pwdLogin: !isPhoneLogin}"></div>
      </div>


      <div class="login-type-phone" v-show="isPhoneLogin">
        <div class="input-group">
          <label for="login_phone" aria-label="手机号">手机号:</label>
          <input type="text" placeholder="请输入手机号" id="login_phone" aria-label="请输入手机号" v-model="phoneNumber">
        </div>
        <div class="input-group code">
          <div>
            <label for="phone_code" aria-label="手机验证码">验证码:</label>
            <input type="text" placeholder="请输入手机验证码" id="phone_code" aria-label="请输入手机验证码">
          </div>
          <button class="getCode">获取验证码</button>
        </div>
      </div>

      <div class="login-type-password" v-show="!isPhoneLogin">
        <div class="input-group">
          <label for="username" aria-label="用户名">用户名:</label>
          <input type="text" placeholder="请输入用户名" aria-label="请输入用户名" v-model="username">
        </div>

        <div class="input-group password">
          <label for="password" aria-label="密码">密码:</label>
          <input type="password" placeholder="请输入密码" id="password" aria-label="请输入密码" v-model="password">
        </div>
      </div>


      <div class="message">{{ message }}</div>
      <button aria-label="登录" class="loginbutton">登录</button>
      <p class="register-link">还没有账号？<a @click="isLogin = false">点击注册</a></p>
    </div>

    <!-- 注册容器 -->
    <div class="register" role="form" aria-label="注册表单" v-show="!isLogin">
      <h2>用户注册</h2>
      <div class="input-group">
        <label for="register_username" aria-label="用户名">用户名:</label>
        <input type="text" placeholder="请输入用于登录的用户名" id="register_username" aria-label="请输入用于登录的用户名">
      </div>

      <div class="input-group">
        <label for="register_nickname" aria-label="昵称">昵称:</label>
        <input type="text" placeholder="请输入昵称" id="register_nickname" aria-label="请输入昵称">
      </div>

      <div class="input-group">
        <label for="register_phone" aria-label="手机号">手机号:</label>
        <input type="text" placeholder="请输入手机号" id="register_phone" aria-label="请输入手机号">
      </div>



      <div class="input-group">
        <label for="register_password" aria-label="密码">密码:</label>
        <input type="password" placeholder="请输入密码" id="register_password" aria-label="请输入密码">
      </div>

      <div class="input-group">
        <label for="register_confirm_password" aria-label="确认密码">确认密码:</label>
        <input type="password" placeholder="请再次输入密码" id="register_confirm_password" aria-label="请再次输入密码">
      </div>

      <div class="input-group" style="display: flex; gap: 10px; position: relative;">
        <div style="flex: 1;">
          <label for="register_code" aria-label="验证码">验证码:</label>
          <input type="text" placeholder="请输入验证码" id="register_code" aria-label="请输入验证码">
        </div>
        <button id="get_code_btn_register"
          style="position: absolute; right: 0; bottom: 0; width: 115px; height: 40px; background: #3eb575; color: white; border: none; border-radius: 5px; cursor: pointer;">获取验证码</button>
      </div>


      <div class="message">{{ message }}</div>
      <button class="register_button" aria-label="注册">注册</button>
      <p class="login-link">已有账号？<a @click="isLogin = true">返回登录</a></p>

    </div>


    <div class="bottom-text">
      <span>© 2024 VisionVoice. All Rights Reserved</span>
      <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank">闽ICP备2024055854号</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
let isLogin = ref(true)
let isPhoneLogin = ref(true)
let message = ref('')
let username = ref('')
let password = ref('')
let phoneNumber = ref('')
</script>

<style scoped lang="less">
* {
  box-sizing: border-box;
}
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #121212;
  
  .input-group {
    margin-bottom: 20px;

    &.code {
      position: relative;
    }
  }

  label {
    display: block;
    color: #fff;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: #3eb575;
    }
  }

  .message {
    text-align: center;
    margin-bottom: 10px;
    padding: 5px;
    border-radius: 4px;
  }

  .message.success {
    color: #297a4f;
  }

  .message.error {
    color: #f44336;
  }

  .login {
    background-color: #1e1e1e;
    padding: 1rem;
    border-radius: 10px;
    width: 80%;
    max-width: 400px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

    h2 {
      color: #fff;
      text-align: center;
      margin-bottom: 25px;
      margin-top: 0;
    }

    .switch {
      position: relative;
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 20px;
      border-radius: 5px;
      background: #f5f5f5;
      padding: 3px;

      span {
        flex: 1;
        text-align: center;
        padding: 8px 0;
        cursor: pointer;
        z-index: 1;
        transition: color 0.3s ease;
        -webkit-tap-highlight-color: transparent;
        color: #1e1e1e;

        &.active {
          color: #fff;
        }
      }

      .slider {
        position: absolute;
        left: 3px;
        top: 3px;
        width: calc(50% - 3px);
        height: calc(100% - 6px);
        background: #4CAF50;
        border-radius: 3px;
        transition: transform 0.3s ease;

        &.pwdLogin {
          transform: translateX(100%);
        }
      }
    }

    .loginbutton {
      width: 100%;
      padding: 12px;
      background-color: #3eb575;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 15px;

      &:hover {
        background-color: #297a4f;
      }
    }

    .getCode {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 115px;
      height: 40px;
      background: #3eb575;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-bottom: 0;
    }

    .register-link {
      display: flex;
      justify-content: center;
      color: #fff;
      margin: 0;
      font-size: 14px;

      a {
        color: #3eb575;
        justify-content: center;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .register {
    margin: 0 1rem;
    background-color: #1e1e1e;
    padding: 1rem;
    border-radius: 10px;
    width: 80%;
    max-width: 400px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

    h2 {
      color: #fff;
      text-align: center;
      margin-bottom: 25px;
      margin-top: 0;
    }

    .switch {
      position: relative;
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 20px;
      border-radius: 5px;
      background: #f5f5f5;
      padding: 3px;
    }

    .register_button {
      width: 100%;
      padding: 12px;
      background-color: #3eb575;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 15px;

      &:hover {
        background-color: #297a4f;
      }
    }

    .login-link {
      text-align: center;
      color: #fff;
      margin: 0;
      font-size: 14px;
    }

    .login-link a {
      color: #3eb575;
      text-decoration: none;
    }

    .login-link a:hover {
      text-decoration: underline;
    }


  }

  .bottom-text {
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-content: center;
    flex-wrap: wrap;
    width: 100vw;
    height: 60px;
    font-size: 14px;
    background-color: #333;

    span {
      display: flex;
      width: 100%;
      justify-content: center;
    }

    a {
      display: flex;
      color: #e0e0e0;
      text-decoration: none;
      /* 去掉链接的下划线 */
    }
  }
}

















/* ----- 注册容器样式 ----- */


/* 注册按钮样式 */




/* 返回登录链接样式 */


/* ----- 消息提示样式 start ----- */


/* ----- 消息提示样式 end ----- */
</style>