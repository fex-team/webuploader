/**
 * @fileOverview 数据发送
 * @import base.js, core/uploader.js, core/file.js, lib/transport.js
 */

define( 'webuploader/widgets/transport', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/core/file',
    'webuploader/lib/transport' ], function(
        Base, Uploader, WUFile, Transport ) {

    var $ = Base.$,
        Status = WUFile.Status;

    return Uploader.register(
        {
            'cancel-transport': 'cancel',
            'resume-transports': 'resumeAll',
            'pause-transports': 'pauseRuning',
            'start-transport': 'sendFile',
            'has-requests': 'hasRequests'
        },

        {

            init: function( opts ) {
                this.requests = {};
            },

            sendFile: function( file ) {
                var me = this,
                    tr = new Transport( me.options ),
                    trHandler, fileHander;

                me.owner.trigger( 'uploadStart', file );

                trHandler = function( type ) {
                    var args = Base.slice( arguments, 1 ),
                        formData;

                    args.unshift( file );
                    args.unshift( 'upload' + type.substring( 0, 1 )
                        .toUpperCase() + type.substring( 1 ) );

                    if ( type === 'beforeSend' ) {
                        formData = args[ 2 ];

                        // 添加文件信息，待服务器发送。
                        $.extend( formData, {
                            id: file.id,
                            name: file.name,
                            type: file.type,
                            lastModifiedDate: file.lastModifiedDate,
                            size: file.size
                        } );
                    }

                    if ( type === 'error' ) {
                        file.setStatus( Status.ERROR, args[ 2 ] );
                    } else if ( type === 'success' ) {
                        file.setStatus( Status.COMPLETE );
                    } else if ( type === 'progress' ) {
                        file.loaded = file.size * args[ 2 ];
                    } else if ( type === 'complete' &&
                            file.getStatus() !== Status.INTERRUPT ) {
                        file.off( 'statuschange', fileHandler );

                        // 如果是interrupt中断了，还需重传的。
                        delete me.requests[ file.id ];
                        tr.destroy();

                        
                    }

                    // 通过owner广播出去
                    return me.owner.trigger.apply( me.owner, args );
                };

                fileHandler = function( cur, prev ) {
                    if ( cur === Status.INVALID ) {
                        delete me.requests[ file.id ];
                        tr.destroy();
                        file.off( 'statuschange', fileHandler );
                    }
                };

                file.on( 'statuschange', fileHandler );
                file.setStatus( Status.PROGRESS );
                tr.on( 'all', trHandler );
                tr.setFile( file );
                me.requests[ file.id ] = tr;
                me.request( 'before-start-transport', file, function() {
                    tr.start();
                });
            },

            hasRequests: function() {
                var key;

                for( key in this.requests ) {
                    return true;
                }

                return false;
            },

            cancel: function( fileId ) {
                var tr = this.requests[ fileId ];

                if ( !tr ) {
                    return;
                }

                tr.cancel();
            },

            resumeAll: function( ) {
                var me = this;

                $.each( me.requests, function( id, transport ) {
                    var file = me.request( 'get-file', id );
                    if ( file.getStatus() !== Status.PROGRESS ) {
                        file.setStatus( Status.PROGRESS, '' );
                        transport.resume();
                    }
                });
            },

            pauseRuning: function( interrupt ) {
                var me = this;

                $.each( me.requests, function( id, transport ) {
                    var file;

                    transport.pause( interrupt );

                    if ( interrupt ) {
                        file = me.request( 'get-file', id );
                        file.setStatus( Status.INTERRUPT, '' );
                    }
                });
            }
    });
} );