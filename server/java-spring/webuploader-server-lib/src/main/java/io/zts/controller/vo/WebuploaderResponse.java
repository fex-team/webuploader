package io.zts.controller.vo;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Setter
@Getter
public class WebuploaderResponse<T extends Serializable> implements Serializable {

    private T content;

    private int code;

    public static WebuploaderResponse SUCC(Serializable content){
        WebuploaderResponse response=new WebuploaderResponse();
        response.setContent(content);
        response.setCode(0);
        return response;
    }

    public static WebuploaderResponse FAIL(Serializable content){
        WebuploaderResponse response=SUCC(content);
        response.setCode(-1);
        return response;
    }
}
