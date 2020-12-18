<template>
  <div>
    <!-- 聊天 -->
    <div v-if="showWhich === 1">
      <div
        class="chatClass"
        :class="{chatClassClick: chat.index === activeChatIndex}"
        v-for="(chat, index) in chatArr"
        :key="index"
        @click="showChat(chat.index)">
        <img id="logo" src="~@/assets/user.jpg" alt="用户头像">
        <div class="contentClass">
          <!-- 聊天好友名字 -->
          <span class="title">{{chat.chatWithWho}}</span>
          <br>
          <!-- 最后一条聊天记录 -->
          <span class="content">{{chat.lasContent}}</span>
        </div>
        <!-- 未读消息 -->
        <el-badge
          :value="chat.badgeValue"
          :max="99"
          class="badgeItem"
          :hidden="chat.badgeHidden">
        </el-badge>
      </div>
    </div>
    <!-- 好友 -->
    <div v-else-if="showWhich === 2">
      <div class="addfriendClass">
        <el-input
          v-model="newFriendName"
          placeholder="请输入新好友用户名"
          class="newFriendNameClass">
        </el-input>
        <el-button
          type="primary"
          icon="el-icon-circle-plus-outline"
          class="addFriendBtn"
          @click="addFri">
        </el-button>
      </div>
      <template v-if="newFriendsArr && newFriendsArr.length > 0">
        <span class="newFriendsClass">新的好友</span>
        <div
          class="friendClass"
          :class="{friendClassClick: newFri.index === activeFriIndex}"
          v-for="newFri in newFriendsArr"
          :key="newFri.index"
          @click="showFriend('new', newFri.index)">
          <img id="logo" src="~@/assets/user.jpg" alt="用户头像">
          <div class="contentClassFir">
            <!-- 好友名字 -->
            <span class="titleFir">{{newFri.name}}</span>
          </div>
        </div>
      </template>
      <span class="newFriendsClass">好友</span>
      <div
        class="friendClass"
        :class="{friendClassClick: fri.index === activeFriIndex}"
        v-for="(fri, index) in friends"
        :key="index"
        @click="showFriend('old', fri.index)">
        <img id="logo" src="~@/assets/user.jpg" alt="用户头像">
        <div class="contentClassFir">
          <!-- 好友名字 -->
          <span class="titleFir">{{fri.name}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex'
  import Bus from './bus.js'
  const { ipcRenderer } = require('electron')

  export default {
    name: 'centerBar-page',
    components: {  },
    computed: {
      ...mapState('User', {
        loginUser: state => state.loginUser
      })
    },
    data () {
      return {
        showWhich: 1, //1-聊天,2-好友
        chatArr: [], //聊天的信息
        friends: [], //好友信息
        activeChatIndex: 0, //激活的聊天记录
        activeFriIndex: 0, //激活的好友
        newFriendName: '' //要添加的好友的用户名
      }
    },
    props: {
      newFriendsArr: {
        default: () => [],
        type: Array
      },
    },
    watch: { },
    methods: {
      //点击聊天栏里的用户
      showChat (index) {
        this.activeChatIndex = index
        let clickChat = this.chatArr.find((item) => {
          return item.index === index
        })
        clickChat.badgeHidden = true
        clickChat.badgeValue = 0
        Bus.$emit('showChat', clickChat)
      },
      //点击好友栏里的用户
      showFriend (type, index) {
        //显示新的好友
        if (type === 'new') {
          //显示好友列表里好友
          this.activeFriIndex = index
          Bus.$emit('showFriend', type, this.newFriendsArr.find((item) => {
            return item.index === index
          }))
        } else {
          //显示好友列表里好友
          this.activeFriIndex = index
          Bus.$emit('showFriend', type, this.friends.find((item) => {
            return item.index === index
          }))
        }
      },
      //如果当前激活的聊天信息有新的聊天记录时,将未读消息置为0并且隐藏
      checkActiveChat () {
        for (let i = 0; i < this.chatArr.length; i++) {
          if (this.chatArr[i].index === this.activeChatIndex) {
            this.chatArr[i].badgeValue = 0
            this.chatArr[i].badgeHidden = true
            break
          }
        }
      },
      //点击添加好友按钮
      addFri () {
        if (this.newFriendName) {
          let friObj = this.friends.find(item => {
            return item.name === this.newFriendName
          })
          if (friObj) {
            this.$message({
              message: '该好友已经在你的好友列表中',
              type: 'warning'
            })
            return
          }
          this.$confirm(`要添加用户名为${this.newFriendName}的好友吗?`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(async () => {
            try {
              let friendData = {
                name: this.loginUser,
                addWho: this.newFriendName
              }
              //添加新的好友请求
              const url = "http://127.0.0.1:8888/friendRequest"
              let response = await this.$http.post(url, friendData)
              if (response && response.data.message === 'success') {
                this.$message({
                  type: 'success',
                  message: '已发送好友申请'
                })
                this.newFriendName = ''
              }
            } catch (e) {
              console.log(e)
              this.$message.error(e)
              return false
            }
          }).catch(() => {}) 
        }
      }
    },
    mounted () {
      Bus.$on('chatWithTA', (data) => {
        for (let i = 0 ; i < this.chatArr.length; i++) {
          if (this.chatArr[i].chatWithWho === data) {
            this.showChat(this.chatArr[i].index)
            return
          }
        }
        this.chatArr.unshift({
          index: this.chatArr.length,
          chatWithWho: data,
          lasContent: '', //最后一条聊天记录
          content: []
        })
        this.showChat(this.chatArr[0].index)
      })
    }
  }
</script>

<style scoped>
.chatClass, .friendClass {
  width: 250px;
  height: 64px;
  display: flex;
  overflow: hidden;
}
.chatClass:hover, .friendClass:hover {
  background-color: #C7C6C5;
}
.chatClassClick, .friendClassClick {
  background-color: #C7C6C5;
}
.title {
  font-size: 17px;
  font-weight: 500;
}
.content {
  font-size: 14px;
  overflow: hidden;
  color: #A79999;
}
#logo {
  height: 44px;
  margin: 10px;
  width: 44px;
  float: left;
}
.contentClass, .contentClassFir {
  width: 180px;
  margin: auto 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.titleFir {
  font-size: 15px;
  font-weight: 400;
}
.badgeItem {
  margin-top: 22px;
  margin-right: 30px;
}
.addfriendClass {
  width: 250px;
  height: 50px;
  display: flex;
  overflow: hidden;
}
.newFriendNameClass {
  width: 180px;
  margin: 5px;
}
.addFriendBtn {
  width: 35px;
  height: 30px;
  margin: 10px 0;
  font-size: 15px;
  padding: 3px;
}
.newFriendsClass {
  font-size: 14px;
  margin: 10px;
}
</style>
