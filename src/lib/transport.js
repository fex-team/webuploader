/**
 * @fileOverview Transport
 * @todo 支持chunked传输，优势：
 * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
 * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
 * @import base.js, runtime/client.js, core/mediator.js
 */
define( 'webuploader/lib/transport', [ 'webuploader/base',
        'webuploader/runtime/client',
        'webuploader/core/mediator'
        ], function( Base, RuntimeClient, Mediator ) {

    var $ = Base.$;

    function Transport( opts ) {
        this.options = $.extend( true, {}, Transport.options, opts || {} );
        RuntimeClient.call( this, 'Transport' );
    }

    Transport.options = {
        server: '',
        method: 'POST',

        // 跨域时，是否允许携带cookie, 只有html5 runtime才有效
        withCredentials: false,
        fileVar: 'file',
        chunked: true,
        chunkSize: 1024 * 512,    // 0.5M.
        RetryCount: 2,    // 可以重试2次。
        timeout: 2 * 60 * 1000,    // 2分钟
        formData: {},
        headers: {}
    }

    $.extend( Transport.prototype, {

        setFile: function( file ) {
            var me = this,
                ruid;

            if ( me.getRuid() ) {
                me.disconnectRuntime();
            }

            ruid = file.source.getRuid();
            this.connectRuntime( ruid, function() {
                me.exec( 'init', me.options );
                me.exec( 'setFile', file );
            } );
        },

        start: function() {
            return this.exec( 'start' );
        },

        abort: function() {
            return this.exec( 'abort' );
        },

        pause: function() {
            return this.exec( 'pause' );
        },

        resume: function() {
            return this.exec('resume');
        },

        destroy: function() {
            this.trigger( 'destroy' );
            this.off();
            this.exec( 'destroy' );
            this.disconnectRuntime();
        }

    } );

    Mediator.installTo( Transport.prototype );

    return Transport;
} );