---
layout: post
title: 文档
navName: Document
group: 'nav'
weight : 2
hideTitle: true
commentIssueId: 80
---

## 接口说明
Web Uploader的所有代码都在一个内部闭包中，对外暴露了唯一的一个变量`WebUploader`，所以完全不用担心此框架会与其他框架冲突。

内部**所有**的类和功能都暴露在`WebUploader`名字空间下面。<br />
Demo中使用的是`WebUploader.create`方法来初始化的，实际上可直接访问`WebUploader.Uploader`。

```javascript
var uploader = new WebUploader.Uploader({
    swf: 'path_of_swf/Uploader.swf'

    // 其他配置项
});
```

具体有哪些内部类，请转到[API]({{ site.baseurl }}/doc/index.html)页面。

## 事件
`Uploader`实例具有Backbone同样的事件API：`on`，`off`，`once`，`trigger`。

```javascript
uploader.on( 'fileQueued', function( file ) {
    // do some things.
});
```

除了通过`on`绑定事件外，`Uploader`实例还有一个更便捷的添加事件方式。

```javascript
uploader.onFileQueued = function( file ) {
    // do some things.
};
```

如同`Document Element`中的onEvent一样，他的执行比`on`添加的`handler`的要晚。如果那些`handler`里面，有一个`return false`了，此`onEvent`里面是不会执行到的。

## Hook
`Uploader`里面的功能被拆分成了好几个`widget`，由`command`机制来通信合作。<br />
如下，filepicker在用户选择文件后，直接把结果`request`出去，然后负责队列的`queue` widget，监听命令，根据配置项中的`accept`来决定是否加入队列。

```javascript
// in file picker
picker.on( 'select', function( files ) {
    me.owner.request( 'add-file', [ files ]);
});

// in queue picker
Uploader.register({
    'add-file': 'addFiles'

    // xxxx
}, {

    addFiles: function( files ) {

        // 遍历files中的文件, 过滤掉不满足规则的。
    }
});
```

`Uploader.regeister`方法用来说明，该`widget`要响应哪些命令，并指定由什么方法来响应。上面的例子，当`add-file`命令派送时，内部的`addFiles`成员方法将被执行到，同一个命令，可以指定多次`handler`, 各个`handler`会按添加顺序依次执行，且后续的`handler`，不能被前面的`handler`截断。

`handler`里面可以是同步过程，也可以是异步过程。是异步过程时，只需要返回一个`promise`对象即可。存在异步可能的request调用者会等待此过程结束后才继续。举个例子，webuploader运行在flash模式下时，需要等待flash加载完毕后才能算ready了，此过程为一个异步过程，目前的做法是如下：

```javascript
// uploader在初始化的时候
me.request( 'init', opts, function() {
    me.state = 'ready';
    me.trigger('ready');
});

// filepicker `widget`中的初始化过程。
Uploader.register({
    'init': 'init'
}, {
    init: function( opts ) {

        var deferred = Base.Deferred();

        // 加载flash
        // 当flash ready执行deferred.resolve方法。

        return deferred.promise();
    }
});
```

目前webuploader内部有很多种command，在此列出比较重要的几个。

<table class="table table-bordered">
    <tr>
        <th>名称</th>
        <th>参数</th>
        <th>说明</th>
    </tr>
    <tr>
        <td><code>add-file</code></td>
        <td>files: File对象或者File数组</td>
        <td>用来向队列中添加文件。</td>
    </tr>
    <tr>
        <td><code>before-send-file</code></td>
        <td>file: File对象</td>
        <td>在文件发送之前request，此时还没有分片（如果配置了分片的话），可以用来做文件整体md5验证。</td>
    </tr>
    <tr>
        <td><code>before-send</code></td>
        <td>block: 分片对象</td>
        <td>在分片发送之前request，可以用来做分片验证，如果此分片已经上传成功了，可返回一个rejected promise来跳过此分片上传</td>
    </tr>
    <tr>
        <td><code>after-send-file</code></td>
        <td>file: File对象</td>
        <td>在所有分片都上传完毕后，且没有错误后request，用来做分片验证，此时如果promise被reject，当前文件上传会触发错误。</td>
    </tr>
</table>

## 文件组织
webuploader由很多独立的小文件组成。每个文件都是以[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD)规范组织的，方便类似与[RequireJS](http://requirejs.org/)之类的库直接使用。

如`lib/file.js`

```javascript
/**
 * @fileOverview File
 */
define([
    '../base',
    './blob'
], function( Base, Blob ) {

    var uid = 0,
        rExt = /\.([^.]+)$/;

    function File( ruid, file ) {
        var ext;

        Blob.apply( this, arguments );
        this.name = file.name || ('untitled' + uid++);

        if ( !this.type ) {
            ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';
            if ( ~'jpg,jpeg,png,gif,bmp'.indexOf( ext ) ) {
                this.type = 'image/' + ext;
            }
        }

        this.ext = ext;
        this.lastModifiedDate = file.lastModifiedDate ||
                (new Date()).toLocaleString();
    }

    return Base.inherits( Blob, File );
});
```

下面是目前的目录结构及说明。

```
├── base.js   实现一些常用的帮助类方法，如inherits, log等等。
├── file.js    文件类，Queue中存放的数据类。
├── jq-bridge.js    jQuery的替代品，只实现webuploader所需的，当然，如果已经有jQuery了，此文件不用打包。
├── lib
│   ├── blob.js  带ruid（为了兼容flash抽象出来的，ruid为运行时id）的Blob类
│   ├── dnd.js    文件拖拽
│   ├── file.js   带ruid的文件类，blob的子类。
│   ├── filepaste.js  负责图片粘贴。
│   ├── filepicker.js    文件选择器
│   ├── image.js    图片处理类，生成缩略图和图片压缩。
│   └── transport.js    文件传送。
├── mediator.js   Event类
├── promise.js    同jq-bridge, 在没有jQuery的时候才需要。用来实现Deferred。
├── queue.js    队列
├── runtime
│   ├── client.js   连接器
│   ├── compbase.js    component的基类。
│   ├── flash
│   │   ├── xxx lib中flash的具体实现。
│   ├── html5
│   │   ├── xxx lib中html5的具体实现。
│   └── runtime.js
├── uploader.js    Uploader类。
└── widgets
    ├── filednd.js   文件拖拽应用在Uploader
    ├── filepaste.js   图片粘贴应用在Uploader
    ├── filepicker.js   文件上传应用在Uploader中。
    ├── image.js     图片文件在对应的时机做图片压缩和预览
    ├── queue.js     队列管理
    ├── runtime.js    添加runtime信息给Uploader
    ├── upload.js      负责具体上传逻辑
    ├── validator.js    各种验证器
    └── widget.js    实现command机制
```
