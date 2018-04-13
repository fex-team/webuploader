package io.zts.controller;

import io.zts.controller.vo.CheckResponse;
import io.zts.controller.vo.MergeResponse;
import io.zts.controller.vo.UploadResponse;
import io.zts.controller.vo.WebuploaderResponse;
import io.zts.webuploader.service.WebuploaderService;
import io.zts.webuploader.service.enums.MergeResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.commons.CommonsMultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/webuploader")
@Slf4j
public class WebuploaderController {

    @Autowired
    private WebuploaderService uploadService;


    @RequestMapping(value = "/check",produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    public WebuploaderResponse<CheckResponse> checkChunk(
            @RequestParam(name = "fileName") String filename,
            @RequestParam(name="fileMd5",required = false) String fileMd5,
            @RequestParam(name="chunkSize") long chunkSize,
            @RequestParam(name="chunk") int chunkNum
    ){
        boolean checkResult = this.uploadService.checkChunk(filename, chunkNum, chunkSize, fileMd5);

        CheckResponse bizResponse=new CheckResponse();
        bizResponse.setExists(checkResult);
        return WebuploaderResponse.SUCC(bizResponse);
    }

    @RequestMapping(value = "/upload",produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    public WebuploaderResponse<UploadResponse> uploadChunk(
            @RequestParam("file") CommonsMultipartFile file,
            @RequestParam(value = "name") String fileName,
            @RequestParam(value = "chunk", required = false, defaultValue = "0") int chunk,
            @RequestParam("fileMd5") String fileMd5){

        UploadResponse bizResponse=new UploadResponse();
        try {
            this.uploadService.saveOneChunk(fileName,file,chunk,fileMd5);
            bizResponse.setUploaded(true);
            return WebuploaderResponse.SUCC(bizResponse);
        } catch (Exception e) {
            log.error("",e);
            bizResponse.setUploaded(false);
            return WebuploaderResponse.FAIL(bizResponse);
        }


    }

    @RequestMapping(value = "/merge",produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    public WebuploaderResponse<MergeResponse> mergeChunks(
            @RequestParam(name = "fileName") String filename,
            @RequestParam(name="fileMd5",required = false) String fileMd5,
            @RequestParam(name="chunks") int chunk){

        MergeResponse bizResponse=new MergeResponse();
        bizResponse.setFileName(filename);
        MergeResult result = this.uploadService.mergeChunks(filename, chunk, fileMd5, bizResponse);
        if(result==MergeResult.SUCCESS){

            return WebuploaderResponse.SUCC(bizResponse);
        }

        log.error("Merge Result={}",result);
        return WebuploaderResponse.FAIL(bizResponse);
    }
}
