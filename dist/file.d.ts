/**
 * yarn add cos-js-sdk-v5
 */
import { EFunctionKey } from './dva';
declare enum TmpKey {
    EUploadBody = "EUploadBody",
    EUploadFile = "EUploadFile"
}
export interface IFileInfo {
    url: string;
    name: string;
    size: number;
}
export declare const NFile: {
    Name: string;
    EUploadBody: TmpKey.EUploadBody;
    EUploadFile: TmpKey.EUploadFile;
    RSetState: EFunctionKey.RSetState;
    EGet: EFunctionKey.EGet;
    EGetOne: EFunctionKey.EGetOne;
    EPost: EFunctionKey.EPost;
    EPostBatch: EFunctionKey.EPostBatch;
    EDelete: EFunctionKey.EDelete;
    EPut: EFunctionKey.EPut;
    EPutBatch: EFunctionKey.EPutBatch;
};
export {};
