$(function () {
    var socket = new IWebSocket("ws://121.41.20.11:8083",null,{
        isPing: true,
        automaticOpen: false,
        isReconnectAttempt: false
    });
    var key = 'b8ca9aa66def05ff3f24919274bb4a66';
    var iv = 'b8ca9aa66def05ff3f24919274bb4a66';

    var callbacks = {};

    socket.open();
    socket.onopen = function (ev) {
        console.log("connection");
        socket.init({
            "device": "web",// 客户端设备信息：pc、pad、mobile、web等
            "os": "linux", // 客户端运行的操作系统
            "os_version": "3.6", // 操作系统版本
            "app": "go-client", // 客户端运行的app
            "app_version": "1.0", // // 客户端运行的app版本
            "tag":{} // 
        });
    };

    socket.onclose = function () {
        console.log("connection close");
        // clearInterval(int);
    };

    socket.onmessage = function (ev) {
        console.log("connection onmessage");
        console.log(ev);
        // console.log(typeof ev.data);
        // if (ev.data instanceof Blob) {
        //     var reader = new FileReader();

        //     reader.readAsArrayBuffer(ev.data);

        //     reader.onload = function () {
        //         var dataView = new DataView(this.result);
        //         var operator = dataView.getUint32(0, false);
        //         var sequence = parseInt(dataView.getUint32(4, false).toString() + dataView.getUint32(8, false).toString(), 10);
        //         var headerLength = dataView.getUint32(12, false);
        //         var bodyLength = dataView.getUint32(16, false);

        //         var packetLength = headerLength + bodyLength + 20;
        //         if (packetLength > 1024) {
        //             console.log("the packet is big than 1024")
        //         }
        //         var header = $.Utils.ab2str(dataView.buffer.slice(20, 20 + headerLength));
        //         var body = $.Utils.ab2str(dataView.buffer.slice(20 + headerLength));

        //         console.log(operator, sequence, headerLength, bodyLength, header, body)
        //         header = $.Utils.binToBase64($.Utils.stringToBin(header))
        //         body = $.Utils.binToBase64($.Utils.stringToBin(body))
        //         header = $.Utils.decrypt(header, key, iv);
        //         body = $.Utils.decrypt(body, key, iv);
        //         console.log(header, body);
        //         var data = {
        //             header: header,
        //             body: body
        //         };
        //         if ($.Deferred(callbacks[sequence]) && callbacks[sequence]) {
        //             var callback = callbacks[sequence];
        //             delete callbacks[sequence];
        //             callback.resolve(data);
        //         } else {
        //             console.error("Unhandled message: %o", data);
        //         }
        //     }
        // } 
        // else {
        //     console.log("unsupported data format")
        //     console.log(ev.data);
        // }
    };

    $("#sendBtn").on("click", function () {
        var operator = '/v1/send/message';
        var sequence = 0;
        var header = "test header";
        var body = "test bodyer";
        socket.syncSend({
            operator: operator,
            sequence: sequence,
            header:header,
            body:body
        }).then(function(data){
            console.log(data);
        });
    });
});