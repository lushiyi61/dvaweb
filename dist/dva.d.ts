export declare enum EFunctionKey {
    RSetState = "RSetState",
    EGet = "EGet",
    EGetOne = "EGetOne",
    EPost = "EPost",
    EPostBatch = "EPostBatch",
    EDelete = "EDelete",
    EPut = "EPut",
    EPutBatch = "EPutBatch"
}
export declare const reducers: {
    RSetState(state: any, payload: any): any;
};
export declare function bindingModel(model: any): void;
export declare const initModels: (printLog?: boolean) => any;
export declare const useLoading: (namespace: string, effects?: string) => any;
export declare const useConnect: (namespace: string) => any;
export declare const reducer: (namespace: string, type: string, payload: any) => any;
export declare const effect: (namespace: string, type: string, payload?: any) => Promise<any>;
