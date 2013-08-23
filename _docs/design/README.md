WebUploader Design
==================

* [设计目标](#%E8%AE%BE%E8%AE%A1%E7%9B%AE%E6%A0%87)
* [API设计](#api%E8%AE%BE%E8%AE%A1)
    * [实例创建API](#%E5%AE%9E%E4%BE%8B%E5%88%9B%E5%BB%BAapi)
    * [事件回调API](#%E4%BA%8B%E4%BB%B6%E5%9B%9E%E8%B0%83api)
        * [错误码表](#%E9%94%99%E8%AF%AF%E7%A0%81%E8%A1%A8)
    * [流程操作API](#%E6%B5%81%E7%A8%8B%E6%93%8D%E4%BD%9Capi)
    * [数据获取API](#%E6%95%B0%E6%8D%AE%E8%8E%B7%E5%8F%96api)
* [参数设计](#%E5%8F%82%E6%95%B0%E8%AE%BE%E8%AE%A1)
* [模块设计](#%E6%A8%A1%E5%9D%97%E8%AE%BE%E8%AE%A1)
    * [Uploader](#uploader)
    * [File](#file)
    * [Queue](#queue)
    * [Runtime](#runtime)
* [按需定制](#%E6%8C%89%E9%9C%80%E5%AE%9A%E5%88%B6)
* [异步加载](#%E5%BC%82%E6%AD%A5%E5%8A%A0%E8%BD%BD)
* [高性能](#%E9%AB%98%E6%80%A7%E8%83%BD)
    * [高效压缩](#%E9%AB%98%E6%95%88%E5%8E%8B%E7%BC%A9)
    * [并发上传](#%E5%B9%B6%E5%8F%91%E4%B8%8A%E4%BC%A0)
    * [合并上传](#%E5%90%88%E5%B9%B6%E4%B8%8A%E4%BC%A0)
* [UI Widgets](#ui-widgets)

## 命名空间

全局命名空间：WebUploader

## 代码规范

参见[GMU代码规范](https://github.com/gmuteam/GMU/tree/master/_standard)

## 设计目标

WebUploader遵循以下几个设计目标：

 * 轻量级：保持组件体积小巧、轻量，这在移动端尤其重要，例如允许使用者按实际需求定制模块，仅引入需要的代码；不依赖第三方DOM库，但可以按需使用第三方库；尤其在移动端，允许分批载入代码；
 * 模块化：按功能划分来组织模块，这是功能定制的必要条件；
 * 自适配：不同的端环境具有不同的能力，应避免开发者自己进行适配，包括针对不同端环境实现不同的`Runtime`并在运行时自动适配；
 * 高性能：包括但不限于高效压缩、并发上传、打包上传；
 * 易用性：包括但不限于简单易用的API、简洁的必填配置、完整的UI组件、丰富的文档、实用的工具；

## API设计

本节描述的API只包括对外的公共API，不包括内部API。

### 实例创建API

<table>
    <tr>
        <th>名称</th><th>参数</th><th>返回值</th><th>说明</th>
    </tr>
    <tr>
        <td>create</td><td>options：见<a href="#%E5%8F%82%E6%95%B0%E8%AE%BE%E8%AE%A1">参数设计</a></td><td>WebUploader Object</td><td>实例化WebUploader，<strong>静态方法</strong></td>
    </tr>
</table>

例如：

    var wu = WebUploader.create({
        buttonId: 'uploaderBtn'
    });

由于内部实现需要完成Runtime自动适配，因此与直接使用`new`相比，使用`create`更加灵活，它并不返回`WebUploader`的真实实例，而是根据需要选择对应的`Runtime`实例。

### 事件回调API

<table>
    <tr>
        <th>名称</th><th>回调参数</th><th>触发时机</th>
    </tr>
    <tr>
        <td>onReady</td><td>无</td><td>当组件可用时会触发，通常是在上传按钮初始化完成时</td>
    </tr>
    <tr>
        <td>onStartSelect</td><td>无</td><td>当用户开始选择文件时，实际触发时机为用户点击了文件选择按钮</td>
    </tr>
    <tr>
        <td>onBeforeFileQueue</td><td>file</td><td>当某个文件被加入队列前，如果回调返回false则file不会被加入到队列</td>
    </tr>
    <tr>
        <td>onFileQueued</td><td>file</td><td>当组文件被加入队列后</td>
    </tr>
    <tr>
        <td>onEndSelect</td>
        <td>
            totalNumSelected: 选择的文件总数<br>
            queuedNum: 成功加入队列的文件数<br>
            totalNumInQueue: 对了中的文件总数
        </td>
        <td>当所有选择的文件都完成过滤或加入队列后</td>
    </tr>
    <tr>
        <td>onError</td><td>errorCode: 错误码，见后表</td><td>发生错误时</td>
    </tr>
    <tr>
        <td>onUploadStart</td><td>file</td><td>文件开始上传</td>
    </tr>
    <tr>
        <td>onUploadProgress</td>
        <td>
            file: 当前文件<br>
            bytesComplete: 已上传字节数<br>
            bytesTotal: 字节总数
        </td>
        <td>文件上传过程中</td>
    </tr>
    <tr>
        <td>onUploadSuccess</td>
        <td>
            file: 当前文件<br>
            serverData: 服务器端返回的数据
        </td>
        <td>文件上传完成</td>
    </tr>
    <tr>
        <td>onUploadComplete</td><td>file</td><td>文件上传完成</td>
    </tr>
</table>

这里的事件回调实现两种注册方式并允许多次监听：

方式一

    var wu = WebUploader.create({
        onUploadStart: function( file ){
            //......
        }
    });

方式二

    var wu = WebUploader.create({
        server: '/abc.php'
    });

    wu.onUploadStart( function( file ) {
        //......
    } );


#### 错误码表

<table>
    <tr>
        <th>名称</th><th>说明</th>
    </tr>
    <tr>
        <td>Q_EXCEED_NUM_LIMIT</td><td>队列错误：超出文件数限制</td>
    </tr>
    <tr>
        <td>Q_EXCEED_SIZE_LIMIT</td><td>队列错误：超出文件大小限制</td>
    </tr>
    <tr>
        <td>Q_EMPTY_FILE</td><td>队列错误：空文件</td>
    </tr>
    <tr>
        <td>Q_INVALID_TYPE</td><td>队列错误：无效文件类型</td>
    </tr>
    <tr>
        <td>UPLOAD_HTTP</td><td>上传错误：非HTTP200</td>
    </tr>
    <tr>
        <td>UPLOAD_CANCELLED</td><td>上传错误：上传取消</td>
    </tr>
</table>

### 流程操作API

<table>
    <tr>
        <th>名称</th><th>参数</th><th>返回值</th><th>说明</th>
    </tr>
    <tr>
        <td>upload</td>
        <td>file: 指定上传文件，如果不指定将直接从队列头部开始上传</td>
        <td>无</td>
        <td>开始上传文件</td>
    </tr>
    <tr>
        <td>cache</td>
        <td>file: 指定取消上传的文件</td>
        <td>无</td>
        <td>取消某个文件的上传，被取消文件将从队列中删除。</td>
    </tr>
    <tr>
        <td>stop</td>
        <td>无</td>
        <td>无</td>
        <td>中止组件的上传过程。</td>
    </tr>
    <tr>
        <td>destroy</td>
        <td>无</td>
        <td>无</td>
        <td>组件销毁</td>
    </tr>
    <tr>
        <td>add</td>
        <td>
            file: WebUploader.File实例
        </td>
        <td>无</td>
        <td>添加文件到队列尾部。</td>
    </tr>
</table>

### 数据获取API

<table>
    <tr>
        <th>名称</th><th>参数</th><th>返回值</th><th>说明</th>
    </tr>
    <tr>
        <td>getFile</td>
        <td>index|id: 文件在队列中的序号或文件ID</td>
        <td>WebUploader.File实例</td>
        <td>获取文件实例</td>
    </tr>
    <tr>
        <td>getStats</td>
        <td>无</td>
        <td>
            Object:<br>
            successNum: 成功上传文件数<br>
            queueFailNum: 未进入队列文件数<br>
            cancelNum: 取消上传文件数<br>
            uploadFailNum: 上传失败文件数<br>
            queueNum: 当前队列中的文件数
        </td>
        <td>获取当前上传状态数据。</td>
    </tr>
    <tr>
        <td>isInProgress</td>
        <td>无</td>
        <td>状态</td>
        <td>获取是否正在上传的状态。</td>
    </tr>
    <tr>
        <td>getImageThumbnail</td>
        <td>
            id: 文件ID<br>
            width: 缩略图宽度<br>
            height: 缩略图高度
        </td>
        <td>
            缩略图BASE64 String
        </td>
        <td>获取指定图片文件的缩略图</td>
    </tr>
</table>

## 参数设计

<table>
    <tr>
        <th>名称</th><th>说明</th><th>必填项</th><th>默认值</th>
    </tr>
    <tr>
        <td>server</td>
        <td>服务器URL</td>
        <td>是</td>
        <td>无</td>
    </tr>
    <tr>
        <td>pick</td>
        <td>
            包括两种类型：<br>
            如果是字符串则表示对话框式文件选择的触发按钮ID；<br>
            如果是对象则包括两个字段：<br>
                multiple：是否允许选择多个文件，默认为true<br>
                id: 按钮ID
        </td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>dnd</td>
        <td>拖拽式文件选择的目标元素ID</td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>paste</td>
        <td>粘贴式文件选择的目标元素ID</td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>duplicate</td>
        <td>是否允许添加重名文件</td>
        <td>否</td>
        <td>false</td>
    </tr>
    <tr>
        <td>fileVar</td>
        <td>发送HTTP请求时的变量名</td>
        <td>否</td>
        <td>file</td>
    </tr>
    <tr>
        <td>formData</td>
        <td>发送HTTP请求时携带的自定义数据</td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>fileSizeLimit</td>
        <td>文件大小限制，允许的单位包括B/K/M以及G，例如'1M'</td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>fileNumLimit</td>
        <td>文件总数限制，包括成功上传的数量以及当前队列中的数量。</td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>fileTypeExts</td>
        <td>允许上传的文件扩展名，例如'*.*','*.png'等。</td>
        <td>否</td>
        <td>'*.*'</td>
    </tr>
    <tr>
        <td>isAuto</td>
        <td>文件选择完成后自动上传文件。</td>
        <td>否</td>
        <td>false</td>
    </tr>
    <tr>
        <td>isDebug</td>
        <td>是否开启Debug模式。</td>
        <td>否</td>
        <td>false</td>
    </tr>
    <tr>
        <td>resize</td>
        <td>
        是否启用图片压缩，参数为对象，包括：<br>
        width: 目标最大宽度<br>
        height: 目标最大高度<br>
        quality: 图片压缩质量为0 - 100，默认为90
        </td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>swf</td>
        <td>使用Flash Runtime时Flash的URL</td>
        <td>否<sup>1</sup></td>
        <td>无</td>
    </tr>
    <tr>
        <td>threads</td>
        <td>并发上传的最大文件数。</td>
        <td>否</td>
        <td>1</td>
    </tr>
</table>

<sup>1</sup>: 使用Flash Runtime时为必填；

## 模块设计

WebUploader按以下方式划分功能模块：

    WebUploader
    |--File：文件
    |--Queue：队列
    |--RuntimeHtml5：HTML5运行时
       |--FilePicker：对话框式文件选择
       |--FilePaste：文件粘贴
       |--FileDND：文件拖拽
       |--ImageResize：图片压缩
       |--ImageThumbnail：图片缩略图
       |--FileTransport：文件传输
    |--RuntimeFlash：Flash运行时
       |--TODO


### Uploader

外观类，对外的门面类，不负责具体实现，基本上是中转其他类的方法。

#### 方法

<table>
    <tr>
        <th>名称</th><th>参数</th><th>说明</th>
    </tr>
    <tr>
        <td>Uploader</td>
        <td>
            <li><code>options</code> 配置项。</li>
        </td>
        <td>构造器</td>
    </tr>
    <tr>
        <td>addFile</td>
        <td>
            <ul>
                <li><code>file</code> File实例</li>
            </ul>
        </td>
        <td>添加文件到队列</td>
    </tr>
    <tr>
        <td>removeFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>删除文件</td>
    </tr>
    <tr>
        <td>uploadFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>上传指定文件</td>
    </tr>
    <tr>
        <td>cancelFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>取消上传指定文件</td>
    </tr>
    <tr>
        <td>getFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>根据ID获取文件File实例</td>
    </tr>
    <tr>
        <td>upload</td>
        <td>
            无
        </td>
        <td>根据并发数, 按顺序上传队列中的文件</td>
    </tr>
    <tr>
        <td>getFiles</td>
        <td>
            <ul>
                <li><code>status</code> 文件状态</li>
            </ul>
        </td>
        <td>获取所有文件列表，可以根据文件状态过滤</td>
    </tr>
    <tr>
        <td>getStatus</td>
        <td>

        </td>
        <td>
            返回状态信息。

            Object:
            <ul>
                <li><code>successNum</code>: 成功上传文件数</li>
                <li><code>queueFailNum</code>: 未进入队列文件数</li>
                <li><code>cancelNum</code>: 取消上传文件数</li>
                <li><code>uploadFailNum</code>: 上传失败文件数</li>
                <li><code>queueNum</code>: 当前队列中的文件数</li>
            </ul>
    </td>
    </tr>
    <tr>
        <td>isInProgress</td>
        <td>

        </td>
        <td>是否在上传中。</td>
    </tr>
    <tr>
        <td>makeThumb</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>创造缩略图，返回缩略图BASE64 String</td>
    </tr>
</table>


### File

File用于封装文件信息，它位于顶层命名空间，跨Runtime通用类。

#### 属性

<table>
    <tr>
        <th>名称</th><th>说明</th>
    </tr>
    <tr>
        <td>id</td><td>文件ID，每个文件对象拥有唯一ID，即时是相同的文件。</td>
    </tr>
    <tr>
        <td>size</td><td>文件大小，单位为字节。</td>
    </tr>
    <tr>
        <td>type</td><td>文件类型，具体形式为MIMETYPE。</td>
    </tr>
    <tr>
        <td>lastModifiedDate</td><td>文件最后修改时间。</td>
    </tr>
    <tr>
        <td>status</td><td>文件状态，详细信息见后表。</td>
    </tr>
    <tr>
        <td>source</td><td>文件内容源：HTML5 File、BASE64 String或者HTML5 Blob</td>
    </tr>
</table>

#### 状态

<table>
    <tr>
        <th>名称</th><th>说明</th>
    </tr>
    <tr>
        <td>QUEUED</td><td>文件已入队列等待上传。</td>
    </tr>
    <tr>
        <td>PROGRESS</td><td>文件正在上传。</td>
    </tr>
    <tr>
        <td>ERROR</td><td>文件上传失败。</td>
    </tr>
    <tr>
        <td>COMPLETE</td><td>文件上传成功。</td>
    </tr>
    <tr>
        <td>CANCELLED</td><td>文件取消上传。</td>
    </tr>
</table>

#### 方法

<table>
    <tr>
        <th>名称</th><th>参数</th><th>说明</th>
    </tr>
    <tr>
        <td>File</td>
        <td>
            1. 如果使用HTML5 File构造则只需要传入一个参数<br>
            html5file<br>

            2. 如果使用非HTML5 File构造，例如BASE64串则应该提供完整信息<br>
                name<br>
                size<br>
                type<br>
                lastModifiedDate<br>
                source
        </td>
        <td>构造器</td>
    </tr>
    <tr>
        <td>destroy</td>
        <td>无</td>
        <td>销毁对象，结束引用，释放内存。</td>
    </tr>
</table>

### Queue

负责实现队列，跨Runtime通用

#### 方法

<table>
    <tr>
        <th>名称</th><th>参数</th><th>说明</th>
    </tr>
    <tr>
        <td>addFile</td>
        <td>
            <ul>
                <li><code>file</code> File实例</li>
            </ul>
        </td>
        <td>添加文件到队列</td>
    </tr>
    <tr>
        <td>removeFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>删除文件</td>
    </tr>
    <tr>
        <td>uploadFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>上传指定文件</td>
    </tr>
    <tr>
        <td>cancelFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>取消上传指定文件</td>
    </tr>
    <tr>
        <td>getFile</td>
        <td>
            <ul>
                <li><code>fileId</code> File实例中的Id</li>
            </ul>
        </td>
        <td>根据ID获取文件File实例</td>
    </tr>
    <tr>
        <td>upload</td>
        <td>
            无
        </td>
        <td>根据并发数, 按顺序上传队列中的文件</td>
    </tr>
    <tr>
        <td>getFiles</td>
        <td>
            <ul>
                <li><code>status</code> 文件状态</li>
            </ul>
        </td>
        <td>获取所有文件列表，可以根据文件状态过滤</td>
    </tr>
</table>

### Runtime

运行时， 用来对具体能力的实现。如：图片选择，压缩，上传。

####方法
<table>
    <tr>
        <th>名称</th><th>参数</th><th>说明</th>
    </tr>
    <tr>
        <td>can</td>
        <td>
            <code>cap</code>能力名称
        </td>
        <td>能力检测</td>
    </tr>
    <tr>
        <td>register</td>
        <td>
            <ul>
                <li><code>cap</code>能力名称</li>
                <li><code>factory</code>能力实现的方法</li>
            </ul>
        </td>
        <td>注册能力</td>
    </tr>
    <tr>
        <td>invoke</td>
        <td>
            <ul>
                <li><code>cap</code>能力名称</li>
                <li><code>args...</code>参数</li>
            </ul>
        </td>
        <td>调用功能。</td>
    </tr>
    <tr>
        <td>::register</td>
        <td>
            <ul>
                <li><code>runtime</code>能力名称</li>
                <li><code>capObject</code>能力对象</li>
            </ul>
        </td>
        <td>静态方法，注册什么runtime有什么能力</td>
    </tr>
    <tr>
        <td>::init</td>
        <td>
            无
        </td>
        <td>根据用户需求，选择runtime</td>
    </tr>
</table>

## 按需定制

WebUploader的实现考虑了众多的实际需求，是一个比较通用的实现，但是通用就意味了庞大和冗余，因为很多场景并不需要所有的功能。因此在设计时需要考虑模块的拆分和组合问题。

HTML5 Runtime中的各个模块之间没有强的依赖关系，仅在个别模块中存在弱的关联关系，这就使得各个模块可以随意的进行组合。

例如，`FilePicker` + `FileTransfer`就构成了一个最简单的文件上传组件，当然如果你用Canvas来创造文件的话连`FilePicker`也都不需要了，仅用`FileTransfer`即可。

这种灵活组合保证了组件的小巧和轻量，这对于移动端而言显得更为重要。

在实现方面，我们会采用静态打包的方式，类似[GMU](http://github/gmuteam/gmu)的定制下载。

## 异步加载

WebUploader是多Runtime实现，但是在实际使用中只会用到某一种Runtime，而如果把所有Runtime都载入的话则会比较浪费资源，因此需要支持模块的按需载入。WebUploader本身不会实现资源的异步载入，使用者可以通过CommonJS或其他方式来实现，类似的方式如下：

    var wu = WebUploader.create({
        //......
    });
    // 使用者根据需要自己加载对应资源
    if ( wu.runtime = 'html5' ) {
        require.async( 'webuploader/runtimehtml5' );
    }
    else {
        require.async( 'webuploader/runtimeflash' );
    }

需要注意的是，这种方式的异步加载在网速较慢的情况下将会影响用户体验，例如上传按钮不可点等；

针对这种情况还可以按以下方式来处理：
 * 将`FilePicker`与组件基础代码共同打包，这个包将会非常小因此可以提前加载并确保功能提前可用；
 * 将其他功能单独打包，这个包通过上述方式异步加载

## 高性能

性能优势将是WebUploader的核心竞争力，除了上述的通过灵活组合缩小组件体积之外，还__尝试__从以下几个方向提升性能优势。

### 高效压缩

将试验各种可能的技术，选择最高效的方式：
 * Canvas
 * ArrayBuffer + WebWorker
 * Flash

### 并发上传

多线程并行上传：
 * Ajax
 * Socket
 * Flash

### 合并上传

从某产品线拿到的数据来看，100K以下的图片占比达40% - 50%，因此我们会试验多图合并上传的方案。

## UI Widgets

为了降低开发者的使用成本，以及便于组件的对外推广，我们将会基于jQuery以及Bootstrap开发相应的UI Widget。
