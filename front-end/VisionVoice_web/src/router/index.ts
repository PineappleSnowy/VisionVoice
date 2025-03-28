import {createRouter, createWebHistory} from 'vue-router'
import UserChat from '@/views/user/UserChat.vue'
import UserLogin from '@/views/user/UserLogin.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import UserAgent from '@/views/user/UserAgent.vue'
import UserAlbum from '@/views/user/UserAlbum.vue'
import UserSkills from '@/views/user/UserSkills.vue'
import UserMine from '@/views/user/UserMine.vue'
import FullScreenLayout from '@/layouts/FullScreenLayout.vue'
import UserAgreement from '@/views/user/userMine/UserAgreement.vue'

const router = createRouter({
  history:createWebHistory(),
  routes:[
    {
      path:'/',
      component:DefaultLayout,
      redirect:'/agent',
      children:[
        {
          path:'agent',
          component:UserAgent,
          meta:{
            title:'智能体名称'
          },
        },
        {
          path:'chat',
          component:UserChat,
          meta:{
            title:'消息'
          },
        },
        {
          path:'album',
          component:UserAlbum,
          meta:{
            title:'有声相册'
          },
        },
        {
          path:'skills',
          component:UserSkills,
          meta:{
            title:'能力'
          },
        },
        {
          path:'mine',
          component:UserMine,
          meta:{
            title:'关于'
          },
        },
      ],
    },
    {
      path:'/mine/agreement',
      component:FullScreenLayout,
      children:[
        {
          path:'',
          component:UserAgreement
        },
      ],
    },
    {
      path:'/mine/contact',
      component:FullScreenLayout,
      children:[
        {
          path:'',
          component:UserAgreement
        },
      ],
    },
    {
      path:'/login',
      component:UserLogin
    },
    

  ]

})

export default router