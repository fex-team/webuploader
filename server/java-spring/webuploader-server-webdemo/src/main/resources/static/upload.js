$(function () {


    var uploader;


    WebUploader.Uploader.register({
            "before-send-file": "beforeSendFile",//整个文件上传前
            "before-send": "beforeSend",  //每个分片上传前
            "after-send-file": "afterSendFile"  //分片上传完毕
        },
        {
            beforeSendFile: function (file) {
                var deferred = WebUploader.Base.Deferred();
                uploader.md5File(file, 0, 9 * 1024 * 1024).progress(function (percentage) {
                    $('#' + file.id).find('p.state').text('正在读取文件信息...');
                }).then(function (val) {
                    $('#' + file.id).find('p.state').text('获取文件信息成功...');
                    file.fileMd5 = val;
                    deferred.resolve();
                });
                return deferred.promise();
            },
            beforeSend: function (block) {
                var deferred = WebUploader.Base.Deferred();
                block.file.chunks = block.chunks;
                $.ajax({
                    type: "POST",
                    url: "/webuploader/check",  //ajax验证每一个分片
                    data: {
                        fileName: block.file.name,
                        fileMd5: block.file.fileMd5,  //文件唯一标记
                        chunk: block.chunk,  //当前分块下标
                        chunkSize: block.end - block.start,//当前分块大小
                    },
                    cache: false,
                    timeout: 1000, // 超时的话，只能认为该分片未上传过
                    dataType: "json"
                }).then(function (response, textStatus, jqXHR) {
                    if (response.ifExist) {
                        //分块存在，跳过
                        deferred.reject();
                    } else {
                        //分块不存在或不完整，重新发送该分块内容
                        deferred.resolve();
                    }
                }, function (jqXHR, textStatus, errorThrown) {    //任何形式的验证失败，都触发重新上传
                    //分块不存在或不完整，重新发送该分块内容
                    deferred.resolve();
                });
                return deferred.promise();
            },
            afterSendFile: function (file) {
                //第一步：先检查文件路径下是否存在该文件，如果存在则修改旧文件名称和文件状态
                var deferred = WebUploader.Base.Deferred();
                mergeFile(file, null, null, deferred);
                return deferred.promise();
            }
        });

    uploader = WebUploader.create({
        //选择文件，自动上传(自动上传设置成uploader()方法上传，不然所有的拦截信息没用)
        auto: true,
        // 不压缩image
        resize: false,
        // 文件接收服务端,此处根据自己的框架写，本人用的是SpringMVC
        server: "/webuploader/upload",
        // 选择文件的按钮。可选。
        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
        pick: '#upload',
        duplicate: false, //是否可重复选择同一文件
        chunked: true,  //分片处理
        chunkRetry: 3, //如果某个分片由于网络问题出错，允许自动重传的次数
        chunkSize: 9 * 1024 * 1024, //每片20M
        threads: 3,//上传并发数，允许同时最大上传进程数量。
        accept: {
            //限制上传文件格式
            extensions: 'doc,docx,xls,xlsx,pdf',
            mimeTypes: '.doc,.xls,.docx,.xlsx,.pdf'
        }
    });


    //当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次。
    uploader.on('uploadBeforeSend', function (block, data, headers) {
        data.fileMd5 = block.file.fileMd5;
        //block.file.chunks = block.chunks;//当前文件总分片数量
        data.chunks = block.file.chunks;
    });

    // 当有文件添加进来的时候
    uploader.on('fileQueued', function (file) {
        //执行上传
        uploader.upload(file.id);
    });


    //合并文件分片
    var mergeFile=function (block, data, timePoke, deferred) {
        $.ajax({
            type: "POST",
            url: "/webuploader/merge",  //ajax将所有片段合并成整体
            data: {
                fileName: block.name,
                fileMd5: block.fileMd5,
                chunks: block.chunks,
            },
            async: false,//同步
            dataType: "json",
            success: function (response) {
                //合并成功之后的操作
                if (response.code == 0) {
                    alert("上传成功");
                    deferred.resolve();
                } else {
                    alert('文件上传失败！');
                }
            }
        });
    }


});