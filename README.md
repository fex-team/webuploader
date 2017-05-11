不再对使用问题进行答复，如果有希望的功能改进或者bugfix可以提交PR
==================================================


# WebUploader 文件上传 [![Build Status](https://secure.travis-ci.org/fex-team/webuploader.png?branch=master)](http://travis-ci.org/fex-team/webuploader) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

WebUploader是一个简单的以HTML5为主，FLASH为辅的现代文件上传组件。在现代的浏览器里面能充分发挥HTML5的优势，同时又不摒弃主流IE浏览器，延用原来的FLASH运行时，兼容IE6+，Andorid 4+，IOS 6+。两套运行时，同样的调用方式，可供用户任意选用。

支持大文件分片并发上传，极大的提高了文件上传效率。

- 官网： http://fex.baidu.com/webuploader/
- ISSUES：https://github.com/fex-team/webuploader/issues

## 支持

**代码肯定存在很多不足和需要优化的地方，欢迎大家提交 [pr](https://help.github.com/articles/using-pull-requests)。**感谢**以下代码贡献者, 排名不分先后。**

[@zensh](https://github.com/zensh)，[@ushelp](https://github.com/ushelp)，[@duanlixin](https://github.com/duanlixin)。

## 特性

### 分片、并发
分片与并发结合，将一个大文件分割成多块，并发上传，极大地提高大文件的上传速度。

当网络问题导致传输错误时，只需要重传出错分片，而不是整个文件。另外分片传输能够更加实时的跟踪上传进度。

### 预览、压缩

支持常用图片格式jpg,jpeg,gif,bmp,png预览与压缩，节省网络数据传输。

解析jpeg中的meta信息，对于各种orientation做了正确的处理，同时压缩后上传保留图片的所有原始meta数据。

### 多途径添加文件
支持文件多选，类型过滤，拖拽(文件&文件夹)，图片粘贴功能。

粘贴功能主要体现在当有图片数据在剪切板中时（截屏工具如QQ(Ctrl + ALT + A), 网页中右击图片点击复制），Ctrl + V便可添加此图片文件。

### HTML5 & FLASH
兼容主流浏览器，接口一致，实现了两套运行时支持，用户无需关心内部用了什么内核。

同时Flash部分没有做任何UI相关的工作，方便不关心flash的用户扩展和自定义业务需求。

### MD5秒传
当文件体积大、量比较多时，支持上传前做文件md5值验证，一致则可直接跳过。

如果服务端与前端统一修改算法，取段md5，可大大提升验证性能，耗时在20ms左右。

### 易扩展、可拆分
采用可拆分机制, 将各个功能独立成了小组件，可自由搭配。

采用AMD规范组织代码，清晰明了，方便高级玩家扩展。
