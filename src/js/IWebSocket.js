(function (global, factory) {
    global.IWebSocket = factory();
})(this, function () {
    var asekey = 'b8ca9aa66def05ff3f24919274bb4a66';
    var iv = 'b8ca9aa66def05ff3f24919274bb4a66';

    if (!('WebSocket' in window)) {
        return;
    }

    function IWebSocket(url, protocols, options) {

        // Default settings
        var settings = {

            /** Whether this instance should log debug messages. */
            debug: false,

            /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
            automaticOpen: true,

            /** The number of milliseconds to delay before attempting to reconnect. */
            reconnectInterval: 1000,
            /** The maximum number of milliseconds to delay a reconnection attempt. */
            maxReconnectInterval: 30000,
            /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
            reconnectDecay: 1.5,

            /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
            timeoutInterval: 2000,

            /** The maximum number of reconnection attempts to make. Unlimited if null. */
            maxReconnectAttempts: null,

            isReconnectAttempt: true,

            /** The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. */
            binaryType: 'blob',

            isPing: true
        }
        if (!options) {
            options = {};
        }

        // Overwrite and define settings with options if they exist.
        for (var key in settings) {
            if (typeof options[key] !== 'undefined') {
                this[key] = options[key];
            } else {
                this[key] = settings[key];
            }
        }

        // These should be treated as read-only properties

        /** The URL as resolved by the constructor. This is always an absolute URL. Read only. */
        this.url = url;

        /** The number of attempted reconnects since starting, or the last successful connection. Read only. */
        this.reconnectAttempts = 0;

        /**
         * The current state of the connection.
         * Can be one of: WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED
         * Read only.
         */
        this.readyState = WebSocket.CONNECTING;

        /**
         * A string indicating the name of the sub-protocol the server selected; this will be one of
         * the strings specified in the protocols parameter when creating the WebSocket object.
         * Read only.
         */
        this.protocol = null;

        // Private state variables

        var self = this;
        var ws;
        var forcedClose = false;
        var timedOut = false;
        var int;
        var callbacks = {};
        var eventTarget = document.createElement('div');

        // Wire up "on*" properties as event handlers

        eventTarget.addEventListener('open', function (event) {
            self.onopen(event);
        });
        eventTarget.addEventListener('close', function (event) {
            self.onclose(event);
        });
        eventTarget.addEventListener('connecting', function (event) {
            self.onconnecting(event);
        });
        eventTarget.addEventListener('message', function (event) {
            self.onmessage(event);
        });
        eventTarget.addEventListener('error', function (event) {
            self.onerror(event);
        });

        // Expose the API required by EventTarget

        this.addEventListener = eventTarget.addEventListener.bind(eventTarget);
        this.removeEventListener = eventTarget.removeEventListener.bind(eventTarget);
        this.dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);

        /**
         * This function generates an event that is compatible with standard
         * compliant browsers and IE9 - IE11
         *
         * This will prevent the error:
         * Object doesn't support this action
         *
         * http://stackoverflow.com/questions/19345392/why-arent-my-parameters-getting-passed-through-to-a-dispatched-event/19345563#19345563
         * @param s String The name that the event should use
         * @param args Object an optional object that the event will use
         */
        function generateEvent(s, args) {
            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent(s, false, false, args);
            return evt;
        };

        this.open = function (reconnectAttempt) {

            // setTimeout(function () {
            //     var data = 33;
            //     var callback = callbacks[0];
            //     delete callbacks[0];
            //     callback.resolve(data);
            // }, 10000);

            ws = new WebSocket(self.url, protocols || []);
            ws.binaryType = this.binaryType;

            if (reconnectAttempt) {
                if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts) {
                    return;
                }
            } else {
                eventTarget.dispatchEvent(generateEvent('connecting'));
                this.reconnectAttempts = 0;
            }

            if (self.debug || IWebSocket.debugAll) {
                console.debug('IWebSocket', 'attempt-connect', self.url);
            }

            var localWs = ws;
            var timeout = setTimeout(function () {
                if (self.debug || IWebSocket.debugAll) {
                    console.debug('IWebSocket', 'connection-timeout', self.url);
                }
                timedOut = true;
                localWs.close();
                timedOut = false;
            }, self.timeoutInterval);

            ws.onopen = function (event) {
                if (self.isPing) {
                    int = setInterval(ping, 1000);
                }

                clearTimeout(timeout);
                if (self.debug || IWebSocket.debugAll) {
                    console.debug('IWebSocket', 'onopen', self.url);
                }
                self.protocol = ws.protocol;
                self.readyState = WebSocket.OPEN;
                self.reconnectAttempts = 0;
                var e = generateEvent('open');
                e.isReconnect = reconnectAttempt;
                reconnectAttempt = false;
                eventTarget.dispatchEvent(e);
            };

            ws.onclose = function (event) {
                clearTimeout(timeout);
                ws = null;
                if (forcedClose) {
                    self.readyState = WebSocket.CLOSED;
                    eventTarget.dispatchEvent(generateEvent('close'));
                } else {
                    self.readyState = WebSocket.CONNECTING;
                    var e = generateEvent('connecting');
                    e.code = event.code;
                    e.reason = event.reason;
                    e.wasClean = event.wasClean;
                    eventTarget.dispatchEvent(e);
                    if (!reconnectAttempt && !timedOut) {
                        if (self.debug || IWebSocket.debugAll) {
                            console.debug('IWebSocket', 'onclose', self.url);
                        }
                        eventTarget.dispatchEvent(generateEvent('close'));
                    }

                    var timeout = self.reconnectInterval * Math.pow(self.reconnectDecay, self.reconnectAttempts);
                    if (self.isReconnectAttempt)
                        setTimeout(function () {
                            self.reconnectAttempts++;
                            self.open(true);
                        }, timeout > self.maxReconnectInterval ? self.maxReconnectInterval : timeout);
                }
            };
            ws.onmessage = function (event) {
                if (self.debug || IWebSocket.debugAll) {
                    console.debug('IWebSocket', 'onmessage', self.url, event.data);
                }
                var e = generateEvent('message');
                // e.data = event.data;
                if (event.data instanceof Blob) {
                    var reader = new FileReader();
        
                    reader.readAsArrayBuffer(event.data);
        
                    reader.onload = function () {
                        e.data = Utils.conversionBack(this.result);
                        console.log(e);
                        if(e.data.operator && callbacks[e.data.operator]) {
                            var callback = callbacks[e.data.operator];
                            delete callbacks[e.data.operator];
                            callback.resolve({
                                header: e.data.header,
                                body: e.data.body
                            });
                        }
                        else eventTarget.dispatchEvent(e);
                    }
                } 
                else {
                    throw "unsupported data format"
                    // console.log(ev.data);
                }
                
            };
            ws.onerror = function (event) {
                if (self.debug || IWebSocket.debugAll) {
                    console.debug('IWebSocket', 'onerror', self.url, event);
                }
                eventTarget.dispatchEvent(generateEvent('error'));
            };
        }

        // Whether or not to create a websocket upon instantiation
        if (this.automaticOpen == true) {
            this.open(false);
        }

        /**
         * Transmits data to the server over the WebSocket connection.
         *
         * @param data a text string, ArrayBuffer or Blob to send to the server.
         */
        this.send = function (data) {
            if (ws) {
                if (self.debug || IWebSocket.debugAll) {
                    console.debug('IWebSocket', 'send', self.url, data);
                }
                // var attempt = $.Deferred();
                // callbacks[Utils.crc32(data.operator)] = attempt;
                ws.send(Utils.conversion(data.operator, data.sequence, data.header, data.body));
                // ws.send(data);
                // return attempt.promise();
            } else {
                throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
            }
        };

        this.syncSend = function (data) {
            if (ws) {
                var attempt = $.Deferred();
                if (typeof data.operator == 'string') data.operator = Utils.crc32(data.operator);
                ws.send(Utils.conversion(data.operator, data.sequence, data.header, data.body));
                // ws.send(data);
                callbacks[data.operator] = attempt;
                return attempt.promise();
            } else {
                throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
            }
        }

        /**
         * Closes the WebSocket connection or connection attempt, if any.
         * If the connection is already CLOSED, this method does nothing.
         */
        this.close = function (code, reason) {
            // Default CLOSE_NORMAL code
            if (typeof code == 'undefined') {
                code = 1000;
            }
            forcedClose = true;
            if (ws) {
                ws.close(code, reason);
                clearInterval(int);
            }
        };

        /**
         * Additional public API method to refresh the connection if still open (close, re-open).
         * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
         */
        this.refresh = function () {
            if (ws) {
                ws.close();
            }
        };

        function ping() {
            if (self.readyState == WebSocket.OPEN) {
                self.send({
                    operator: 0,
                    sequence: 0,
                    header: 'ping',
                    body: 'ping'
                });
            }
        }

        var Utils = {
            code: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""), //索引表
            ab2str: function (buf) {
                // 注意，如果是大型二进制数组，为了避免溢出，必须一个一个字符地转
                if (buf && buf.byteLength < 1024) {
                    return String.fromCharCode.apply(null, new Uint8Array(buf));
                }

                const bufView = new Uint8Array(buf);

                const len = bufView.length;
                const bstr = new Array(len);
                for (let i = 0; i < len; i++) {
                    bstr[i] = String.fromCharCode.call(null, bufView[i]);
                }
                return bstr.join('');
            },
            decrypt: function (data, key, iv) {
                key = CryptoJS.enc.Latin1.parse(key);
                iv = CryptoJS.enc.Latin1.parse(iv);
                var bytes = CryptoJS.AES.decrypt(data, key, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });
                return bytes.toString(CryptoJS.enc.Utf8);
            },
            encrypt: function (data, key, iv) {
                key = CryptoJS.enc.Latin1.parse(key);
                iv = CryptoJS.enc.Latin1.parse(iv);
                var encryptResult = CryptoJS.AES.encrypt(data, key, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });
                return encryptResult.toString();
            },
            str2ab: function (str) {
                const buf = new ArrayBuffer(str.length); // 每个字符占用2个字节
                const bufView = new Uint8Array(buf);
                for (let i = 0, strLen = str.length; i < strLen; i++) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            },
            binToBase64: function (bitString) {
                var result = "";
                var tail = bitString.length % 6;
                var bitStringTemp1 = bitString.substr(0, bitString.length - tail);
                var bitStringTemp2 = bitString.substr(bitString.length - tail, tail);
                for (var i = 0; i < bitStringTemp1.length; i += 6) {
                    var index = parseInt(bitStringTemp1.substr(i, 6), 2);
                    result += this.code[index];
                }
                bitStringTemp2 += new Array(7 - tail).join("0");
                if (tail) {
                    result += this.code[parseInt(bitStringTemp2, 2)];
                    result += new Array((6 - tail) / 2 + 1).join("=");
                }
                return result;
            },

            base64ToBin: function (str) {
                var bitString = "";
                var tail = 0;
                for (var i = 0; i < str.length; i++) {
                    if (str[i] != "=") {
                        var decode = this.code.indexOf(str[i]).toString(2);
                        bitString += (new Array(7 - decode.length)).join("0") + decode;
                    } else {
                        tail++;
                    }
                }
                return bitString.substr(0, bitString.length - tail * 2);
            },

            stringToBin: function (str) {
                var result = "";
                for (var i = 0; i < str.length; i++) {
                    var charCode = str.charCodeAt(i).toString(2);
                    result += (new Array(9 - charCode.length).join("0") + charCode);
                }
                return result;
            },

            binToStr: function (Bin) {
                var result = "";
                for (var i = 0; i < Bin.length; i += 8) {
                    result += String.fromCharCode(parseInt(Bin.substr(i, 8), 2));
                }
                return result;
            },
            crc32: function ( /* String */ str, /* Number */ crc) { 
                var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";   /* Number */   
                if (crc == window.undefined) crc = 0;    
                var n = 0; //a number between 0 and 255
                    
                var x = 0; //an hex number
                    
                crc = crc ^ (-1);    
                for (var i = 0, iTop = str.length; i < iTop; i++) {      
                    n = (crc ^ str.charCodeAt(i)) & 0xFF;      
                    x = "0x" + table.substr(n * 9, 8);      
                    crc = (crc >>> 8) ^ x;    
                }    
                return crc ^ (-1);  
            },
            conversion: function (operator, sequence, header, body) {
                if (typeof operator == 'string') {
                    operator = Utils.crc32(operator);
                }
                header = Utils.encrypt(header, asekey, iv);
                body = Utils.encrypt(body, asekey, iv);
                header = Utils.binToStr(Utils.base64ToBin(header));
                body = Utils.binToStr(Utils.base64ToBin(body));
                headerLength = header.length;
                bodyLength = body.length;
                const buf = new ArrayBuffer(20 + headerLength + bodyLength);
                var dataView = new DataView(buf);
                dataView.setUint32(0, operator);
                dataView.setFloat64(4, sequence);
                dataView.setUint32(12, headerLength);
                dataView.setUint32(16, bodyLength);
                const bufView = new Uint8Array(buf);
                for (let i = 0; i < headerLength; i++) {
                    bufView[20 + i] = header.charCodeAt(i);
                }
                for (let i = 0; i < bodyLength; i++) {
                    bufView[20 + headerLength + i] = body.charCodeAt(i);
                }
                // console.log(new Uint8Array(buf));
                return buf;
                // socket.send(buf);
            },
            conversionBack: function(data){
                var dataView = new DataView(data);
                var operator = dataView.getUint32(0, false);
                var sequence = parseInt(dataView.getUint32(4, false).toString() + dataView.getUint32(8, false).toString(), 10);
                var headerLength = dataView.getUint32(12, false);
                var bodyLength = dataView.getUint32(16, false);

                var packetLength = headerLength + bodyLength + 20;
                // if (packetLength > 1024) {
                //     throw "the packet is big than 1024"
                // }
                var header = Utils.ab2str(dataView.buffer.slice(20, 20 + headerLength));
                var body = Utils.ab2str(dataView.buffer.slice(20 + headerLength));

                header = Utils.binToBase64(Utils.stringToBin(header))
                body = Utils.binToBase64(Utils.stringToBin(body))
                header = Utils.decrypt(header, asekey, iv);
                body = Utils.decrypt(body, asekey, iv);
                var results = {
                    operator: operator,
                    sequence: sequence,
                    header: header,
                    body: body
                };
                // console.log(results);
                return results;
            }
        }
    }

    /**
     * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
     * this indicates that the connection is ready to send and receive data.
     */
    IWebSocket.prototype.onopen = function (event) {};
    /** An event listener to be called when the WebSocket connection's readyState changes to CLOSED. */
    IWebSocket.prototype.onclose = function (event) {};
    /** An event listener to be called when a connection begins being attempted. */
    IWebSocket.prototype.onconnecting = function (event) {};
    /** An event listener to be called when a message is received from the server. */
    IWebSocket.prototype.onmessage = function (event) {};
    /** An event listener to be called when an error occurs. */
    IWebSocket.prototype.onerror = function (event) {};

    /**
     * Whether all instances of IWebSocket should log debug messages.
     * Setting this to true is the equivalent of setting all instances of IWebSocket.debug to true.
     */
    IWebSocket.debugAll = false;

    IWebSocket.CONNECTING = WebSocket.CONNECTING;
    IWebSocket.OPEN = WebSocket.OPEN;
    IWebSocket.CLOSING = WebSocket.CLOSING;
    IWebSocket.CLOSED = WebSocket.CLOSED;

    return IWebSocket;
});