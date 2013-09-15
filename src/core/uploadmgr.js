/**
 *
 * @fileOverview UploadMgr
 */
define( 'webuploader/core/uploadmgr', [ 'webuploader/base',
        'webuploader/core/file', 'webuploader/core/mediator',
        'webuploader/core/queue'
        ], function( Base, WUFile, Mediator, Queue ) {

    var $ = Base.$;

    function UploadMgr( opts, runtime ) {
        var threads = opts.threads || 3,
            queue = new Queue(),
            stats = queue.stats,
            Image = runtime.getComponent( 'Image' ),
            Transport = runtime.getComponent( 'Transport' ),
            runing = false,
            requests = {},
            requestsLength = 0,
            Status = WUFile.Status,
            api;

        opts.resize && $.extend( Image.defaultOptions.downsize, opts.resize );

        function _tick() {
            while( runing && stats.numOfProgress < threads &&
                    stats.numOfQueue ) {

                _sendFile( queue.fetch() );
            }

            stats.numOfQueue || (runing = false);

            stats.numOfQueue || requestsLength || api.trigger( 'uploadFinished' );
        }

        function _sendFile( file ) {
            var tr;

            // 有必要？
            // 如果外部阻止了此文件上传，则跳过此文件
            if ( !api.trigger( 'uploadStart', file ) ) {

                // 先标记它是错误的。
                file.setStatus( Status.CANCELLED );
                return;
            }

            tr = new Transport({
                url: opts.server,
                formData: opts.formData || {}
            } );

            tr.on( 'all', function( type ) {
                var args = [].slice.call( arguments, 1 ),
                    ret, formData;

                args.unshift( file );
                args.unshift( 'upload' + type.substring( 0, 1 )
                    .toUpperCase() + type.substring( 1 ) );

                if ( type === 'beforeSend' ) {
                    formData = args[ 2 ];

                    $.extend( formData, {
                        id: file.id,
                        name: file.name,
                        type: file.type,
                        lastModifiedDate: file.lastModifiedDate,
                        size: file.size
                    } );
                }

                status[ type ] && file.setStatus( status[ type ] );
                ret = api.trigger.apply( api, args );

                if ( type === 'error' ) {
                    file.setStatus( Status.ERROR, args[ 2 ] );
                } else if ( type === 'success' ) {
                    file.setStatus( Status.COMPLETE );
                } else if ( type === 'complete' ) {    // error or success.
                    delete requests[ file.id ];
                    requestsLength--;
                    tr.off( 'all', arguments.callee );
                }

                return ret;
            } );

            requests[ file.id ] =  tr;
            requestsLength++;

            if ( opts.resize ) {
                Image.downsize( file.source, function( blob ) {
                    var size = file.size;

                    file.source = blob;
                    file.size = blob.size;
                    file.trigger( 'downsize', blob.size, size );

                    tr.sendAsBlob( blob );
                } );
            } else {
                tr.sendAsBlob( file.source );
            }

            file.setStatus( Status.PROGRESS );

            file.on( 'statuschange', function( cur, prev ) {
                if ( prev === Status.PROGRESS ) {
                    setTimeout( _tick, 1 );

                    if ( cur !== Status.INTERRUPT ) {
                        file.off( 'statuschange', arguments.callee );
                    }
                }
            } );
        }

        // 只暴露此对象下的方法。
        api = {

            start: function() {

                // 移出invalid的文件
                $.each( queue.getFiles( Status.INVALID ), function() {
                    api.removeFile( this );
                } );

                if ( runing || !stats.numOfQueue && !requestsLength ) {
                    return;
                }
                runing = true;

                // 如果有暂停的，则续传
                $.each( requests, function( id, transport ) {
                    var file = queue.getFile( id );
                    file.setStatus( Status.PROGRESS, '' );
                    transport.resume();
                });
                _tick();
            },

            stop: function( interrupt ) {
                runing = false;

                interrupt && $.each( requests, function( id, transport ) {
                    var file = queue.getFile( id );
                    file.setStatus( Status.INTERRUPT );
                    transport.pause();
                } );
            },

            getStats: function() {
                return {
                    successNum: stats.numOfSuccess,
                    queueFailNum: 0,
                    cancelNum: stats.numOfCancel,
                    uploadFailNum: stats.numOfUploadFailed,
                    queueNum: stats.numOfQueue
                };
            },

            getFile: function() {
                return queue.getFile.apply( queue, arguments );
            },

            addFile: function( file ) {
                if ( !(file instanceof WUFile) ) {
                    file = new WUFile( file );
                }

                if ( !api.trigger( 'beforeFileQueued', file ) ) {
                    return false;
                }

                queue.append( file );
                api.trigger( 'fileQueued', file );

                return this;
            },

            addFiles: function( arr ) {
                var me = this;

                $.each( arr, function() {
                    me.addFile( this );
                });
            },

            removeFile: function( file ) {
                file = file.id ? file : queue.getFile( file );

                if ( requests[ file.id ] ) {
                    requests[ file.id ].cancel();
                }

                file.setStatus( Status.CANCELLED );
                api.trigger( 'fileDequeued', file );
            },

            retry: function() {
                var files = queue.getFiles( Status.ERROR ),
                    i = 0,
                    len = files.length,
                    file;

                for( ; i < len; i++ ) {
                    file = files[ i ];
                    file.setStatus( Status.QUEUED );
                }

                api.start();
            }
        };

        Mediator.installTo( api );
        return api;
    }

    return UploadMgr;
} );