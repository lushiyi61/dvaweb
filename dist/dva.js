"use strict";
/*------------------------- 基于rematch实现的类dva框架 -------------------------*/
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
exports.effect = exports.reducer = exports.useConnect = exports.useLoading = exports.initModels = exports.bindingModel = exports.reducers = exports.EFunctionKey = void 0;
const react_redux_1 = require("react-redux");
const core_1 = require("@rematch/core");
const loading_1 = require("@rematch/loading");
// 默认枚举
var EFunctionKey;
(function (EFunctionKey) {
    EFunctionKey["RSetState"] = "RSetState";
    EFunctionKey["EGet"] = "EGet";
    EFunctionKey["EGetOne"] = "EGetOne";
    EFunctionKey["EPost"] = "EPost";
    EFunctionKey["EPostBatch"] = "EPostBatch";
    EFunctionKey["EDelete"] = "EDelete";
    EFunctionKey["EPut"] = "EPut";
    EFunctionKey["EPutBatch"] = "EPutBatch";
})(EFunctionKey || (exports.EFunctionKey = EFunctionKey = {}));
exports.reducers = {
    [EFunctionKey.RSetState](state, payload) {
        return Object.assign(Object.assign({}, state), payload);
    }
};
// dva参数
const dvaParams = { storeInstance: null, printLog: false };
// 所有的model
const modelArray = [];
function bindingModel(model) {
    modelArray.push(model);
}
exports.bindingModel = bindingModel;
const initModels = (printLog = false) => {
    if (dvaParams.storeInstance)
        return dvaParams.storeInstance;
    console.log("modelArray size ==>", modelArray.length);
    dvaParams.printLog = printLog;
    const models = {};
    for (let model of modelArray) {
        models[model.namespace] = (0, core_1.createModel)()(Object.assign(Object.assign({}, model), { effects: (dispatch) => {
                let newEffects = {};
                let namespace = model.namespace;
                for (let key in model.effects) {
                    newEffects[key] = (payload, rootState) => __awaiter(void 0, void 0, void 0, function* () {
                        return yield model.effects[key]({ state: rootState[namespace], payload }, {
                            reducer: (...args) => {
                                if (args.length <= 2) {
                                    args.unshift(namespace);
                                }
                                dvaParams.printLog &&
                                    console.log("[reducer]", args[0], args[1], args[2]);
                                dispatch[args[0]][args[1]](args[2]);
                            },
                            select: (namespace2) => rootState[namespace2],
                            effect: (...args) => __awaiter(void 0, void 0, void 0, function* () {
                                if (args.length <= 2) {
                                    args.unshift(namespace);
                                }
                                dvaParams.printLog &&
                                    console.log("[effect]", args[0], args[1], args[2]);
                                return yield dispatch[args[0]][args[1]](args[2]);
                            }),
                        });
                    });
                }
                return newEffects;
            } }));
    }
    dvaParams.storeInstance = (0, core_1.init)({
        models,
        plugins: [(0, loading_1.default)({ type: "full" })],
    });
    return dvaParams.storeInstance;
};
exports.initModels = initModels;
const useLoading = (namespace, effects) => {
    return (0, react_redux_1.useSelector)((store) => {
        return effects ? store.loading.effects[namespace][effects] : store.loading.models[namespace];
    });
};
exports.useLoading = useLoading;
const useConnect = (namespace) => {
    return (0, react_redux_1.useSelector)((store) => {
        return store[namespace];
    });
};
exports.useConnect = useConnect;
const reducer = (namespace, type, payload) => {
    dvaParams.printLog && console.log("[reducer]", namespace, type, payload);
    return dvaParams.storeInstance.dispatch[namespace][type](payload);
};
exports.reducer = reducer;
const effect = (namespace, type, payload) => __awaiter(void 0, void 0, void 0, function* () {
    dvaParams.printLog && console.log("[effect]", namespace, type, payload);
    return yield dvaParams.storeInstance.dispatch[namespace][type](payload);
});
exports.effect = effect;
