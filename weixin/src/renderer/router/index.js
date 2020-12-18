import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    {
      path: '/chat',
      name: 'chat-page',
      component: require('@/components/chat').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
