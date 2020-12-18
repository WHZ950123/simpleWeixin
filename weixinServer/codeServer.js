const http = require('http')
const qrImg = require('qr-image')
const url  = require('url')
const fetch = require('node-fetch')

const websocketServer = require('./server.js').server
const sendMessage = require('./server.js').sendMessage
console.log('sendMessage', sendMessage)


let friendsUrl = "http://localhost:3000/friends"
let chatsUrl = "http://localhost:3000/chats"
let newFriendsUrl = "http://localhost:3000/newFriends"
let userNameArr = ['whz', 'psl', 'porty', '迪丽热巴', '张三', '肖战', '小红帽'] //用于记录扫码登录的用户的用户名
 
var server = http.createServer(async function (request, response) {
    const requset_url = request.url
    let username = ''
    console.log('url:', requset_url)
    //将字符串格式参数转化为对象使用
    var strurl = url.parse(requset_url, true)
    const pathName = strurl.pathname
    const query = strurl.query
    username = query.username

    if (pathName === '/code') { //获取二维码
        //此处URL使用内网穿透,为了能在手机上扫码
        var string_url = 'https://chengyu.tunnel.svrx.io/hello?username=' + username
        var img = qrImg.image(string_url, { size: 10 })
        response.writeHead(200, { 'Content-Type': 'image/png' })
        img.pipe(response)
    } else if (pathName === '/hello') { //登录
        if (username && username.length > 0 && userNameArr.indexOf(username) < 0) {
            userNameArr.push(username)
            console.log(`${username}，登录成功`)
            response.end(`${username}，登录成功`)
        }
        console.log('登录的用户:', userNameArr)
    } else if (pathName === '/askForLogin') { //每隔1秒调一次该接口,获取用户是否登录成功
        if (username && userNameArr.indexOf(username) >= 0) {
            response.end(JSON.stringify({
                code: 200,
                message: 'ok'
            }));
        } else {
            response.end(JSON.stringify({
                code: 200,
                message: 'no'
            }))
        }
    } else if (pathName === '/getFriendsList') { //用户获取好友列表
        const res = await fetch(friendsUrl + '?name=' + encodeURI(username), {
            method: 'GET'
        })
        let text = await res.text()
        text = JSON.parse(text)
        response.end(JSON.stringify({
            code: 200,
            message: text[0]
        }))
    } else if (pathName === '/getChatsList') { //用户获取聊天消息列表
        const res1 = await fetch(chatsUrl + '?user1=' + encodeURI(username), {
            method: 'GET'
        })
        let text1 = await res1.text()
        text1 = JSON.parse(text1)
        const res2 = await fetch(chatsUrl + '?user2=' + encodeURI(username), {
            method: 'GET'
        })
        let text2 = await res2.text()
        text2 = JSON.parse(text2)
        response.end(JSON.stringify({
            code: 200,
            message: text1.concat(text2)
        }))
    } else if (pathName === '/getNewFriends') { //用户获取新的好友列表
        const res = await fetch(newFriendsUrl + '?name=' + encodeURI(username), {
            method: 'GET'
        })
        let text = await res.text()
        text = JSON.parse(text)
        response.end(JSON.stringify({
            code: 200,
            message: text[0]
        }))
    } else if (pathName === '/addChats') { //新增聊天信息
        console.log('聊天的信息')
        let chatData = []
        request.on('data', chunk => {
            chatData.push(chunk)  //将接收到的数据暂时保存起来
        })
        request.on('end', async () => {
            chatData = JSON.parse(chatData)
            console.log(chatData) //数据传输完,打印数据的内容
            let str1 = encodeURI(chatsUrl + '?user1=' + chatData.username + '&user2=' + chatData.chatWithWho)
            const res1 = await fetch(str1, {
                method: 'GET'
            })
            let text1 = await res1.text()
            text1 = JSON.parse(text1)
            if (text1 && text1.length > 0) {
                await updateChats(chatData, text1[0]) //追加聊天信息
            } else {
                let str2 = encodeURI(chatsUrl + '?user1=' + chatData.chatWithWho + '&user2=' + chatData.username)
                const res2 = await fetch(str2, {
                    method: 'GET'
                })
                let text2 = await res2.text()
                text2 = JSON.parse(text2)
                if (text2 && text2.length > 0) {
                    await updateChats(chatData, text2[0]) //追加聊天信息
                } else { //chats里没有这2个用户的聊天记录
                    await addChats(chatData) //新增聊天信息
                }
            }
            response.end(JSON.stringify({
                code: 200,
                message: 'success'
            }))
        })
    } else if (pathName === '/friendRequest') { //申请好友
        console.log('申请好友')
        let friendData = []
        request.on('data', chunk => {
            friendData.push(chunk)  //将接收到的数据暂时保存起来
        })
        request.on('end', async () => {
            friendData = JSON.parse(friendData)
            console.log(friendData) //数据传输完,打印数据的内容
            //先搜索addWho(被请求的人)的newFriends列表里有没有name(请求者)
            let str1 = encodeURI(newFriendsUrl + '?name=' + friendData.addWho)
            const res1 = await fetch(str1, {
                method: 'GET'
            })
            let text1 = await res1.text()
            text1 = JSON.parse(text1)
            if (text1 && text1.length > 0) {
                //查询是否有name(请求者)的请求信息,没有则追加数据,有就不管
                let friendList = text1[0].list
                let hasMe = friendList.some(item => {
                    return item.name === friendData.name
                })
                if (!hasMe) {
                    //往addWho的list里追加数据
                    await appendDataToNewFriends(friendData, text1[0])
                }
            } else {
                //往newFriends添加新数据
                await addDataToNewFriends(friendData)
            }
            //发送socket信息,204更新好友列表
            sendMessage(friendData.addWho, 204, 'updateFriendsList')
            response.end(JSON.stringify({
                code: 200,
                message: 'success'
            }))
        })
    } else if (pathName === '/addFriend') { //添加好友
        console.log('添加好友')
        let friendData = []
        request.on('data', chunk => {
            friendData.push(chunk)  //将接收到的数据暂时保存起来
        })
        request.on('end', async () => {
            friendData = JSON.parse(friendData)
            console.log(friendData) //数据传输完,打印数据的内容
            let str1 = encodeURI(newFriendsUrl + '?name=' + friendData.name)
            const res1 = await fetch(str1, {
                method: 'GET'
            })
            let text1 = await res1.text()
            text1 = JSON.parse(text1)
            if (text1 && text1.length > 0) {
                let friendList = text1[0].list
                friendList = friendList.filter(item => {
                    return item.name !== friendData.addWho
                })
                //修改新的好友,从newFriends列表里删除新好友
                await updateNewFriends(friendList, text1[0])

                //查找name用户的好友列表,往里面添加数据
                let str2 = encodeURI(friendsUrl + '?name=' + friendData.name)
                const res2 = await fetch(str2, {
                    method: 'GET'
                })
                let text2 = await res2.text()
                text2 = JSON.parse(text2)
                let oldFriData1 = {
                    index: new Date().getTime(),
                    name: friendData.addWho
                }
                if (text2 && text2.length > 0) {
                    let friList = text2[0].fri || []
                    friList.push(oldFriData1)
                    //修改新的好友,往friends列表里的fri数组里追加新好友
                    await updateOldFriendsAppend(friList, text2[0])
                } else {
                    //修改新的好友,往friends列表里创建新好友
                    await updateOldFriends([oldFriData1], friendData.name)
                }

                //查找addWho用户的好友列表,往里面添加数据
                let oldFriData2 = {
                    index: new Date().getTime(),
                    name: friendData.name
                }
                let str3 = encodeURI(friendsUrl + '?name=' + friendData.addWho)
                const res3 = await fetch(str3, {
                    method: 'GET'
                })
                let text3 = await res3.text()
                text3 = JSON.parse(text3)
                if (text3 && text3.length > 0) {
                    let friList = text3[0].fri || []
                    friList.push(oldFriData2)
                    //修改新的好友,往friends列表里的fri数组里追加新好友
                    await updateOldFriendsAppend(friList, text3[0])
                } else {
                    //修改新的好友,往friends列表里创建新好友
                    await updateOldFriends([oldFriData2], friendData.addWho)
                }
            }
            //发送socket信息,204更新好友列表
            sendMessage(friendData.addWho, 204, 'updateFriendsList')
            response.end(JSON.stringify({
                code: 200,
                message: 'success'
            }))
        })
    }
});

//往newFriends里追加数据
async function appendDataToNewFriends(data, obj) {
    let list = obj.list || []
    list.push({
        index: new Date().getTime(),
        name: data.name
    })
    let newData = {
        name: obj.name,
        list: list
    }
    const res = await fetch(newFriendsUrl + '/' + obj.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newData)
    })
}

//往newFriends添加新数据
async function addDataToNewFriends(friendData) {
    let newFriendData = {
        name: friendData.addWho,
        list: [
            {
                index: new Date().getTime(),
                name: friendData.name
            }
        ]
    }
    const res = await fetch(newFriendsUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newFriendData)
    })
}

//修改新的好友,往friends列表里的fri数组里追加新好友
async function updateOldFriendsAppend(oldFriendList, oldFriData) {
    let newData = {
        name: oldFriData.name,
        fri: oldFriendList
    }
    //往friends列表里添加新好友
    const res = await fetch(friendsUrl + '/' + oldFriData.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newData)
    })
}

//修改新的好友,往friends列表里创建新好友
async function updateOldFriends(oldFriendList, name) {
    let newChat = {
        name: name,
        fri: oldFriendList
    }
    const res = await fetch(friendsUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newChat)
    })
}

//修改新的好友,从newFriends列表里删除新好友
async function updateNewFriends(friendList, newFriData) {
    let newData = {
        name: newFriData.name,
        list: friendList
    }
    //从newFriends列表里删除新好友
    const res = await fetch(newFriendsUrl + '/' + newFriData.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newData)
    })
}

//修改聊天记录,往2个用户的content数组里追加数据
async function updateChats(chatData, data) {
    let arr = data.content
    arr.push({
        name: chatData.username,
        content: chatData.content,
        time: chatData.time
    })
    let newChat = {
        user1: data.user1,
        user2: data.user2,
        content: arr
    }
    const res = await fetch(chatsUrl + '/' + data.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newChat)
    })
}

//创建一个聊天记录对象
async function addChats(chatData) {
    let newChat = {
        user1: chatData.username,
        user2: chatData.chatWithWho,
        content: [{
            name: chatData.username,
            content: chatData.content,
            time: chatData.time
        }]
    }
    const res = await fetch(chatsUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newChat)
    })
}
 
server.listen(8888, function () {
    console.log('申请二维码端口:8888')
})

websocketServer.listen(4000, function () {
    console.log('websocket begin on 4000')
})