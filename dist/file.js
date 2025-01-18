"use strict";
/**
 * yarn add cos-js-sdk-v5
 */
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
exports.NFile = void 0;
const COS = require("cos-js-sdk-v5");
const dva_1 = require("./dva");
const request_1 = require("./request");
var TmpKey;
(function (TmpKey) {
    TmpKey["EUploadBody"] = "EUploadBody";
    TmpKey["EUploadFile"] = "EUploadFile";
})(TmpKey || (TmpKey = {}));
exports.NFile = Object.assign(Object.assign(Object.assign({}, dva_1.EFunctionKey), TmpKey), { Name: 'NFile' });
(0, dva_1.bindingModel)({
    namespace: exports.NFile.Name,
    state: {
        Bucket: '示例:c1-1307232071',
        Region: '示例:ap-shanghai',
        urlBefore: '示例:c1-1307232071.cos.ap-shanghai.myqcloud.com',
        allowPrefix: 'xz1/uploads/', //上传位置
        urlAfter: '示例:https://c1.orbitsoft.cn',
        expiredTime: null,
        cos: null,
    },
    reducers: dva_1.reducers,
    effects: {
        //获取上传权限
        [exports.NFile.EGet](_a, _b) {
            return __awaiter(this, arguments, void 0, function* ({ payload }, { reducer, select }) {
                const { expiredTime } = select(exports.NFile.Name);
                if (expiredTime && expiredTime > Date.now() / 1000) {
                    return select(exports.NFile.Name);
                }
                const response = yield (0, request_1.requestGet)('credential', payload);
                if (response == null)
                    throw '获取证书失败';
                const { Bucket, Region, allowPrefix, urlBefore, urlAfter, credential: { expiredTime: ExpiredTime, startTime: StartTime, credentials: { sessionToken: XCosSecurityToken, tmpSecretId: TmpSecretId, tmpSecretKey: TmpSecretKey }, }, } = response;
                try {
                    const cos = new COS({
                        getAuthorization: ($, callback) => {
                            callback({
                                TmpSecretId,
                                TmpSecretKey,
                                XCosSecurityToken,
                                ExpiredTime,
                                StartTime,
                            });
                        }
                    });
                    reducer(exports.NFile.RSetState, { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos, expiredTime: ExpiredTime });
                    return { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos, expiredTime: ExpiredTime };
                }
                catch (error) {
                    console.log('error:', error);
                    throw error;
                }
            });
        },
        /**
         * 上传文件对象（单个文件上传）
         * @returns
         */
        [exports.NFile.EUploadBody](_a, _b) {
            return __awaiter(this, arguments, void 0, function* ({ payload }, { effect }) {
                const { file, onProgress, onSuccess, onError } = payload;
                const { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos } = yield effect(exports.NFile.EGet, {});
                const uid = Date.now() + Math.random().toString().substring(3, 6);
                const filename = allowPrefix + uid + file.name.substring(file.name.lastIndexOf('.'));
                return yield new Promise((resolve, reject) => {
                    cos === null || cos === void 0 ? void 0 : cos.sliceUploadFile({
                        Bucket,
                        Region,
                        Key: filename,
                        Body: file,
                        onProgress,
                    }, function (err, data) {
                        if (err) {
                            onError && onError(err);
                            console.log('err:', err);
                            resolve(null);
                        }
                        else {
                            const { Location } = data;
                            const url = Location.replace(urlBefore, urlAfter);
                            onSuccess && onSuccess({ url, name: file.name, size: file.size });
                            resolve({ url, name: file.name, size: file.size });
                        }
                    });
                });
            });
        },
        [exports.NFile.EUploadFile](_a, _b) {
            return __awaiter(this, arguments, void 0, function* ({ payload }, { effect }) {
                const { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos } = yield effect(exports.NFile.EGet, {});
                const { filePath, onProgress } = payload;
                const uid = Date.now() + Math.random().toString().substring(3, 6);
                const filename = allowPrefix + uid + filePath.substring(filePath.lastIndexOf('.'));
                try {
                    return yield new Promise((resolve, reject) => {
                        cos === null || cos === void 0 ? void 0 : cos.postObject({
                            Bucket: Bucket,
                            Region: Region,
                            Key: filename,
                            FilePath: filePath,
                            onProgress,
                        }, function (err, data) {
                            if (err) {
                                reject(null);
                            }
                            else {
                                const { Location } = data;
                                console.log('data:', data);
                                const url = Location.replace(urlBefore, urlAfter);
                                resolve({ url, name: filePath.substring(filePath.lastIndexOf('/')), size: 0 });
                            }
                        });
                    });
                }
                catch (err) {
                    console.log('err: ', err);
                    return null;
                }
            });
        },
    }
});
