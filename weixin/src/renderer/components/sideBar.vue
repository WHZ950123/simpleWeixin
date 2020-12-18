<template>
  <div class="sideContext">
    <el-popover
      placement="bottom"
      title=""
      width="150"
      trigger="click">
      <p>用户名: {{loginUser}}</p>
      <el-button size="mini" type="primary" @click="logout">退出登录</el-button>
      <img id="logo" slot="reference" src="~@/assets/user.jpg" alt="用户头像">
    </el-popover>
    <div class="centerCont">
      <el-button icon="el-icon-chat-dot-round" circle class="btn" :class="{btnFocus: activeBtnIndex === 1}" @click="changeView(1)"></el-button>
      <el-button icon="el-icon-user" circle class="btn" :class="{btnFocus: activeBtnIndex === 2}" @click="changeView(2)"></el-button>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Bus from './bus.js'
  const { ipcRenderer } = require('electron')

  export default {
    name: 'sideBar-page',
    components: {  },
    computed: {
      ...mapState('User', {
        loginUser: state => state.loginUser
      })
    },
    data () {
      return {
        activeBtnIndex: 1 //哪个按钮激活1-聊天,2-好友
      }
    },
    methods: {
      //点击"退出登录按钮"
      logout () {
        this.$emit('logout')
      },
      //点击左侧栏的按钮
      changeView (num) {
        this.activeBtnIndex = num
        this.$emit('changeView', num)
      }
    },
    mounted () {
      this.changeView(1)
      Bus.$on('clickChatWithTA', (data) => {
        this.changeView(1)
      })
    }
  }
</script>

<style scoped>
  #logo {
    height: 47px;
    margin: 5px;
    width: 47px;
  }
  .centerCont {
    /* background: blanchedalmond; */
    width: 100%;
    height: 114px;
    position: absolute;
    top: 57px;
    left: 0px;
  }
  .btn {
    margin: 10px 5px 5px;
    background: #2B292A;
    border: none;
    font-size: 20px;
  }
  .btn:hover, .btnFocus {
    color: #07C160;
  }
</style>
