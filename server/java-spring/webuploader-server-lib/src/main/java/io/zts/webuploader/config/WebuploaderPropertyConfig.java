package io.zts.webuploader.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Webuploade配置实现，使用property文件
 *
 * @author  songdragon
 */
@Component
public class WebuploaderPropertyConfig implements WebuploaderConfig {

    @Value("${tempDir:''}")
    private String tempDir;

    @Value("${uploadDir:''}")
    private String uploadDir;

    @Override
    public String getTempDir() {
        checkNotEmpty(tempDir,"tempDir");
        return tempDir;
    }

    @Override
    public String getUploaderDir() {
        checkNotEmpty(uploadDir,"uploadDir");
        return uploadDir;
    }

    /**
     * 检查字符串str非空。如果为空，抛出异常
     * @param str 待检查字符串
     * @param configName 配置项名称
     * @throws ConfigException
     */
    private void checkNotEmpty(String str, String configName) throws ConfigException{
        if(!StringUtils.hasLength(str)){
            throw new ConfigException(configName+" is empty!");
        }

    }
}
