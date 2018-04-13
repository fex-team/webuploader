package io.zts.controller.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Setter
@Getter
@JsonInclude(value=JsonInclude.Include.NON_EMPTY)

public class CheckResponse implements Serializable {

    private boolean isExists;
}
