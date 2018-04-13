package io.zts.controller.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@JsonInclude(value=JsonInclude.Include.NON_EMPTY)
public class MergeResponse implements Serializable {

    private String fileName;
    private String finalName;
    private String path;
}
