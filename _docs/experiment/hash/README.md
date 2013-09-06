文件去重 - hash方案调研
====================

##介绍

利用`FileReader`读取文件内容，然后借助现成md5工具序列化文件内容，来实现文件去重。本次调研
主要关注hash的生成效率。

考虑到效率问题，hash生成并不读取文件全部内容，而只是读取文件开头的一部分和结束的一部分。

生成工具来自：http://marcu87.github.io/hashme/

##维度

 * 图片大小:100K & 300K & 500K & 800K & 1M & 3M & 5M & 10M
 * 图片数量：50

 ##结果

<table>
    <tr>
        <th>文件大小 / 文件数量</th>
        <th>100K</th>
        <th>300K</th>
        <th>500K</th>
        <th>800K</th>
        <th>1M</th>
        <th>3M</th>
        <th>5M</th>
        <th>10M</th>
    </tr>
    <tr>
        <th>50 个</th>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
</table>

测试环境
 * OS: MacBook Pro MD212CH
 * Browser: Chrome 29.0.1547.65

##结论

 此hash方法，生成速度快，单个文件生成在20ms左右，且生成快慢不受文件大小影响，所以此方法将加入到
 webuploader中。