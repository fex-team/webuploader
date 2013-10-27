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

        // 跨域时，是否允许携带cookie
        withCredentials: false,
        fileVar: 'file',
        chunked: true,
        chunkSize: 1024 * 512,    // 0.5M.
        chunkRetryCount: 3,    // 当chunk传输时出错，可以重试3次。
        timeout: 2 * 60 * 1000,    // 2分钟
        formData: {},
        headers: {}
    }

    $.extend( Transport.prototype, {

        setFile: function( file ) {
            var ruid;

            if ( this.getRuid() ) {
                this.disconnectRuntime();
            }

            ruid = file.source.getRuid();
            this.connectRuntime( ruid );
            this.exec( 'setFile', file );
        },

        start: function() {
            this.exec( 'start' );
        },

        abort: function() {
            this.exec( 'abort' );
        },

        pause: function() {
            this.exec( 'pause' );
        },

        destroy: function() {
            this.trigger( 'destroy' );
            this.off();
            this.disconnectRuntime();
            this.exec( 'destroy' );
        }

    } );

    Mediator.installTo( Transport.prototype );

    return Transport;
} );