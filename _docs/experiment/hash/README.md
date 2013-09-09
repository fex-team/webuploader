文件去重 - hash方案调研
====================

##介绍

利用`FileReader`读取文件内容，然后借助现成md5工具序列化文件内容，来实现文件去重。本次调研
主要关注hash的生成效率。

考虑到效率问题，hash生成并不读取文件全部内容，而只是读取文件开头的一部分和结束的一部分。

生成工具来自：http://marcu87.github.io/hashme/

##维度

 * 图片大小:100K & 300K & 500K & 800K & 1M & 3M & 5M & 10M & 16M & 22M & 26M & 31M & 46M
 * 图片数量：50

##结果

<table>
    <tr>
        <th>文件大小 / 文件数量</th>
        <th>50个</th>
    </tr>
    <tr>
        <th>100K</th>
        <td>679ms</td>
    </tr>
    <tr>
        <th>300K</th>
        <td>706ms</td>
    </tr>
    <tr>
        <th>500K</th>
        <td>716ms</td>
    </tr>
    <tr>
        <th>800K</th>
        <td>863ms</td>
    </tr>
    <tr>
        <th>1M</th>
        <td>729ms</td>
    </tr>
    <tr>
        <th>3M</th>
        <td>903ms</td>
    </tr>
    <tr>
        <th>5M</th>
        <td>917ms</td>
    </tr>
    <tr>
        <th>10M</th>
        <td>878ms</td>
    </tr>
    <tr>
        <th>16M</th>
        <td>888ms</td>
    </tr>
    <tr>
        <th>22M</th>
        <td>872ms</td>
    </tr>
    <tr>
        <th>26M</th>
        <td>735ms</td>
    </tr>
    <tr>
        <th>31M</th>
        <td>739ms</td>
    </tr>
    <tr>
        <th>46M</th>
        <td>717ms</td>
    </tr>
</table>

测试环境

 * Machine: MacBook Pro MD212CH
 * OS: OSX 10.8.4
 * Browser: Chrome 29.0.1547.65

##结论

 此hash方法，生成速度快，单个文件生成在20ms左右，且生成快慢不受文件大小影响，所以此方法将加入到
 webuploader中。

 ---------------------

 ## MD5 全部文件内容

 <table>
    <tr>
        <th>文件大小 / 文件数量</th>
        <th>50个 No Worker</th>
        <th>50个 Worker</th>
    </tr>
    <tr>
        <th>100K</th>
        <td>460ms</td>
        <td>531ms</td>
    </tr>
    <tr>
        <th>300K</th>
        <td>1431ms</td>
        <td>1395ms</td>
    </tr>
    <tr>
        <th>500K</th>
        <td>1897ms</td>
        <td>1854ms</td>
    </tr>
    <tr>
        <th>800K</th>
        <td>2698ms</td>
        <td>2484ms</td>
    </tr>
    <tr>
        <th>1M</th>
        <td>3862ms</td>
        <td>3586ms</td>
    </tr>
    <tr>
        <th>3M</th>
        <td>10162ms</td>
        <td>9146ms</td>
    </tr>
    <tr>
        <th>5M</th>
        <td>19438ms</td>
        <td>17030ms</td>
    </tr>
    <tr>
        <th>10M</th>
        <td>32458ms</td>
        <td>28828ms</td>
    </tr>
    <tr>
        <th>16M</th>
        <td>52453ms</td>
        <td>47417ms</td>
    </tr>
    <tr>
        <th>22M</th>
        <td>72919ms</td>
        <td>62409ms</td>
    </tr>
    <tr>
        <th>26M</th>
        <td>86855ms</td>
        <td>75114ms</td>
    </tr>
    <tr>
        <th>31M</th>
        <td>111247ms</td>
        <td>88647ms</td>
    </tr>
    <tr>
        <th>46M</th>
        <td>154006ms</td>
        <td>129005ms</td>
    </tr>
</table>