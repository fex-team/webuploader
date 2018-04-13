package io.zts.webuploader.service;

import io.zts.controller.vo.MergeResponse;
import io.zts.webuploader.config.WebuploaderConfig;
import io.zts.webuploader.service.enums.MergeResult;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.commons.CommonsMultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * 上传服务实现.
 *
 * @author songdragon
 */
@Slf4j
@Service
public class WebuploaderService {

    @Autowired
    private WebuploaderConfig webuploaderConfig;

    @Autowired(required = false)
    private CustomStorageRule customStorageRule;

    /**
     * 保存单一文件分片
     *
     * @param fileName
     * @param file
     * @param chunk
     * @param fileMd5
     * @throws IOException
     */
    public void saveOneChunk(final String fileName, CommonsMultipartFile file, final int chunk, final String fileMd5) throws IOException {
        Assert.hasLength(fileName, "文件名应为非空字符串!");
        Assert.hasLength(fileMd5, "文件MD5应为非空字符串!");

        Path tempDir = getTempDir(fileMd5);
        log.debug("创建文件临时存储目录:{}", tempDir.toAbsolutePath().toString());
        Path tempFile = Paths.get(tempDir.toAbsolutePath().toString(), buildTempFilename(fileName, chunk));
        log.debug("临时文件:{}", tempFile.toAbsolutePath().toString());
        file.transferTo(tempFile.toFile());
        log.info("临时文件{}上传成功!", tempFile.toAbsolutePath().toString());
    }

    /**
     * 合并属于fileName的所有分片
     * @param fileName
     * @param chunk
     * @param fileMd5
     * @return
     */
    public MergeResult mergeChunks(final String fileName, final int chunk, final String fileMd5, MergeResponse bizResponse) {
        Assert.hasLength(fileName);
        Assert.hasLength(fileMd5);

        Path tempDir = getTempDir(fileMd5);

        try {
            DirectoryStream<Path> files = Files.newDirectoryStream(tempDir);
            List<File> partFiles = new ArrayList<>();
            for (Path partFile : files) {
                partFiles.add(partFile.toFile());
            }

            if (partFiles.size() != chunk) {
                return MergeResult.CHUNKNUM_FAIL;
            }

            Path uploadPath = this.getUploadDir();
            String finalName = this.getFinalName(fileName);

            bizResponse.setFinalName(finalName);
            bizResponse.setPath(uploadPath.toAbsolutePath().toString());

            Path finalFilePath = Paths.get(uploadPath.toAbsolutePath().toString(), finalName);

            try (FileOutputStream finalFileStream = new FileOutputStream(finalFilePath.toFile(), true)) {
                for (int i = 0; i < chunk; i++) {
                    String tempFileName = this.buildTempFilename(fileName, i);
                    FileUtils.copyFile(new File(tempDir.toAbsolutePath().toString(), tempFileName), finalFileStream);
                }
                FileUtils.deleteDirectory(tempDir.toFile());
                return MergeResult.SUCCESS;
            } catch (Exception e) {
                log.error("", e);
            }


        } catch (IOException e) {
            log.error("", e);
            return MergeResult.IO_EXEPTION;
        } catch (Exception e) {
            log.error("", e);
        }

        return MergeResult.UNKONW_ERRORS;
    }

    /**
     * 检查分片是否完成上传
     * @param fileName
     * @param chunkNo
     * @param chunkSize
     * @param fileMd5
     * @return true, 上传完成；false，未完成
     */
    public boolean checkChunk(final String fileName, final int chunkNo, final long chunkSize, final String fileMd5){
        Path tempDir = getTempDir(fileMd5);
        String tempFileName = this.buildTempFilename(fileName, chunkNo);
        Path chunkPath=Paths.get(tempDir.toAbsolutePath().toString(),tempFileName);
        File chunkFile=chunkPath.toFile();

        if(chunkFile.exists() && chunkFile.length()==chunkSize){
            return true;
        }

        return false;
    }

    /**
     * 获取临时目录
     *
     * @return
     */
    private Path getTempDir(String md5) {
        String tempDir = this.webuploaderConfig.getTempDir();
        Path path = Paths.get(tempDir, md5);
        File file = path.toFile();
        if (!file.exists()) {
            file.mkdirs();
        }
        return path;
    }

    /**
     * 生成临时文件名
     *
     * @param fileName
     * @param chunk
     * @return
     */
    private String buildTempFilename(final String fileName, final int chunk) {
        return fileName + "_" + chunk + ".tmppart";
    }

    /**
     * 获取最终存储目录路径
     *
     * @return
     */
    private Path getUploadDir() {
        String uploadPath = this.webuploaderConfig.getUploaderDir();
        String dirName = null;
        if (this.customStorageRule != null) {
            dirName = this.customStorageRule.generateDirectoryName();
        }

        File uploadDirectory=Paths.get(uploadPath).toFile();
        if(!uploadDirectory.exists()){
            uploadDirectory.mkdirs();
        }
        if(StringUtils.isEmpty(dirName)){
            return Paths.get(uploadPath);
        }
        return Paths.get(uploadPath, dirName);
    }

    /**
     * 获取最终存储的文件名
     *
     * @param fileName
     * @return
     */
    private String getFinalName(String fileName) {
        if (this.customStorageRule != null) {
            return this.customStorageRule.generateFilename();
        }
        return fileName;
    }
}
