import { createRouter, createWebHistory } from 'vue-router'
import UserChat from '@/views/user/UserChat.vue'
import UserLogin from '@/views/user/UserLogin.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import UserAgent from '@/views/user/UserAgent.vue'
import UserAlbum from '@/views/user/UserAlbum.vue'
import UserSkills from '@/views/user/UserSkills.vue'
import UserMine from '@/views/user/UserMine.vue'
import UserAgreement from '@/views/user/userMine/UserAgreement.vue'
import UserSettings from '@/views/user/userMine/UserSettings.vue'
import UserContact from '@/views/user/userMine/UserContact.vue'
import UserPhotoManage from '@/views/user/userMine/UserPhotoManage.vue'
import UserPhotoChat from '@/views/user/userAlbum/UserPhotoChat.vue'
import UserPhone from '@/views/user/UserPhone.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      redirect: '/agent',
      children: [
        {
          path: 'agent',
          component: UserAgent,
          meta: {
            title: '智能体名称',
          },
        },
        {
          path: 'chat',
          component: UserChat,
          meta: {
            title: '消息',
          },
        },
        {
          path: 'album',
          component: UserAlbum,
          meta: {
            title: '有声相册',
          },
        },
        {
          path: 'album/photoChat',
          component: UserPhotoChat,
          meta: {
            title: '照片问答',
          },
        },
        {
          path: 'skills',
          component: UserSkills,
          meta: {
            title: '能力',
          },
        },
        {
          path: 'mine',
          component: UserMine,
          meta: {
            title: '关于',
          },
        },
      ],
    },
    {
      path: '/mine/agreement',
      component: UserAgreement,
      meta: {
        title: '用户须知',
      },
    },
    {
      path: '/mine/contact',
      component: UserContact,
      meta: {
        title: '联系我们',
      },
    },
    {
      path: '/mine/settings',
      component: UserSettings,
      meta: {
        title: '用户设置',
      },
    },
    {
      path: '/mine/photoManage',
      component: UserPhotoManage,
      meta: {
        title: '寻物画廊',
      },
    },
    {
      path: '/login',
      component: UserLogin,
      meta: {
        title: '登录',
      },
    },
    {
      path: '/phone',
      component: UserPhone,
      meta: {
        title: '与智能体通话',
      },
    },
  ],
})


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  // 如果目标路由不是登录页且没有 token
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
