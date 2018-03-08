var ISocket = function(json) {
    let options = {
        uri:'#',
        onOpen:function(event) {
            // 自定义WSC连接事件：服务端与前端连接成功后触发
            console.log(event)
        },
        onMessage:function(event) {
            // 自定义WSC消息接收事件：服务端向前端发送消息时触发
            console.log(event)
        },
        onError:function(event) {
            // 自定义WSC异常事件：WSC报错后触发
            console.log(event)
        },
        onClose:function(event) {
            // 自定义WSC关闭事件：WSC关闭后触发
            console.log(event)
        }
    };
    $.extend(true, options, json);

    let websocket = new WebSocket(options.uri);

    websocket.onopen = function(evnt) {
        options.onOpen(evnt);
    };
    websocket.onmessage = function(evnt) {
        options.onMessage(evnt);
    };
    websocket.onerror = function(evnt) {
        options.onError(evnt);
    };
    websocket.onclose = function(evnt) {
        options.onClose(evnt);
    };

    return websocket;
}