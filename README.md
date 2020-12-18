# simpleWeixin
简易版微信

使用的是electron-vue，数据使用json-server

可以2个用户之间聊天，可以添加好友

运行步骤：
1、启动json-server:
json-server --watch data.json
2、启动服务器：
nodemon codeServer.js
如要使用二维码扫码功能则使用内网穿透，让手机能扫码：
lt -p 8888 -h https://tunnel.svrx.io -s chengyu
3、启动客户端：
npm run dev
可以启动多个客户端进行聊天
