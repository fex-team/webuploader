WebUploader 文件上传
========

## 特点

* 多线程上传
* IE8+ 其他浏览器支持
* 多运行时支持，HTML5，Flash。自动根据浏览能力选用。
* 支持图片线下压缩。
* 支持图片预览合EXIF信息识别。

目前已应用在百度相册上传页。

## 使用说明

```javascript
var upload = WebUploader.create( options );
```

### Options说明
<table>
    <tr>
        <th>名称</th><th>说明</th><th>必填项</th><th>默认值</th>
    </tr>
    <tr>
        <td>server</td>
        <td>上传地址</td>
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
        <td>文件大小限制总大小。传入int类型。</td>
        <td>否</td>
        <td>无</td>
    </tr>
    <tr>
        <td>fileSingleSizeLimit</td>
        <td>单个文件大小限制。传入int类型。</td>
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
        <td>accept</td>
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
    <tr>
        <td>runtimeOrders</td>
        <td>设置runtime优先级</td>
        <td>否</td>
        <td>html5,flash</td>
    </tr>
</table>

### 方法说明
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
        <td>getFiles</td>
        <td>
            <ul>
                <li><code>status</code> 文件状态</li>
            </ul>
        </td>
        <td>获取所有文件列表，可以根据文件状态过滤</td>
    </tr>
    <tr>
        <td>upload</td>
        <td>
            无
        </td>
        <td>根据并发数, 按顺序上传队列中的文件</td>
    </tr>
    <tr>
        <td>stop</td>
        <td>
            无
        </td>
        <td>暂停上传。可以通过upload()方法继续上传。</td>
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

### 时间说明
<table>
    <tr>
        <th>名称</th><th>回调参数</th><th>触发时机</th>
    </tr>
    <tr>
        <td>onReady</td><td>无</td><td>当组件可用时会触发，通常是在上传按钮初始化完成时</td>
    </tr>
    <tr>
        <td>onBeforeFileQueue</td><td>file</td><td>当某个文件被加入队列前，如果回调返回false则file不会被加入到队列</td>
    </tr>
    <tr>
        <td>onFileQueued</td><td>file</td><td>当组文件被加入队列后</td>
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
    <tr>
        <td>onUploadBeforeSend</td><td>file, data, header</td><td>文件发送之前，允许附带上传参数和header</td>
    </tr>
    <tr>
        <td>onUploadAccept</td><td>file, response</td><td>文件上传结束前，在此事件中可以根据reponse判断文件是否上传正确。</td>
    </tr>
</table>