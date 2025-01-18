import { EventSourceMessage } from "@microsoft/fetch-event-source";
interface IParams {
    serverHome: string[];
    errorHandler: Function;
    printLog: boolean;
    extraHeaders: any;
    serverHomeIndex: number;
    token: string;
}
export declare function initRequest(serverHome: string[], errorHandler: Function, printLog?: boolean, serverHomeIndex?: number, token?: string): void;
export declare function bindHeader(key: string, value: string): void;
export declare function getUrl(url?: string, index?: number): string;
export declare function requestSse(url: string, cb: {
    onopen?: (response: Response) => Promise<void>;
    onmessage?: (ev: EventSourceMessage) => void;
    onclose?: () => void;
    onerror?: (err: any) => number | null | undefined | void;
}, ctrl?: AbortController, body?: any, serverHomeIndex?: number): void;
export declare function requestGet(url: string, body?: any, serverHomeIndex?: number): Promise<any>;
export declare function requestDelete(url: string, serverHomeIndex?: number): Promise<any>;
export declare function requestPost(url: string, body?: any, serverHomeIndex?: number): Promise<any>;
export declare function requestPatch(url: string, body?: any, serverHomeIndex?: number): Promise<any>;
export declare function requestPut(url: string, body?: any, serverHomeIndex?: number): Promise<any>;
export declare function uploadFile(url: string, body: FormData, serverHomeIndex?: number): Promise<any>;
export declare function requestFile(url: string, body?: any, method?: 'GET' | 'POST', serverHomeIndex?: number): Promise<unknown>;
export declare let bindJWTToken: (token?: string) => void;
export declare function updateBindJWTToken(f: (token?: string) => void): void;
export declare function updateRequest(f: (url: string, options: any, requestParams: IParams) => Promise<any>): void;
export {};
