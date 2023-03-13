/**************************************
@File    :   index.ts
@Time    :   2023/01/30 10:15:39
@Author  :   路拾遗
@Version :   1.0
@Contact :   lk920125@hotmail.com
yarn add axios @rematch/loading @rematch/core  react-redux redux
***************************************/

import { useSelector } from "react-redux";
import { init, createModel } from "@rematch/core";
import loadingPlugin from "@rematch/loading";
import axios, { AxiosRequestConfig } from "axios";

/*------------------------- 基于rematch实现的类dva框架 -------------------------*/
// 默认枚举
export enum EFunctionKey {
    RSetState = "RSetState",
    EGet = "EGet",
    EGetOne = "EGetOne",
    EPost = "EPost",
    EPostBatch = "EPostBatch",
    EDelete = "EDelete",
    EPut = "EPut",
    EPutBatch = "EPutBatch",
}
// dva参数
const dvaParams: { storeInstance: any, printLog: boolean, token: string } = { storeInstance: null, printLog: false, token: "Token" };
// 所有的model
const modelArray: any[] = [];

export function bindingModel(model: any) {
    modelArray.push(model);
}

export const initModels = (printLog = false, token = "Token") => {
    if (dvaParams.storeInstance) return dvaParams.storeInstance
    console.log("modelArray size ==>", modelArray.length)
    dvaParams.printLog = printLog;
    dvaParams.token = token;
    const models: any = {};
    for (let model of modelArray) {
        models[model.namespace] = createModel()({
            ...model,
            effects: (dispatch) => {
                let newEffects: any = {};
                let namespace = model.namespace;
                for (let key in model.effects) {
                    newEffects[key] = async (payload: any, rootState: any) => {
                        return await model.effects[key](
                            { state: rootState[namespace], payload },
                            {
                                reducer: (...args: any) => {
                                    if (args.length <= 2) {
                                        args.unshift(namespace);
                                    }
                                    dvaParams.printLog &&
                                        console.log("[reducer]", args[0], args[1], args[2]);
                                    dispatch[args[0]][args[1]](args[2]);
                                },
                                select: (namespace2: string) => rootState[namespace2],
                                effect: async (...args: any) => {
                                    if (args.length <= 2) {
                                        args.unshift(namespace);
                                    }
                                    dvaParams.printLog &&
                                        console.log("[effect]", args[0], args[1], args[2]);
                                    return await dispatch[args[0]][args[1]](args[2]);
                                },
                            }
                        );
                    };
                }
                return newEffects;
            },
        });
    }
    dvaParams.storeInstance = init({
        models,
        plugins: [loadingPlugin({ type: "full" })],
    });
    return dvaParams.storeInstance;
};

export const useLoading = (namespace: string) => {
    return useSelector((store: any) => {
        return store.loading.models[namespace];
    });
};

export const useConnect = (namespace: string) => {
    return useSelector((store: any) => {
        return store[namespace];
    });
};

export const reducer = (namespace: string, type: string, payload: any) => {
    dvaParams.printLog && console.log("[reducer]", namespace, type, payload);
    return dvaParams.storeInstance.dispatch[namespace][type](payload);
};

export const effect = async (namespace: string, type: string, payload?: any) => {
    dvaParams.printLog && console.log("[effect]", namespace, type, payload);
    return await dvaParams.storeInstance.dispatch[namespace][type](payload);
};

/*------------------------- 基于axios实现的通用request，json格式，jwt校验 -------------------------*/
const requestParams: any = {
    serverHome: null,
    errorHanlder: null,
    printLog: false,
    extraHeaders: {},
    serverHomeIndex: 0,
};

export function initRequest(
    serverHome: string[],
    errorHanlder: Function,
    printLog = false,
    serverHomeIndex = 0,
) {
    requestParams.printLog = printLog;
    requestParams.serverHome = serverHome;
    requestParams.errorHanlder = errorHanlder;
    requestParams.serverHomeIndex = serverHomeIndex;
}

export function bindHeader(key: string, value: string) {
    requestParams.extraHeaders[key] = value;
}

export function bindJWTToken(token?: string) {
    if (token) {
        localStorage.setItem(dvaParams.token, token);
        requestParams.extraHeaders["Authorization"] = token;
    } else {
        localStorage.removeItem(dvaParams.token);
        delete requestParams.extraHeaders["Authorization"];
    }
}

export function requestGet(url: string, body?: any,): any {
    return request(url, { method: "GET", body }, null);
}

export function requestDelete(url: string) {
    return request(url, { method: "DELETE" }, null);
}

export function requestPost(url: string, body?: any,): any {
    return request(url, { method: "POST", body }, null);
}

export function requestPatch(url: string, body?: any,) {
    return request(url, { method: "PATCH", body }, null);
}

export function requestPut(url: string, body?: any,) {
    body && delete body.id;
    return request(url, { method: "PUT", body }, null);
}

export function requestFile(url: string, body: any = {}, method: 'GET' | 'POST' = 'GET') {
    if (!requestParams.extraHeaders['Authorization']) {
        const token = localStorage.getItem(dvaParams.token)
        token && (requestParams.extraHeaders['Authorization'] = token)
    }

    return new Promise((resolve, reject) => {
        // 添加url前缀
        if (url.indexOf('https://') === -1 && url.indexOf('http://') === -1) {
            url =
                requestParams.serverHome[requestParams.serverHomeIndex] +
                (url.indexOf("/") === 0 ? url.substr(1) : url);
        }

        const option: AxiosRequestConfig = {
            method,
            url,
            responseType: 'blob',
            headers: {
                ...requestParams.extraHeaders,
                Accept: "application/json",
                Pragma: "no-cache",
                "Cache-Control": "no-cache",
                Expires: 0,
                "Content-Type": "application/json; charset=utf-8",
            },
            params: body,
            data: body,
        };
        axios(option).then(res => {
            const blob = new Blob([res.data], { type: 'application/octet-stream;charset=utf-8' });
            const downloadElement = document.createElement('a');
            const href = window.URL.createObjectURL(blob);
            const contentDisposition = res.headers['content-disposition'];
            const patt = new RegExp("filename=([^;]+\\.[^\\.;]+);*");
            const result = patt.exec(contentDisposition!)!;
            const filename = decodeURI(result[1]);
            downloadElement.style.display = 'none';
            downloadElement.href = href;
            downloadElement.download = filename; //下载后文件名
            document.body.appendChild(downloadElement);
            downloadElement.click(); //点击下载
            document.body.removeChild(downloadElement); //下载完成移除元素
            window.URL.revokeObjectURL(href); //释放掉blob对象
            resolve(res.data)
        }).catch(e => {
            console.error('[catch]', e);
            const { status, data } = e?.response || {};
            status && data && requestParams.errorHanlder(status, data);
            reject(e)
        })
    })
}

function request(
    url: string,
    options: any,
    ContentType: any = null,
) {
    return new Promise((resolve, reject) => {
        const { method, body } = options;
        // 添加url前缀
        if (url.indexOf("https://") === -1 && url.indexOf("http://") === -1) {
            url =
                requestParams.serverHome[requestParams.serverHomeIndex] +
                (url.indexOf("/") === 0 ? url.substr(1) : url);
            if (!requestParams.extraHeaders["Authorization"]) {
                const token = localStorage.getItem(dvaParams.token);
                token && (requestParams.extraHeaders["Authorization"] = token);
            }
        }
        const option: any = {
            method,
            url,
            headers: {
                Accept: "application/json",
                Pragma: "no-cache",
                "Cache-Control": "no-cache",
                Expires: 0,
                "Content-Type": ContentType || "application/json; charset=utf-8",
                ...requestParams.extraHeaders,
            },
            // dataType: "json",
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

        axios(option)
            .then(({ data }) => {
                requestParams.printLog &&
                    console.log("[request]", method, url, body, data);
                resolve(data);
            })
            .catch((e) => {
                if (e.response) {
                    const { status, data } = e.response;
                    requestParams.errorHanlder(data?.message?.toString(), status);
                    if (401 == status) {
                        bindJWTToken();
                    }
                    resolve(null);
                } else {
                    throw e;
                }
            });
    });
}
