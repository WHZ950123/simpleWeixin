<template>
  <div class="mainClass">
    <!-- 左边栏 -->
    <sideBar
      class="sideClass"
      @logout="logout"
      @changeView="changeView"/>
    <centerBar
      class="centerClass"
      ref="centerBar"
      :new-friends-arr="newFriendsArr">
    </centerBar>
    <!-- 右边栏 -->
    <rightBar
      ref="rightBar"
      class="rightClass"
      @sendMes="sendMes"
      @refreshFriendsList="refreshFriendsList">
    </rightBar>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex'
  import sideBar from './sideBar'
  import centerBar from './centerBar'
  import rightBar from './rightBar'
  const { ipcRenderer } = require('electron')

  export default {
    name: 'chat-page',
    components: {
      sideBar,
      centerBar,
      rightBar
    },
    computed: {
      ...mapState('User', {
        loginUser: state => state.loginUser
      })
    },
    data () {
      return {
        path: 'ws:127.0.0.1:4000', //websocket连接地址
        socket: null, //websocket
        hasNewFriend: true,
        hasNewChat: true,
        chatArr: [], //聊天的信息
        friends: [], //好友信息
        chatIndex: '',
        newFriendsArr: [] //新好友列表
      }
    },
    methods: {
      ...mapActions({
        'logoutFun': 'User/logoutFun'
      }),
      //向websocket发送聊天信息
      async sendMes (name, message, chatIndex) {
        this.chatIndex = chatIndex
        const chatObj = {
          username: this.loginUser,
          chatWithWho: name,
          mes: 'chat', //标识
          content: message,
          time: new Date().getTime()
        }
        this.socket.send(JSON.stringify(chatObj))
        const url = "http://127.0.0.1:8888/addChats"
        let response = await this.$http.post(url, chatObj)
      },
      //退出登录
      logout () {
        this.closeLink()
        this.logoutFun()
        this.$router.push('/') //路由跳转登录页
      },
      //刷新好友列表
      refreshFriendsList () {
        this.hasNewFriend = true
        this.checkCenterBarShowWhich(2)
      },
      //点击左侧栏的按钮
      changeView (num) {
        this.$refs.centerBar.showWhich = num
        this.checkCenterBarShowWhich(num)
        this.$refs.rightBar.showWhich = num
        if (num === 1) { //聊天
          setTimeout(() => {
            this.$refs.rightBar.changeScroll()
          }, 100)
        }
      },
      async checkCenterBarShowWhich (newVal) {
        if (newVal === 1) { //1-聊天
          if (this.hasNewChat) {
            try {
              this.chatArr = []
              const url = "http://127.0.0.1:8888/getChatsList?username=" + this.loginUser
              let response = await this.$http.get(url)
              let chats = response.data && response.data.message || []
              chats.forEach(item => {
                this.chatArr.push({
                  index: item.id,
                  badgeValue: 0,
                  badgeHidden: true,
                  chatWithWho: item.user1 === this.loginUser ? item.user2 : item.user1,
                  lasContent: item.content[item.content.length - 1].content, //最后一条聊天记录
                  content: item.content
                })
              })
              this.$refs.centerBar.chatArr = this.chatArr
              if (this.chatArr.length > 0) {
                this.$refs.centerBar.showChat(this.chatArr[0].index)
              }
              this.hasNewChat = false
            } catch (e) {
              console.log(e)
              this.$message.error(e)
              this.hasNewChat = true
              return false
            }
          }
        } else if (newVal === 2) { //2-好友
          if (this.hasNewFriend) {
            try {
              this.friends = []
              //请求好友列表
              const url = "http://127.0.0.1:8888/getFriendsList?username=" + this.loginUser
              let response = await this.$http.get(url)
              this.friends = response.data && response.data.message && response.data.message.fri || []
              this.$refs.centerBar.friends = this.friends
              if (this.friends.length > 0) {
                this.$refs.centerBar.showFriend('old', this.friends[0].index)
              }
              //请求新好友列表
              const newFriendsUrl = "http://127.0.0.1:8888/getNewFriends?username=" + this.loginUser
              let newFriendsResponse = await this.$http.get(newFriendsUrl)
              this.newFriendsArr = newFriendsResponse.data && newFriendsResponse.data.message && newFriendsResponse.data.message.list || []
              this.hasNewFriend = false
            } catch (e) {
              console.log(e)
              this.$message.error(e)
              this.hasNewFriend = true
              return false
            }
          }
        }
      },
      // open (link) {
      //   this.$electron.shell.openExternal(link)
      // },
      init () {
        if (typeof(WebSocket) === 'undefined') {
          console.error('您的浏览器不支持socket')
        } else{
          // 实例化socket
          this.socket = new WebSocket(this.path)
          // 监听socket连接
          this.socket.onopen = this.open
          // 监听socket错误信息
          this.socket.onerror = this.error
          // 监听socket消息
          this.socket.onmessage = this.getMessage
        }
      },
      open () {
        console.log("socket连接成功")
        this.socket.send(JSON.stringify({
          username: this.loginUser,
          mes: 'link'
        }))
      },
      error () {
        console.log("连接错误")
      },
      getMessage (msg) {
        let data = JSON.parse(msg.data)
        console.log('服务端发来的消息:', data)
        const code = data.code
        const text = data.text
        const username = data.username
        const chatWithWho = data.chatWithWho
        const time = data.time
        if (code === 500) {
          this.$message.error(text)
          this.closeLink()
        } else {
          if (code === 200) { //连接成功
            console.log(`服务端消息：${text}`)
          } else if (code === 202) { //聊天消息
            if (this.loginUser === username) { //发送者
              let hasThisChat = false
              for (let i = 0; i < this.chatArr.length; i++) {
                if (this.chatArr[i].chatWithWho === chatWithWho) {
                  hasThisChat = true
                  this.chatArr[i].lasContent = text
                  this.chatArr[i].content.push({
                    "name": username,
                    "content": text,
                    "time": time
                  })
                }
              }
              if (!hasThisChat) {
                this.chatArr.push({
                  "index": this.chatIndex,
                  "chatWithWho": chatWithWho,
                  "lasContent": text,
                  "content": [
                    {
                      "name": username,
                      "content": text,
                      "time": time
                    }
                  ]
                })
              }
            } else if (this.loginUser === chatWithWho) { //接收者
              let obj = this.chatArr.find((item) => {
                return item.chatWithWho === username
              })
              if (obj) {
                obj.lasContent = text
                obj.badgeHidden = false
                obj.badgeValue = obj.badgeValue + 1
                obj.content.push({
                  "name": username,
                  "content": text,
                  "time": time
                })
              } else {
                this.chatArr.push({
                  "index": this.chatArr.length,
                  "badgeHidden": false,
                  "badgeValue": 1,
                  "chatWithWho": username,
                  "lasContent": text,
                  "content": [
                    {
                      "name": username,
                      "content": text,
                      "time": time
                    }
                  ]
                })
                this.$refs.centerBar.showChat(this.chatArr[0].index)
              }
              //进程间通讯,如果只有小图标则闪烁
              ipcRenderer.send('flashTray')
            }
            this.$refs.centerBar.chatArr = this.chatArr
            this.$refs.centerBar.checkActiveChat()
            setTimeout(() => {
              this.$refs.rightBar.changeScroll()
            }, 100)
          } else if (code === 204) { //重新获取好友列表
            this.refreshFriendsList()
          }
        }
      },
      close () {
        console.log("socket已经关闭")
      },
      closeLink () { //关闭连接
        /*
          readyState属性返回实例对象的当前状态，共有四种。
          CONNECTING：值为0，表示正在连接。
          OPEN：值为1，表示连接成功，可以通信了。
          CLOSING：值为2，表示连接正在关闭。
          CLOSED：值为3，表示连接已经关闭，或者打开连接失败。
        */
        if (this.socket && this.socket.readyState && this.socket.readyState !== 3) {
          this.socket.send(JSON.stringify({
            username: this.loginUser,
            mes: 'close'
          }))
          this.socket.close()
          console.log('关闭了连接')
        }
        console.log('socket:', this.socket)
      }
    },
    mounted () {
      //进程间通讯,修改窗口大小
      ipcRenderer.send('after-login-window')
      //连接websocket
      this.init()
    }
  }
</script>

<style scoped>
.sideClass {
  width: 57px;
  background-color: #2B292A;
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
}
.centerClass {
  overflow-x: hidden;
  overflow-y: scroll;
  width: 250px;
  background-color: #EEEAE8;
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 57px;
}
.rightClass {
  width: 540px;
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 305px;
}
</style>
