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
        this.sid = '';
        var self = this;
        //1. 初始化会话
        this.init = function (option, cb) {
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
            }).then(function (data) {
                var body = JSON.parse(data.body);
                self.sid = body.value;
                cb();
            });;
        };
        //2. 把用户ID和session绑定在一起：通过用户名和密码登陆
        this.bind = function (option) {
            socket.send({
                operator: '/v1/session/bind/uid',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    id: option.id,
                    password: option.password,
                })
            });
        };
        //3. 通过token登陆聊天服务
        this.bindToken = function (option) {
            socket.send({
                operator: '/v1/session/bind/uid/by/token',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    token: option.token,
                })
            });
        };
        //4. 解除用户id和session的绑定即注销登录聊天服务
        this.unbind = function (option) {
            socket.send({
                operator: '/v1/session/unbind/uid',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: ''
            });
        };
        //5. 修改在线状态
        this.status = function (option) {
            socket.send({
                operator: '/v1/session/status',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    status: option.status,
                })
            });
        };
        //6. 获取当前登陆用户的设备信息
        this.lists = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/session/lists',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: ''
            }).then(cb);
        };
        //7. 发送消息：接收消息需要有消息监听/v1/message/listener
        this.message = function (option, cb) {
            socket.syncSend({
                operator: '/v1/send/message',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    from: option.from,
                    type: option.type,
                    to: option.to,
                    msg: {
                        message: option.message,
                        type: option.type // 消息类型:text audio image video
                    },
                    ext: option.ext,
                })
            }).then(cb);
        };
        //8. 标记消息已送达 
        this.serviced = function (option, cb) {
            socket.syncSend({
                operator: '/v1/mark/message/serviced',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    msg_id: option.msg_id
                })
            }).then(cb);
        };
        //9. 标记消息已送读
        this.read = function (option, cb) {
            socket.syncSend({
                operator: '/v1/mark/messages/read',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    msg_id: option.msg_id
                })
            }).then(cb);
        };
        //10. 增量获取所有会话信息
        this.conversation = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/get/all/conversation',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    last_pull: option.last_pull || 0
                })
            }).then(cb);
        };
        //11. 获取联系人列表
        this.contact = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/get/all/contact',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    last_pull: option.last_pull || 0
                })
            }).then(cb);
        };
        //12. 添加联系人
        this.addContact = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    to_add_username: option.to_add_username, // 被添加人
                    reason: option.reason // 加好友原因
                })
            }).then(cb);
        };
        //13. 删除联系人
        this.deleteContact = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/delete/contact',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //14. 屏蔽联系人
        this.addContactMasking = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact/masking',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //15. 取消屏蔽联系人
        this.removeContactMasking = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/remove/contact/masking',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //16. 置顶联系人
        this.addStickg = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact/stickg',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //16. 取消置顶联系人
        this.removeStickg = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/remove/contact/stickg',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //17. 消息免打扰
        this.addDisturbing = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact/no/disturbing',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //18. 取消消息免打扰
        this.removeDisturbing = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/remove/contact/no/disturbing',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    fid: option.fid, // 好友id
                })
            }).then(cb);
        };
        //19. 同意添加好友
        this.addContactAgree = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact/agree',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    id: option.id, // 消息id
                    to: option.to // 被添加好友的人
                })
            }).then(cb);
        };
        //20. 拒绝添加好友
        this.addContactReject = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact/reject',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    id: option.id, // 消息id
                    to: option.to // 被添加好友的人
                })
            }).then(cb);
        };
        //21. 好友申请已送达
        this.addContactReject = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/contact/serviced',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    id: option.id, // 消息id
                    to: option.to // 被添加好友的人
                })
            }).then(cb);
        };
        //22. 创建聊天室
        this.createChatroom = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/create/chatroom',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    subject: option.subject, // 聊天室名称
                    description: option.description, // 聊天室描述
                    welcome_message: option.welcome_message, // 欢迎词
                    max: option.max // 聊天室的最大人数
                })
            }).then(cb);
        };
        //23. 销毁聊天室
        this.destroyChatroom = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/destroy/chatroom',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id
                })
            }).then(cb);
        };
        //24. 离开聊天室
        this.leaveChatroom = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/leave/chatroom',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id
                })
            }).then(cb);
        };
        //25. 获取聊天室详情
        this.chatroom = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/get/chatroom/profile',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id
                })
            }).then(cb);
        };
        //26. 修改聊天室名称
        this.updateChatroomSubject = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/update/chatroom/subject',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id
                })
            }).then(cb);
        };
        //27. 修改聊天室描述信息
        this.updateChatroomDes = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/update/chatroom/description',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id
                })
            }).then(cb);
        };
        //28. 添加管理员
        this.addChatroomAdmin = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/add/chatroom/admin',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id,
                    admin_id: option.admin_id
                })
            }).then(cb);
        };
        //29. 移除管理员
        this.removeChatroomAdmin = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/remove/chatroom/admin',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id,
                    admin_id: option.admin_id
                })
            }).then(cb);
        };
        //30. 批量删除聊天室成员
        this.removeChatroomMembers = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/remove/chatroom/members',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id,
                    members: option.members
                })
            }).then(cb);
        };
        //30. 删除聊天室成员
        this.removeChatroomAdmin = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/remove/chatroom/member',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id,
                    member: option.member
                })
            }).then(cb);
        };
        //31.加入聊天室
        this.joinChatroom = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/join/chatroom',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    room_id: option.room_id
                })
            }).then(cb);
        };
        //32.获取置顶聊天室列表
        this.fetchStickChatroom = function (option, cb) {
            if (typeof option == 'function') cb = option;
            socket.syncSend({
                operator: '/v1/fetch/stick/chatroom',
                sequence: 0,
                header: 'sid=' + self.sid,
                body: JSON.stringify({
                    lang: option.lang, //"en-us或zh-cn", 
                    cache_time: option.cache_time //10位时间戳
                })
            }).then(cb);
        };

    }
    return IM;
});