import Vue from 'vue'
import Vuex from 'vuex'

import { createPersistedState, createSharedMutations } from 'vuex-electron'

import modules from './modules'

Vue.use(Vuex)

export default new Vuex.Store({
  modules,
  plugins: [
    createPersistedState(),
    /*
    这是因为 vuex-electron 引入了一个用于多进程间共享 Vuex Store 的状态的插件。如果没有多进程交互的需求，完全可以不引入这个插件
    */
    //createSharedMutations() //如果使用vuex则要注释这行
  ],
  strict: process.env.NODE_ENV !== 'production'
})
