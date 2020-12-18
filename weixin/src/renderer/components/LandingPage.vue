<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    <div class="left-side">
      <el-input v-model="username" placeholder="请输入用户名"></el-input>
      <div class="btnClass">
        <el-button class="loginBtn" type="primary" @click="forCode">扫码登录</el-button>
      </div>
      <img :class="{'imgCode': clickForCode}" :src="imgSrc"/>
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex'
  const { ipcRenderer } = require('electron')

  export default {
    name: 'landing-page',
    components: { },
    computed: {
      ...mapState('User', {
        loginUser: state => state.loginUser
      })
    },
    data () {
      return {
        imgSrc: '', //二维码图片src
        username: '', //用户名
        clickForCode: false //点击了"扫码登录"按钮
      }
    },
    mounted () {
      //进程间通讯,修改窗口大小
      ipcRenderer.send('login-window')
      //监听clearLoggedInfo退出登录事件
      ipcRenderer.on('clearLoggedInfo', (event, message) => {
        this.logoutFun()
      })
    },
    methods: {
      ...mapActions({
        'loginFun': 'User/loginFun',
        'logoutFun': 'User/logoutFun'
      }),
      open (link) {
        this.$electron.shell.openExternal(link)
      },
      //获取二维码
      async forCode () {
        if (!this.username) {
          this.$message({ message: '请先输入用户名', type: 'error' })
          return
        }
        try {
          this.clickForCode = true
          const url = "http://127.0.0.1:8888/code?username=" + this.username
          let response = await this.$http.get(url, {responseType: 'arraybuffer'})
          this.imgSrc = 'data:image/png;base64,' + btoa(new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.askForLogin()
        } catch (e) {
          console.log(e)
          this.$message.error(e)
          return false
        }
      },
      //定时发请求用于获取用户是否进行扫描二维码登录
      async askForLogin() {
        let timer = null
        try {
          timer = setInterval(async () => {
            const url = "http://127.0.0.1:8888/askForLogin?username=" + this.username
            let response = await this.$http.get(url)
            let data = response.data
            const message = data.message
            if (message === 'ok') {
              this.loginFun(this.username)
              clearInterval(timer)
              timer = null
              this.$router.push('/chat') //路由跳转chat
            }
          }, 1000)
        } catch (e) {
          console.log(e)
          if (timer) {
            clearInterval(timer)
            timer = null
          }
          this.$message.error(e)
          return false
        }
      }
    }
  }
</script>

<style scoped>
  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 100%
  }

  .left-side {
    margin: 0 auto;
    padding: 0 15px;
  }

  .loginBtn {
    margin: 10px auto;
  }

  .imgCode {
    display: block;
    width: 200px;
    height: 200px;
  }

  .btnClass {
    display: flex;
  }
</style>
