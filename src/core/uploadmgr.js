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

        opts.resize && $.extend( Image.defaultOptions.resize, opts.resize );

        function _tick() {
            while( runing && stats.numOfProgress < threads &&
                    stats.numOfQueue ) {

                _sendFile( queue.fetch() );
            }

            if ( !stats.numOfQueue && !requestsLength ) {
                runing = false;
                api.trigger( 'uploadFinished' );
            }
        }

        function _sendFile( file ) {
            var tr, trHandler, fileHandler;

            // 有必要？
            // 如果外部阻止了此文件上传，则跳过此文件
            if ( !api.trigger( 'uploadStart', file ) ) {

                // 先标记它是错误的。
                file.setStatus( Status.CANCELLED );
                return;
            }

            tr = new Transport( opts );

            trHandler = function( type ) {
                var args = [].slice.call( arguments, 1 ),
                formData;

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

                if ( type === 'error' ) {
                    file.setStatus( Status.ERROR, args[ 2 ] );
                } else if ( type === 'success' ) {
                    file.setStatus( Status.COMPLETE );
                } else if ( type === 'complete' &&
                        file.getStatus() !== Status.INTERRUPT ) {

                    // 如果是interrupt中断了，还需重传的。
                    delete requests[ file.id ];
                    requestsLength--;
                    tr.off( 'all', trHandler );
                    tr.destroy();
                }

                return api.trigger.apply( api, args );
            };
            tr.on( 'all', trHandler );

            requests[ file.id ] =  tr;
            requestsLength++;

            if ( opts.resize &&(file.type === 'image/jpg' ||
                    file.type === 'image/jpeg' ) && !file.resized ) {

                // @todo 如果是重新上传，则不需要再resize.
                Image.resize( file.source, function( error, blob ) {
                    var size = file.size;

                    // @todo handle possible resize error.
                    if ( error ) {
                        return;
                    }

                    file.source = blob;
                    file.size = blob.size;
                    file.resized = true;
                    file.trigger( 'resize', blob.size, size );

                    tr.sendAsBlob( blob );
                } );
            } else {
                tr.sendAsBlob( file.source );
            }

            file.setStatus( Status.PROGRESS );

            fileHandler = function( cur, prev ) {
                if ( cur === Status.INVALID ) {
                    tr.cancel();
                    delete requests[ file.id ];
                    requestsLength--;
                    tr.off( 'all', trHandler );
                    tr.destroy();
                }

                if ( prev === Status.PROGRESS ) {
                    setTimeout( _tick, 1 );

                    if ( cur !== Status.INTERRUPT ) {
                        file.off( 'statuschange', fileHandler );
                    }
                }
            };

            file.on( 'statuschange', fileHandler );
        }

        // 只暴露此对象下的方法。
        api = {

            start: function() {

                // 移出invalid的文件
                $.each( api.getFiles( Status.INVALID ), function() {
                    api.removeFile( this );
                } );

                if ( runing || !stats.numOfQueue && !requestsLength ) {
                    return;
                }

                runing = true;

                // 如果有暂停的，则续传
                $.each( requests, function( id, transport ) {
                    var file = queue.getFile( id );
                    if ( file.getStatus() !== Status.PROGRESS ) {
                        file.setStatus( Status.PROGRESS, '' );
                        transport.resume();
                    }
                });

                api.trigger( 'startUpload' );
                setTimeout( _tick, 1 );
            },

            stop: function( interrupt ) {
                if ( runing === false ) {
                    return;
                }

                runing = false;

                interrupt && $.each( requests, function( id, transport ) {
                    var file = queue.getFile( id );
                    file.setStatus( Status.INTERRUPT );
                    transport.pause();
                } );

                api.trigger( 'stopUpload' );
            },

            isInProgress: function() {
                return !!runing;
            },

            getStats: function() {
                return {
                    successNum: stats.numOfSuccess,
                    queueFailNum: 0,
                    cancelNum: stats.numOfCancel,
                    invalidNum: stats.numOfInvalid,
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
                // setTimeout( _tick, 1 );
            },

            retry: function( file ) {

                if ( file ) {
                    file = file.id ? file : queue.getFile( file );
                    file.setStatus( Status.QUEUED );
                    api.start();
                    return;
                }

                var files = queue.getFiles( Status.ERROR ),
                    i = 0,
                    len = files.length;

                for( ; i < len; i++ ) {
                    file = files[ i ];
                    file.setStatus( Status.QUEUED );
                }

                api.start();
            },

            getFiles: function() {
                return queue.getFiles.apply( queue, arguments );
            }
        };

        Mediator.installTo( api );
        return api;
    }

    return UploadMgr;
} );