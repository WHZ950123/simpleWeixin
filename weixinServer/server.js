const ws = require('nodejs-websocket')
const arr = {} //方便管理连接

//获取所有连接服务器的玩家用户名
function getConnectedMan() {
  let manArr = []
  for (let item in arr) {
    manArr.push(item)
  }
  return manArr
}

//向用户发送信息
function sendMessage(name, code, text) {
  if (arr[name]) {
    arr[name].sendText(JSON.stringify({ //发送连接成功字符串
      code: code,
      username: name,
      text: text
    }))
  }
}

const server = ws.createServer(function(socket) {
  socket.on('text', function(str) { //nodejs-websocket框架监听的是text
    let data = JSON.parse(str)
    let username = data.username
    let chatWithWho = data.chatWithWho
    let mes = data.mes
    let content = data.content
    let time = data.time
    console.log(`websocket服务器收到了来自${username}的消息:${mes},发送给:${chatWithWho},内容是:${content}`)
    /**
    收到的data.mes的消息:
    link: 连接
    close: 关闭连接
    chat: 聊天
    发送给客户端的信息:
    code: 200 发送连接成功字符串
    code: 202 发送聊天信息
    code: 500 发送连接失败字符串
    */
    if (mes === 'link') { //连接
      arr[username] = socket
      socket.sendText(JSON.stringify({ //发送连接成功字符串
        code: 200,
        username: username,
        text: '连接成功'
      }))
    } else {
      if (arr[username]) {
        if (mes === 'chat') { //聊天
          let chatObj = {
            code: 202,
            username: username, //聊天信息从哪来
            chatWithWho: chatWithWho, //聊天信息发给谁
            text: content, //聊天的内容
            time: time //发消息的时间
          }
          socket.sendText(JSON.stringify(chatObj))
          if (arr[chatWithWho]) {
            arr[chatWithWho].sendText(JSON.stringify(chatObj))
          }
        }
        if (mes === 'close') { //如果是关闭连接的消息,就从数组删除该用户
          delete arr[username]
          return
        }
      }
    }
    console.log('websocket连接的用户:', getConnectedMan())
  })

  socket.on('close', function (code, reason) {
    console.log("websocket关闭连接")
    console.log('websocket连接的用户:', getConnectedMan())
  })

  socket.on('error', function (code, reason) {
    console.log("websocket异常关闭")
    console.log('websocket连接的用户:', getConnectedMan())
  })
})

module.exports = {
  server,
  sendMessage: sendMessage
}