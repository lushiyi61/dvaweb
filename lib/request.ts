import axios, { AxiosRequestConfig } from "axios";

/*------------------------- 基于axios实现的通用request，json格式，jwt校验 -------------------------*/
interface IParams {
    serverHome: string[],
    errorHandler: Function,
    printLog: boolean,
    extraHeaders: any,
    serverHomeIndex: number,
    token: string,
}

const requestParams: IParams = {
    serverHome: [],
    errorHandler: () => { },
    printLog: false,
    extraHeaders: {},
    serverHomeIndex: 0,
    token: "Token",
};

export function initRequest(
    serverHome: string[],
    errorHandler: Function,
    printLog = false,
    serverHomeIndex = 0,
    token = "Token",
) {
    requestParams.printLog = printLog;
    requestParams.serverHome = serverHome;
    requestParams.errorHandler = errorHandler;
    requestParams.serverHomeIndex = serverHomeIndex;
    requestParams.token = token;
}

export function bindHeader(key: string, value: string) {
    requestParams.extraHeaders[key] = value;
}

export function getUrl(url?: string, index: number = -1): string {
    if (!url) {
        return requestParams.serverHome[requestParams.serverHomeIndex]
    }
    // 添加url前缀
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        return requestParams.serverHome[index >= 0 ? index : requestParams.serverHomeIndex] + url;
    }
    return url
}

export function requestGet(url: string, body?: any, serverHomeIndex?: number) {
    return request(getUrl(url, serverHomeIndex), { method: "GET", body }, requestParams);
}

export function requestDelete(url: string, serverHomeIndex?: number) {
    return request(getUrl(url, serverHomeIndex), { method: "DELETE" }, requestParams);
}

export function requestPost(url: string, body?: any, serverHomeIndex?: number) {
    return request(getUrl(url, serverHomeIndex), { method: "POST", body }, requestParams);
}

export function requestPatch(url: string, body?: any, serverHomeIndex?: number) {
    return request(getUrl(url, serverHomeIndex), { method: "PATCH", body }, requestParams);
}

export function requestPut(url: string, body?: any, serverHomeIndex?: number) {
    body && delete body.id;
    return request(getUrl(url, serverHomeIndex), { method: "PUT", body }, requestParams);
}

export function uploadFile(url: string, body: any = {}, serverHomeIndex?: number,): Promise<any> {
    requestParams.extraHeaders['Content-Type'] = 'application/form-data'
    return request(getUrl(url, serverHomeIndex), { method: "POST", body }, requestParams);
}

export function requestFile(
    url: string,
    body: any = {},
    method: 'GET' | 'POST' = 'GET',
    serverHomeIndex?: number,
) {
    if (!requestParams.extraHeaders["Authorization"]) {
        const token = localStorage.getItem(requestParams.token);
        token && (requestParams.extraHeaders["Authorization"] = token);
    }
    url = getUrl(url, serverHomeIndex)
    return new Promise((resolve, reject) => {
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
            status && data && requestParams.errorHandler(status, data);
            reject(e)
        })
    })
}

export let bindJWTToken = (token?: string) => {
    if (token) {
        localStorage.setItem(requestParams.token, token);
        requestParams.extraHeaders["Authorization"] = token;
    } else {
        localStorage.removeItem(requestParams.token);
        delete requestParams.extraHeaders["Authorization"];
    }
}

let request = (
    url: string,
    options: any,
    requestParams: IParams,
): Promise<any> => {
    const { method, body } = options;

    if (!requestParams.extraHeaders["Authorization"]) {
        const token = localStorage.getItem(requestParams.token);
        token && (requestParams.extraHeaders["Authorization"] = token);
    }
    const option: AxiosRequestConfig = {
        method,
        url,
        headers: {
            Accept: "application/json",
            Pragma: "no-cache",
            Expires: 0,
            "Cache-Control": "no-cache",
            "Content-Type": "application/json; charset=utf-8",
            ...requestParams.extraHeaders,
        },
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
        axios(option)
            .then(({ data }) => {
                requestParams.printLog &&
                    console.log("[request]", method, url, body, data);
                resolve(data);
            })
            .catch((e) => {
                if (e.response) {
                    const { status, data } = e.response;
                    requestParams.errorHandler(data?.message?.toString(), status);
                    if (401 == status) bindJWTToken();
                } else {
                    requestParams.errorHandler("网络异常", 500);
                }
                resolve(null);
            });
    });
}

export function updateBindJWTToken(f: (token?: string) => void) {
    bindJWTToken = f
}

export function updateRequest(f: (
    url: string,
    options: any,
    requestParams: IParams,) => Promise<any>) {
    request = f
}