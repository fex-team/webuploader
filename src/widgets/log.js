/**
 * @fileOverview 日志组件，主要用来收集错误信息，可以帮助 webuploader 更好的定位问题和发展。
 *
 * 如果您不想要启用此功能，请在打包的时候去掉 log 模块。
 *
 * 或者可以在初始化的时候通过 options.disableWidgets 属性禁用。
 *
 * 如：
 * WebUploader.create({
 *     ...
 *
 *     disableWidgets: 'log',
 *
 *     ...
 * })
 */
define([
    '../base',
    '../uploader',
    './widget'
], function( Base, Uploader ) {
    var $ = Base.$,
        logUrl = ' http://static.tieba.baidu.com/tb/pms/img/st.gif??',
        product = (location.hostname || location.host || 'protected').toLowerCase(),

        // 只针对 baidu 内部产品用户做统计功能。
        enable = product && /baidu/i.exec(product),
        base;

    if (!enable) {
        return;
    }

    base = {
        dv: 3,
        master: 'webuploader',
        online: /test/.exec(product) ? 0 : 1,
        module: '',
        product: product,
        type: 0
    };

    function send(data) {
        var obj = $.extend({}, base, data),
            url = logUrl.replace(/^(.*)\?/, '$1' + $.param( obj )),
            image = new Image();

        image.src = url;
    }

    return Uploader.register({
        name: 'log',

        init: function() {
            var owner = this.owner,
                count = 0,
                size = 0;

            owner
                .on('error', function(code) {
                    send({
                        type: 2,
                        c_error_code: code
                    });
                })
                .on('uploadError', function(file, reason) {
                    send({
                        type: 2,
                        c_error_code: 'UPLOAD_ERROR',
                        c_reason: '' + reason
                    });
                })
                .on('uploadComplete', function(file) {
                    count++;
                    size += file.size;
                }).
                on('uploadFinished', function() {
                    send({
                        c_count: count,
                        c_size: size
                    });
                    count = size = 0;
                });

            send({
                c_usage: 1
            });
        }
    });
});