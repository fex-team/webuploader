(function($) {
    $(function() {
        var log = (function() {
            var dom = $('#log');

            return function( str ) {
                dom.append('<p>' + str + '</p>')
            }
        })();

        WebUploader.create({
            pick: '#filePicker'
        }).on('fileQueued', function( file ) {
            var start =  +new Date();

            // 返回的是 promise 对象
            this.md5File(file, 0, 1 * 1024 * 1024)

                // 可以用来监听进度
                .progress(function(percentage) {
                    // console.log('Percentage:', percentage);
                })

                // 处理完成后触发
                .then(function(ret) {
                    // console.log('md5:', ret);
                    
                    var end = +new Date();
                    log('HTML5: md5 ' + file.name + ' cost ' + (end - start) + 'ms get value: ' + ret);
                });
        });

        WebUploader.create({
            pick: '#filePicker2',
            swf: '../../dist/Uploader.swf',
            runtimeOrder: 'flash'
        }).on('fileQueued', function( file ) {
            var start =  +new Date();

            // 返回的是 promise 对象
            this.md5File(file, 0, 1 * 1024 * 1024)

                // 可以用来监听进度
                .progress(function(percentage) {
                    // console.log('Percentage:', percentage);
                })

                // 处理完成后触发
                .then(function(ret) {
                    // console.log('md5:', ret);
                    
                    var end = +new Date();
                    log('Flash: md5 ' + file.name + ' cost ' + (end - start) + 'ms get value: ' + ret);
                });
        });
    });
})(jQuery);