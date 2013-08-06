文件（图片）上传调研
=================

## 浏览器占有率

浏览器占有率

<table>
    <tr>
        <th>浏览器</th><th>占有率</th>
    </tr>
    <tr><td>Chrome</td><td>52.94%</td></tr>
    <tr><td>IE</td><td>44.32%</td></tr>
    <tr><td>FF</td><td>1.97%</td></tr>
</table>


IE版本占有率

<table>
    <tr>
        <th>浏览器</th><th>占有率</th>
    </tr>
    <tr><td>IE6</td><td>6.55%</td></tr>
    <tr><td>IE7</td><td>0.57%</td></tr>
    <tr><td>IE8</td><td>27.33%</td></tr>
    <tr><td>IE9</td><td>9.87%</td></tr>
    <tr><td>IE10</td><td>&lt;5%</td></tr>
</table>

## 功能调研

### 文件选择

<table>
    <tr>
        <th>方式</th><th>IE6</th><th>IE7</th><th>IE8</th><th>IE9</th><th>IE10</th><th>Chrome</th><th>FF</th>
    </tr>
    <tr>
        <td>单选</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>多选</td>
        <td>X</td>
        <td>X</td>
        <td>X</td>
        <td>X</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>拖拽</td>
        <td>X</td>
        <td>X</td>
        <td>X</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
</table>

### 文件信息

<table>
    <tr>
        <th>属性</th><th>说明</th><th>IE9</th><th>IE10</th><th>Chrome</th><th>FF</th>
    </tr>
    <tr>
        <td>name</td>
        <td>文件名称</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>lastModifiedDate</td>
        <td>文件最后修改日期</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>size</td>
        <td>文件大小</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>type</td>
        <td>文件类型，HTTP协议中Content-Type格式。</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
</table>

### 文件内容读取

<table>
    <tr>
        <th>方法</th><th>说明</th><th>IE10</th><th>Chrome</th><th>FF</th>
    </tr>
    <tr>
        <td>readAsDataURL</td>
        <td>按DataURL格式读取文件内容，适用于图片文件。</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>readAsText</td>
        <td>读取文本文件内容。</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>readAsArrayBuffer</td>
        <td>按字节读取。</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>readAsBinaryString</td>
        <td>读取文件并返回二进制字符串。</td>
        <td>X</td>
        <td>O</td>
        <td>O</td>
    </tr>
</table>

### 图片预览

<table>
    <tr>
        <th>方式</th><th>IE10</th><th>Chrome</th><th>FF</th>
    </tr>
    <tr>
        <td>readAsDataURL</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
    <tr>
        <td>createObjectURL</td>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
</table>

### 图片裁剪

<table>
    <tr>
        <th>IE10</th><th>Chrome</th><th>FF</th>
    </tr>
    <tr>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
</table>

### 图片压缩

<table>
    <tr>
        <th>IE10</th><th>Chrome</th><th>FF</th>
    </tr>
    <tr>
        <td>O</td>
        <td>O</td>
        <td>O</td>
    </tr>
</table>

### Javascript 与 Flash通信

考虑到Javascript在某些情况下的局限性，可能需要与Flash协作，因此需要Javascript具有与Flash通信的能力。

序列化数据通信：支持；但是需要读取文件序列化后的内容，比如BASE64，内存占用可能会比较大；
二进制数据通信：待验证；

## 性能评测



