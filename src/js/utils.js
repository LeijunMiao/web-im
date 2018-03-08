"use strict";

import * as CryptoJS from "crypto-js";

class Utils {
    // ArrayBuffer 转为字符串，参数为 ArrayBuffer 对象
    static ab2str(buf) {
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
    }

    // 字符串转为 ArrayBuffer 对象，参数为字符串
    static str2ab(str) {
        const buf = new ArrayBuffer(str.length); // 每个字符占用2个字节
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    // 解密服务端传递过来的字符串
    static decrypt(word, pwd) {
        const key = CryptoJS.enc.Utf8.parse(pwd);
        const decrypted = CryptoJS.AES.decrypt(word, key,
            {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            });

        return decrypted.toString(CryptoJS.pad.Utf8).toString();
    }

    // 加密字符串以后传递到服务端
    static encrypt(word, pwd) {
        return CryptoJS.AES.encrypt(word, pwd,
            {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        ).toString();
    }

    get prop() {
        return 'getter';
    }

    // noinspection JSAnnotator
    set prop(parameters) {
        let prop = parameters.prop;
        console.log(prop);
    }
}

function PaddingLeft(key, length){
    var pkey= key.toString();
    var l = pkey.length;
    if (l < length) {
        pkey = new Array(length - l + 1).join('0') + pkey;
    }else if (l > length){
        pkey = pkey.slice(length);
    }
    return pkey;
}
export {Utils}