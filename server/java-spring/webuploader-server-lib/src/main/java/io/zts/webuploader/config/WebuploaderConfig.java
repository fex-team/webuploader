package io.zts.webuploader.config;

/**
 * Webuploader 配置接口
 */
public interface WebuploaderConfig {

    /**
     * 临时文件存储目录
     * @return
     */
    public String getTempDir();

    /**
     * 上传文件目录
     * @return
     */
    public String getUploaderDir();

}
