package io.zts.webuploader.service;

/**
 * 自定义存储规则生成。用于生成上传目录和最终文件名。
 *
 * @author songdragon
 */
public interface CustomStorageRule {

    /**
     * 生成最终文件存储目录名
     * @return
     */
    public String generateDirectoryName();

    /**
     * 生成文件名称
     * @return
     */
    public String generateFilename();
}
