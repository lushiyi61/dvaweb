/*------------------------- 基于rematch实现的类dva框架 -------------------------*/

import { useSelector } from "react-redux";
import { init, createModel } from "@rematch/core";
import loadingPlugin from "@rematch/loading";

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
export const reducers = {
    [EFunctionKey.RSetState](state: any, payload: any) {
        return { ...state, ...payload }
    }
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
