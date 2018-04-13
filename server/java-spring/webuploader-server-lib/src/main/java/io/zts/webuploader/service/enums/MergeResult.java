package io.zts.webuploader.service.enums;

/**
 * 文件合并结果枚举
 *
 * @author songdragon
 */
public enum MergeResult {

    /**
     * 合并文件成功
     */
    SUCCESS,
    /**
     * 文件分片数目错误
     */
    CHUNKNUM_FAIL,
    /**
     * IO异常
     */
    IO_EXEPTION,
    /**
     * 未知错误
     */
    UNKONW_ERRORS
    ;
}
