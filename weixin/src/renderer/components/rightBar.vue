<template>
  <div>
    <!-- 展示聊天信息 -->
    <div v-if="showWhich === 1" class="chatClass">
      <div class="sideContext" id="container">
        <!-- 展示聊天信息 -->
        <div class="chatClassDetail" v-for="(chat, index) in chatContent" :key="index">
          <!-- 如果是好友的消息,则放在左边显示 -->
          <template v-if="chat.name !== loginUser">
            <div class="box">
              <!-- 好友头像 -->
              <img id="logo" src="~@/assets/user.jpg" alt="用户头像">
              <div class="contentClass">
                <!-- 好友名字 -->
                <span class="title">{{chat.name + ' ' + dateFormatter(chat.time)}}</span>
                <br>
                <!-- 好友发送的消息 -->
                <span class="content">{{chat.content}}</span>
              </div>
            </div>
          </template>
          <!-- 如果是自己发送的消息,则放在右边显示 -->
          <template v-else>
            <div class="rightFloat">
              <!-- 自己头像 -->
              <img id="logoMe" src="~@/assets/user.jpg" alt="用户头像">
              <div class="contentClassMe">
                <!-- 自己名字 -->
                <span class="titleMe">{{chat.name + ' ' + dateFormatter(chat.time)}}</span>
                <br>
                <!-- 自己发送的消息 -->
                <span class="contentMe">{{chat.content}}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="bottomClass">
        <!-- 聊天信息输入框 -->
        <el-input
          class="sendContentClass"
          type="textarea"
          v-model="chatSend"
          maxlength="100">
        </el-input>
        <!-- 发送聊天信息按钮 -->
        <el-button class="sendButton" :disabled="sendDisabled" type="primary" @click="sengMessage">发送</el-button>
      </div>
    </div>
    <!-- 展示好友信息 -->
    <div v-else-if="showWhich === 2" class="friendsCalss">
      <div class="detailFire" v-if="friendDeatil.name">
        <!-- 好友名字 -->
        <span class="nameClass">{{friendDeatil.name}}</span>
        <!-- 好友头像 -->
        <div class="img">
          <img id="logoFri" src="~@/assets/user.jpg" alt="用户头像">
        </div>
        <!-- 与TA聊天按钮 -->
        <div class="btnClass">
          <el-button type="primary" v-if="friendType === 'old'" @click="chatWithTA">与TA聊天</el-button>
          <el-button type="primary" v-else-if="friendType === 'new'" @click="addFriend">添加</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Bus from './bus.js'
  import dayjs from 'dayjs' //日期格式化
  import $ from 'jquery'
  const { ipcRenderer } = require('electron')

  export default {
    name: 'rightBar-page',
    components: {  },
    computed: {
      ...mapState('User', {
        loginUser: state => state.loginUser
      })
    },
    data () {
      return {
        showWhich: 1, //1-聊天,2-好友
        chatContent: [], //聊天记录
        chatFriendName: '', //现在显示的与谁的聊天记录
        friendDeatil: {}, //好友详情信息
        chatSend: '', //要发送的聊天信息
        sendDisabled: true, //发送消息按钮是否禁用
        chatIndex: '',
        friendType: 'old' //查看的好友类型(新好友'-new'/列表里好友-'old')
      }
    },
    methods: {
      //点击'添加'按钮进行添加新的好友
      async addFriend () {
        try {
          let friendData = {
            name: this.loginUser,
            addWho: this.friendDeatil.name
          }
          //添加新的好友请求
          const url = "http://127.0.0.1:8888/addFriend"
          let response = await this.$http.post(url, friendData)
          if (response && response.data.message === 'success') {
            this.$emit('refreshFriendsList')
          }
        } catch (e) {
          console.log(e)
          this.$message.error(e)
          return false
        }
      },
      //点击'与TA聊天'按钮
      chatWithTA () {
        Bus.$emit('clickChatWithTA')
        Bus.$emit('chatWithTA', this.friendDeatil.name)
      },
      //发送消息
      sengMessage () {
        if (this.chatSend && this.chatSend.length > 0) {
          this.$emit('sendMes', this.chatFriendName, this.chatSend, this.chatIndex)
          this.chatSend = ''
        }
      },
      //时间格式化
      dateFormatter (dateObj) {
        return !dateObj ? '' : dayjs(dateObj)
          .format('YYYY-MM-DD HH:mm:ss')
      },
      //显示最新聊天信息
      changeScroll () {
        if ($("#container") && $("#container")[0]) {
          $("#container").scrollTop($("#container")[0].scrollHeight + 10)
        }
      }
    },
    mounted () {
      Bus.$on('showChat', (data) => {
        this.chatContent = data.content
        this.chatIndex = data.index
        this.chatFriendName = data.chatWithWho
        this.sendDisabled = false
        setTimeout(() => {
          this.changeScroll()
        }, 100)
      }),
      Bus.$on('showFriend', (type, data) => {
        this.friendDeatil = data
        this.friendType = type
      })
    }
  }
</script>

<style scoped>
.chatClass {
  width: 100%;
}
.sideContext {
  overflow-x: hidden;
  overflow-y: scroll;
  background: #F5F5F5;
  position: absolute;
  top: 0px;
  bottom: 100px;
  left: 0px;
  width: 100%;
}
#logo {
  height: 34px;
  margin: 10px;
  width: 34px;
  float: left;
}
#logoMe {
  height: 34px;
  margin: 10px;
  width: 34px;
  float: right;
}
.contentClass {
  float: left;
  width: 300px;
  margin: auto 0px;
  word-break: break-all; 
	word-wrap: break-word;
}
.contentClassMe {
  float: right;
  text-align: right;
  margin: 5px 0px;
  width: 300px;
  word-break: break-all; 
	word-wrap: break-word;
}
.chatClassDetail {
  width: 100%;
  min-height: 54px;
  display: flex;
  margin: 5px 0;
}
.box {
  width: 100%;
  margin: 5px 0;
}
.rightFloat {
  float: right;
  width: 100%;
  margin: 5px 0;
}
.title {
  font-size: 14px;
  color: #B2B2B2;
}
.titleMe {
  font-size: 14px;
  color: #B2B2B2;
  float: right;
}
.content {
  margin: 3px 0;
  min-width: 10px;
  float: left;
  padding: 5px;
  font-size: 14px;
  color: black;
  display: block;
  line-height: 23px;
  border: #EDEDED 1px solid;
  background-color: #FFFFFF;
}
.contentMe {
  float: right;
  min-width: 10px;
  padding: 5px;
  font-size: 14px;
  color: black;
  display: block;
  line-height: 23px;
  border: #EDEDED 1px solid;
  background-color: #FFFFFF;
}
.bottomClass {
  overflow-x: hidden;
  overflow-y: hidden;
  background-color: #FFFFFF;
  position: absolute;
  top: 421px;
  bottom: 0px;
  left: 0px;
  width: 100%;
}
.sendContentClass {
  margin: 7px;
  width: 525px;
}
.friendsCalss {
  width: 100%;
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
}
.detailFire {
  margin: 50px auto;
  width: 400px;
  height: 300px;
  display: flex;
}
.nameClass {
  width: 250px;
  margin: auto 10px;
}
.img {
  float: right;
  margin: 88px 10px;
}
#logoFri {
  height: 124px;
  width: 124px;
}
.btnClass {
  position: absolute;
  bottom: 100px;
  left: 210px;
}
.sendButton {
  width: 45px;
  height: 26px;
  padding: 3px;
  border-radius: 2px;
  float: right;
  margin-right: 10px;
}
</style>
