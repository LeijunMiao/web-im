(function (global, factory) {
    global.IM = factory();
})(this, function () {
    function IM() {
        var socket = new IWebSocket("ws://121.41.20.11:8081", null, {
            isPing: false,
            automaticOpen: true,
            isReconnectAttempt: false
        });
        socket.onmessage = function (ev) {
            // console.log(ev);
        }
        this.init = function (option,cb) {
            socket.syncSend({
                operator: '/v1/session/start',
                sequence: 0,
                header: '',
                body: JSON.stringify({
                    device: 'web', // 客户端设备信息：pc、pad、mobile、web等
                    os: option.os, // 客户端运行的操作系统
                    os_version: option.os_version, // 操作系统版本
                    app: option.app, // 客户端运行的app
                    app_version: option.app_version, // // 客户端运行的app版本
                    tag: option.tag || {} // 用于发送自定义标记
                })
            }).then(cb);
        };
        this.bind = function(option){
            socket.send({
                operator: '/v1/session/bind/uid',
                sequence: 0,
                header: '',
                body: JSON.stringify({
                    id: option.id, 
                    password: option.password, 
                })
            });
        };
        this.bindToken = function(option){
            socket.send({
                operator: '/v1/session/bind/uid/by/token',
                sequence: 0,
                header: '',
                body: JSON.stringify({
                    token: option.token, 
                })
            });
        };
        this.unbind = function(option){
            socket.send({
                operator: '/v1/session/unbind/uid',
                sequence: 0,
                header: '',
                body: ''
            });
        };
        this.status = function(option){
            socket.send({
                operator: '/v1/session/status',
                sequence: 0,
                header: '',
                body:  JSON.stringify({
                    status: option.status, 
                })
            });
        };
        this.lists = function(option,cb){
            if(typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/session/lists',
                sequence: 0,
                header: '',
                body:  ''
            }).then(cb);
        };
        this.message = function(option,cb){
            socket.syncSend({
                operator: '/v1/send/message',
                sequence: 0,
                header: '',
                body:  ''
            }).then(cb);
        };


    }
    return IM;
});