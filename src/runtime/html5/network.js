/**
 * @fileOverview Transport
 * @todo 支持chunked传输，优势：
 * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
 * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
 */
define( 'webuploader/core/runtime/html5/Network', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
        ], function( Base, Html5Runtime ) {

    var $ = Base.$,
        instance;

    function Network() {
        if ( instance ) {
            return instance;
        } else {
            instance = this;
        }

        var me = this;

        if ( !this.runtime.capable( 'onLine' ) ) {
            Base.log( '不支持网络检测' );
            return me;
        }

        $( window ).on( 'online', function() {
            me.trigger( 'online' );
        } );

        $( window ).on( 'offline', function() {
            me.trigger( 'offline' );
        } );

        return this;
    }

    Network.getInstance = function() {
        return new Network();
    }

    Html5Runtime.register( 'Network', Network );

    Html5Runtime.addDetect(function() {
        return {
            onLine: !!navigator.onLine
        };
    });

    return Network;
} );