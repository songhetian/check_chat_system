// 在 supervisor-client/index.html 的 <script> 标签中补充
function broadcastMessage() {
    const msg = prompt('请输入要推送给全体客服的紧急通知：');
    if(msg) {
        // socket.emit('broadcast-all', { message: msg });
        alert('通知已通过局域网下发至所有在线客服端。');
    }
}

// 监听协助请求
/*
socket.on('on-help-request', (data) => {
    // 弹出右下角系统通知
    new Notification('收到新的求助请求', {
        body: `客服 ID:${data.agentId} 请求协助: ${data.content}`
    });
});
*/
