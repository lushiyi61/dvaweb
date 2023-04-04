/**
 * yarn add cos-js-sdk-v5 moment
 */

import * as COS from 'cos-js-sdk-v5';
import { EFunctionKey, bindingModel, reducers } from './dva';
import { requestGet } from './request';

enum TmpKey {
    EUploadBody = 'EUploadBody',
    EUploadFile = 'EUploadFile',
}
export interface IFileInfo {
    url: string,
    name: string,
    size: number,
}
export const NFile = { ...EFunctionKey, ...TmpKey, Name: 'NFile' }
bindingModel({
    namespace: NFile.Name,
    state: {
        Bucket: '示例:c1-1307232071',
        Region: '示例:ap-shanghai',
        urlBefore: '示例:c1-1307232071.cos.ap-shanghai.myqcloud.com',
        allowPrefix: 'xz1/uploads/',//上传位置
        urlAfter: '示例:https://c1.orbitsoft.cn',
        expiredTime: null,
        cos: null,
    },
    reducers,
    effects: {
        //获取上传权限
        async [NFile.EGet]({ payload }: any, { reducer, select }: any) {
            const { expiredTime } = select(NFile.Name)
            if (expiredTime && expiredTime > Date.now() / 1000) {
                return select(NFile.Name)
            }
            const response = await requestGet('credential', payload)
            if (response == null) throw '获取证书失败'
            const {
                Bucket,
                Region,
                allowPrefix,
                urlBefore,
                urlAfter,
                credential: {
                    expiredTime: ExpiredTime,
                    startTime: StartTime,
                    credentials: { sessionToken: XCosSecurityToken, tmpSecretId: TmpSecretId, tmpSecretKey: TmpSecretKey },
                },
            } = response

            try {
                const cos = new COS({
                    getAuthorization: ($: any, callback: any) => {
                        callback({
                            TmpSecretId,
                            TmpSecretKey,
                            XCosSecurityToken,
                            ExpiredTime,
                            StartTime,
                        })
                    }
                })
                reducer(NFile.RSetState, { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos, expiredTime: ExpiredTime })
                return { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos, expiredTime: ExpiredTime }
            } catch (error) {
                console.log('error:', error);
                throw error
            }
        },

        /**
         * 上传文件对象（单个文件上传）
         * @returns 
         */
        async [NFile.EUploadBody]({ payload }: { payload: { file: File, onProgress: Function } }, { effect }: any) {
            const { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos } = await effect(NFile.EGet, {})
            const { file, onProgress } = payload
            const uid = Date.now() + Math.random().toString().substring(3, 6)
            const filename = allowPrefix + uid + file.name.substring(file.name.lastIndexOf('.'))
            try {
                return await new Promise((resolve, reject) => {
                    cos?.sliceUploadFile(
                        {
                            Bucket,
                            Region,
                            Key: filename,
                            Body: file,
                            onProgress,
                        },
                        function (err: any, data: { Location: any; }) {
                            if (err) {
                                reject(null)
                            } else {
                                const { Location } = data
                                const url = Location.replace(urlBefore, urlAfter)
                                resolve({ url, name: file.name, size: file.size })
                            }
                        }
                    )
                })
            } catch (err) {
                console.log('err: ', err)
                return null
            }
        },
        async [NFile.EUploadFile]({ payload }: { payload: { filePath: string, onProgress: Function } }, { effect }: any) {
            const { Bucket, Region, allowPrefix, urlBefore, urlAfter, cos } = await effect(NFile.EGet, {})
            const { filePath, onProgress } = payload
            const uid = Date.now() + Math.random().toString().substring(3, 6)
            const filename = allowPrefix + uid + filePath.substring(filePath.lastIndexOf('.'))
            try {
                return await new Promise((resolve, reject) => {
                    cos?.postObject({
                        Bucket: Bucket,
                        Region: Region,
                        Key: filename,
                        FilePath: filePath,
                        onProgress,
                    },
                        function (err: any, data: { Location: any; }) {
                            if (err) {
                                reject(null)
                            } else {
                                const { Location } = data
                                console.log('data:', data);
                                const url = Location.replace(urlBefore, urlAfter)
                                resolve({ url, name: filePath.substring(filePath.lastIndexOf('/')), size: 0 })
                            }
                        });
                })
            } catch (err) {
                console.log('err: ', err)
                return null
            }
        },
    }
})