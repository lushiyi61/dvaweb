"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRequest = exports.updateBindJWTToken = exports.bindJWTToken = exports.requestFile = exports.uploadFile = exports.requestPut = exports.requestPatch = exports.requestPost = exports.requestDelete = exports.requestGet = exports.requestSse = exports.getUrl = exports.bindHeader = exports.initRequest = void 0;
const fetch_event_source_1 = require("@microsoft/fetch-event-source");
const axios_1 = require("axios");
const qs = require("qs");
const requestParams = {
    serverHome: [],
    errorHandler: () => { },
    printLog: false,
    extraHeaders: {},
    serverHomeIndex: 0,
    token: "Token",
};
function initRequest(serverHome, errorHandler, printLog = false, serverHomeIndex = 0, token = "Token") {
    requestParams.printLog = printLog;
    requestParams.serverHome = serverHome;
    requestParams.errorHandler = errorHandler;
    requestParams.serverHomeIndex = serverHomeIndex;
    requestParams.token = token;
}
exports.initRequest = initRequest;
function bindHeader(key, value) {
    requestParams.extraHeaders[key] = value;
}
exports.bindHeader = bindHeader;
function getUrl(url, index = -1) {
    if (!url) {
        return requestParams.serverHome[requestParams.serverHomeIndex];
    }
    // 添加url前缀
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        return requestParams.serverHome[index >= 0 ? index : requestParams.serverHomeIndex] + url;
    }
    return url;
}
exports.getUrl = getUrl;
function requestSse(url, cb, ctrl = new AbortController(), body, serverHomeIndex) {
    const qsStr = body ? `?${qs.stringify(body)}` : "";
    (0, fetch_event_source_1.fetchEventSource)(getUrl(url, serverHomeIndex) + qsStr, Object.assign({ method: "GET", headers: Object.assign(Object.assign({}, requestParams.extraHeaders), { "Content-Type": "application/json", Accept: "text/event-stream" }), signal: ctrl.signal, openWhenHidden: true, onopen(response) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log("onopen", response);
            });
        },
        onmessage(response) {
            console.log("fetchEventSource:", response);
        },
        onclose() {
            console.log("onclose");
        },
        onerror(err) {
            console.log("onerror", err);
            ctrl.abort();
            throw err;
        } }, cb));
}
exports.requestSse = requestSse;
function requestGet(url, body, serverHomeIndex) {
    return request(getUrl(url, serverHomeIndex), { method: "GET", body }, requestParams);
}
exports.requestGet = requestGet;
function requestDelete(url, serverHomeIndex) {
    return request(getUrl(url, serverHomeIndex), { method: "DELETE" }, requestParams);
}
exports.requestDelete = requestDelete;
function requestPost(url, body, serverHomeIndex) {
    return request(getUrl(url, serverHomeIndex), { method: "POST", body }, requestParams);
}
exports.requestPost = requestPost;
function requestPatch(url, body, serverHomeIndex) {
    return request(getUrl(url, serverHomeIndex), { method: "PATCH", body }, requestParams);
}
exports.requestPatch = requestPatch;
function requestPut(url, body, serverHomeIndex) {
    return request(getUrl(url, serverHomeIndex), { method: "PUT", body }, requestParams);
}
exports.requestPut = requestPut;
function uploadFile(url, body, serverHomeIndex) {
    return request(getUrl(url, serverHomeIndex), { method: "POST", body }, requestParams, { 'Content-Type': 'application/form-data' });
}
exports.uploadFile = uploadFile;
function requestFile(url, body = {}, method = 'GET', serverHomeIndex) {
    if (!requestParams.extraHeaders["Authorization"]) {
        const token = localStorage.getItem(requestParams.token);
        token && (requestParams.extraHeaders["Authorization"] = token);
    }
    url = getUrl(url, serverHomeIndex);
    return new Promise((resolve, reject) => {
        const option = {
            method,
            url,
            responseType: 'blob',
            headers: Object.assign(Object.assign({}, requestParams.extraHeaders), { Accept: "application/json", Pragma: "no-cache", "Cache-Control": "no-cache", Expires: 0, "Content-Type": "application/json; charset=utf-8" }),
            params: body,
            data: body,
        };
        (0, axios_1.default)(option).then(res => {
            const blob = new Blob([res.data], { type: 'application/octet-stream;charset=utf-8' });
            const downloadElement = document.createElement('a');
            const href = window.URL.createObjectURL(blob);
            const contentDisposition = res.headers['content-disposition'];
            const patt = new RegExp("filename=([^;]+\\.[^\\.;]+);*");
            const result = patt.exec(contentDisposition);
            const filename = decodeURI(result[1]);
            downloadElement.style.display = 'none';
            downloadElement.href = href;
            downloadElement.download = filename; //下载后文件名
            document.body.appendChild(downloadElement);
            downloadElement.click(); //点击下载
            document.body.removeChild(downloadElement); //下载完成移除元素
            window.URL.revokeObjectURL(href); //释放掉blob对象
            resolve(res.data);
        }).catch(e => {
            console.error('[catch]', e);
            const { status, data } = (e === null || e === void 0 ? void 0 : e.response) || {};
            status && data && requestParams.errorHandler(status, data);
            reject(e);
        });
    });
}
exports.requestFile = requestFile;
let bindJWTToken = (token) => {
    if (token) {
        localStorage.setItem(requestParams.token, token);
        requestParams.extraHeaders["Authorization"] = token;
    }
    else {
        localStorage.removeItem(requestParams.token);
        delete requestParams.extraHeaders["Authorization"];
    }
};
exports.bindJWTToken = bindJWTToken;
let request = (url, options, requestParams, extraHeaders) => {
    const { method, body } = options;
    if (!requestParams.extraHeaders["Authorization"]) {
        const token = localStorage.getItem(requestParams.token);
        token && (requestParams.extraHeaders["Authorization"] = token);
    }
    const option = {
        method,
        url,
        headers: Object.assign(Object.assign({ Accept: "application/json", Pragma: "no-cache", Expires: 0, "Cache-Control": "no-cache", "Content-Type": "application/json; charset=utf-8" }, requestParams.extraHeaders), extraHeaders),
    };
    // 参数赋值
    switch (method.toUpperCase()) {
        case "GET":
        case "DELETE":
            option.params = body || {};
            break;
        case "POST":
        case "PATCH":
        case "PUT":
            option.data = body || {};
            break;
    }
    return new Promise((resolve) => {
        (0, axios_1.default)(option)
            .then(({ data }) => {
            requestParams.printLog &&
                console.log("[request]", method, url, body, data);
            resolve(data);
        })
            .catch((e) => {
            var _a;
            if (e.response) {
                const { status, data } = e.response;
                requestParams.errorHandler((_a = data === null || data === void 0 ? void 0 : data.message) === null || _a === void 0 ? void 0 : _a.toString(), status);
                if (401 == status)
                    (0, exports.bindJWTToken)();
            }
            else {
                requestParams.errorHandler("网络异常", 500);
            }
            resolve(null);
        });
    });
};
function updateBindJWTToken(f) {
    exports.bindJWTToken = f;
}
exports.updateBindJWTToken = updateBindJWTToken;
function updateRequest(f) {
    request = f;
}
exports.updateRequest = updateRequest;
