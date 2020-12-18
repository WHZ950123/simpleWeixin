const state = {
  loginUser: ''
}
  
const mutations = {
  login(state, loginName) {
    state.loginUser = loginName
  },
  logout (state) {
    state.loginUser = ''
  }
}

const actions = {
  loginFun(context, loginName) {
    context.commit('login', loginName)
  },
  logoutFun(context) {
    context.commit('logout')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
  