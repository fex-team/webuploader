---
layout: default
title: Web Uploader
---

<!-- Main jumbotron for a primary marketing message or call to action -->
<div class="jumbotron">
    <div class="container">
        <h1>Web Uploader</h1>
        <p>WebUploader是由Baidu WebFE(FEX)团队开发的一个简单的以HTML5为主，FLASH为辅的现代文件上传组件。在现代的浏览器里面能充分发挥HTML5的优势，同时又不摒弃主流IE浏览器，沿用原来的FLASH运行时，兼容IE6+，iOS 6+, android 4+。两套运行时，同样的调用方式，可供用户任意选用。</p>

        <p>采用大文件分片并发上传，极大的提高了文件上传效率。</p>
        <p>
            <a class="btn btn-primary btn-lg" href="{{site.baseurl}}/getting-started.html" role="button">快速开始</a>
            &nbsp;&nbsp;
            <a class="btn btn-success btn-lg" href="{{site.baseurl}}/download.html" role="button">&nbsp;&nbsp;&nbsp;&nbsp;下载&nbsp;&nbsp;&nbsp;&nbsp;</a>
        </p>
        <div class="github-btns">
            <a class="travis" href="https://travis-ci.org/fex-team/webuploader"><img alt="" src="https://secure.travis-ci.org/fex-team/webuploader.png?branch=master" /></a>

            <iframe src="http://ghbtns.com/github-btn.html?user=fex-team&repo=webuploader&type=watch&count=true"
  allowtransparency="true" frameborder="0" scrolling="0" width="100" height="20"></iframe>
            <iframe src="http://ghbtns.com/github-btn.html?user=fex-team&repo=webuploader&type=fork&count=true"
  allowtransparency="true" frameborder="0" scrolling="0" width="100" height="20"></iframe>
        </div>

    </div>
</div>


<div class="fetature container">
    <div class="row">
        <div class="col-6 col-sm-6 col-lg-4">
            <h2>分片、并发</h2>
            <p>分片与并发结合，将一个大文件分割成多块，并发上传，极大地提高大文件的上传速度。</p>

            <p>当网络问题导致传输错误时，只需要重传出错分片，而不是整个文件。另外分片传输能够更加实时的跟踪上传进度。</p>
        </div>


        <div class="col-6 col-sm-6 col-lg-4">
            <h2>预览、压缩</h2>
            <p>支持常用图片格式jpg,jpeg,gif,bmp,png预览与压缩，节省网络数据传输。</p>

            <p>解析jpeg中的meta信息，对于各种orientation做了正确的处理，同时压缩后上传保留图片的所有原始meta数据。</p>
        </div>

        <div class="col-6 col-sm-6 col-lg-4">
            <h2>多途径添加文件</h2>
            <p>支持文件多选，类型过滤，拖拽(文件&amp;文件夹)，图片粘贴功能。</p>
            <p>粘贴功能主要体现在当有图片数据在剪切板中时（截屏工具如QQ(Ctrl + ALT + A), 网页中右击图片点击复制），Ctrl + V便可添加此图片文件。</p>
        </div>

        <div class="col-6 col-sm-6 col-lg-4">
            <h2>HTML5 &amp; FLASH</h2>
            <p>兼容主流浏览器，接口一致，实现了两套运行时支持，用户无需关心内部用了什么内核。</p>
            <p>同时Flash部分没有做任何UI相关的工作，方便不关心flash的用户扩展和自定义业务需求。</p>
        </div>

        <div class="col-6 col-sm-6 col-lg-4">
            <h2>MD5秒传</h2>
            <p>当文件体积大、量比较多时，支持上传前做文件md5值验证，一致则可直接跳过。</p>
            <p>如果服务端与前端统一修改算法，取段md5，可大大提升验证性能，耗时在20ms左右。</p>
        </div>



        <div class="col-6 col-sm-6 col-lg-4">
            <h2>易扩展、可拆分</h2>
            <p>采用可拆分机制, 将各个功能独立成了小组件，可自由搭配。</p>
            <p>采用AMD规范组织代码，清晰明了，方便高级玩家扩展。</p>
        </div>

    </div>
    <!--/row-->
</div>