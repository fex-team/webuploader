JPGJS二进制压缩调研
=================

##关于调研

目前采用`Canvas`进行resize，单图效率还是比较高的，但是由于是单线程处理，因此批量处理时效率还有提高的余地。
因此想通过`webworker`进行并发处理，但是`webworker`中是无法使用`Canvas`的，所以需要调研字节处理的方案，而JPGJS就是这样的一个方案。

##关于JPGJS

Github：[https://github.com/notmasteryet/jpgjs](https://github.com/notmasteryet/jpgjs)

包括以下几个接口：

 * load( url ): 使用`XMLHTTPRequest`加载图片的`ArrayBuffer`数据，并调用`this.parse`解析数据；
 * parse( data ): 按jpeg的规范格式解析`load`方法载入的`ArrayBuffer`数据，并将数据格式化成各种对象，例如frame、jfif等；
 * getData( width, height ): 将解析后的jpeg数据按指定的宽度和高度进行压缩；
 * copyToImageData( imageData ): 将数据拷贝到`Canvas`的`ImageData`中；

##测试方法

 1. 通过`<input type="file"/>`选择不同大小的文件；
 2. 针对每个图片文件创建`JpegImage`实例-jpg；
 3. 创建`Canvas`，宽度为`Math.min( 1600, imageWidth)`；
 4. 调用jpg的`copyToImageData`方法将数据输出到`Canvas`；
 5. 调用`Canvas`的`toDataURL`方法显示图片；
 6. 时间记录包括：`JpegImage`内部`parse`方法的执行、resize以及显示图片的时间；

详情查看`index.html`。

##测试结果

<table>
    <tr>
        <th>时间</th><th>100K</th><th>1M</th><th>3M</th>
    </tr>
    <tr>
        <th>parse</th><td>44</td><td>340</td><td>2068</td>
    </tr>
    <tr>
        <th>resize</th><td>8</td><td>42</td><td>53</td>
    </tr>
    <tr>
        <th>display</th><td>35</td><td>144</td><td>141</td>
    </tr>
    <tr>
        <th>total</th><td>97</td><td>541</td><td>2288</td>
    </tr>
</table>

##测试结论

JPGJS中parse的效率非常低，3M图片就需要2s以上的时间，而直接采用`Canvas`来resize的时间只有400ms，因此如果想通过Web Worker来并行resize还得想办法提高parse部分的效率或者其他办法。



