/**
 * @fileOverview 数据发送
 * @import queue.js
 */

define( 'webuploader/widgets/transport', [ 
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/core/file' ], function( 
        Base, Uploader, WUFile ) {

    var $ = Base.$,
        Status = WUFile.Status;

    return Uploader.register({

        init: function( opts ) {
            this.requests = {};
            this.Transport = this.runtime.getComponent( 'Transport' );
        },

        sendBlob: function( file, callback ) {
            var blob = file.source,
                me = this,
                tr = new this.Transport( me.options );

            me.requests[ file.id ] = tr;
            tr.on( 'all', callback );

            tr.sendAsBlob( blob );
        },

        cancel: function( fileId ) {
            var tr = this.requests[ fileId ];

            if ( !tr ) {
                return;
            }

            tr.cancel();

            this.remove( fileId );
        },

        remove: function( fileId ) {
            var tr = this.requests[ fileId ];

            if ( !tr ) {
                return;
            }

            tr.off();
            tr.destroy();

            delete this.requests[ fileId ];
        },

        resumeAll: function( ) {
            var me = this;

            $.each( me.requests, function( id, transport ) {
                var file = me.request( 'get-file', [ id ] );
                if ( file.getStatus() !== Status.PROGRESS ) {
                    file.setStatus( Status.PROGRESS, '' );
                    transport.resume();
                }
            });
        },

        pauseAll: function( ) {
            var me = this;

            $.each( me.requests, function( id, transport ) {
                transport.pause();
            });
        }
    }, {
        'cancel-transport': 'cancel',
        'remove-transport': 'remove',
        'resume-transports': 'resumeAll',
        'pause-all': 'pauseAll',
        'send-blob': 'sendBlob'
    });
} );