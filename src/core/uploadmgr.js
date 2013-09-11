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
        var thread = opts.thread || 3,
            queue = new Queue(),
            stats = queue.stats,
            Image = runtime.getComponent( 'Image' ),
            Transport = runtime.getComponent( 'Transport' ),
            runing = false,
            requests = {},
            requestsLength = 0,
            Status = WUFile.Status,
            api;

        function _tick() {
            while( runing && stats.numOfProgress < thread &&
                    stats.numOfQueue ) {

                _sendFile( queue.fetch() );
            }

            stats.numOfQueue || (runing = false);
            stats.numOfQueue || api.trigger( 'uploadFinished' );
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
                formData: {
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    lastModifiedDate: file.lastModifiedDate,
                    size: file.size
                }
            } );

            tr.on( 'all', function( type ) {
                var args = [].slice.call( arguments, 1 ),
                    status = {
                        error: Status.ERROR,
                        success: Status.COMPLETE
                    },
                    ret;

                args.unshift( file );
                args.unshift( 'upload' + type.substring( 0, 1 )
                    .toUpperCase() + type.substring( 1 ) );

                status[ type ] && file.setStatus( status[ type ] );
                ret = api.trigger.apply( api, args );

                // error or success.
                if ( type === 'complete' ) {
                    delete requests[ file.id ];
                    requestsLength--;
                    tr.off( 'all', arguments.callee );
                }

                return ret;
            } );

            requests[ file.id ] =  tr;
            requestsLength++;

            if ( opts.compress ) {
                Image.downsize( file.source, function( blob ) {
                    var size = file.size;

                    file.source = blob;
                    file.size = blob.size;
                    file.trigger( 'downsize', blob.size, size );

                    tr.sendAsBlob( blob );
                }, 1600, 1600 );
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
                if ( runing || !stats.numOfQueue && !requestsLength ) {
                    return;
                }
                runing = true;
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
                // 拷贝一份，以免被修改。
                return $.extend( {}, stats );
            },

            getFile: function() {
                return queue.getFile.apply( queue, arguments );
            },

            addFile: function( file ) {
                if ( !(file instanceof WUFile) ) {
                    file = new WUFile( file );
                }

                queue.append( file );
                api.trigger( 'fileQueued', file );
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
            }
        };

        Mediator.installTo( api );
        return api;
    }

    return UploadMgr;
} );