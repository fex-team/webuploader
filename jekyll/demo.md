---
layout: post
title: 演示
name: Demo
group: 'nav'
weight : 4
hideTitle: true
styles:
  - /css/webuploader.css
  - /css/demo.css
scripts:
  - /js/webuploader.js
  - /js/demo.js
---

<div id="container" class="container">
    <!--头部，相册选择和格式选择-->

    <div id="uploader">
        <div class="queueList">
            <div id="dndArea" class="placeholder">
                <div id="filePicker"></div>
                <p>或将照片拖到这里，单次最多可选300张</p>
            </div>
        </div>
        <div class="statusBar" style="display:none;">
            <div class="progress">
                <span class="text">0%</span>
                <span class="percentage"></span>
            </div><div class="info"></div>
            <div class="btns">
                <div id="filePicker2"></div><div class="uploadBtn">开始上传</div>
            </div>
        </div>
    </div>
</div>


