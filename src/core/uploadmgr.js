/**
 *
 * @fileOverview UploadMgr
 */
define( 'webuploader/core/uploadmgr', [ 'webuploader/base',
        'webuploader/core/file', 'webuploader/core/mediator'
        ], function( Base, File, Mediator ) {

    var $ = Base.$;

    function UploadMgr( opts, queue, runtime ) {
        var thread = opts.thread || 3,
            stats = queue.stats,
            Image = runtime.getComponent( 'Image' ),
            Transport = runtime.getComponent( 'Transport' ),
            runing = false,
            requests = {},
            requestsLength = 0,
            Status = File.Status,
            api;

        function _tick() {
            while( runing && stats.numOfProgress < thread &&
                    stats.numOfQueue ) {

                _sendFile( queue.fetch() );
            }

            stats.numOfQueue || (runing = true);
            runing || api.trigger( 'uploadFinished' );
        }

        function _sendFile( file ) {
            // 有必要？
            // 如果外部阻止了此文件上传，则跳过此文件
            if ( !api.trigger( 'uploadStart', file ) ) {

                // 先标记它是错误的。
                file.setStatus( Status.ERROR );
                return;
            }

            Image.downsize( file.source, function( blob ) {
                var tr = Transport.sendAsBlob( blob, {
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

                    if ( type === 'complete' ) {
                        delete requests[ file.id ];
                        requestsLength--;
                        tr.off( 'all', arguments.callee );
                    }

                    return ret;
                } );

                requests[ file.id ] =  tr;
                requestsLength++;

            }, 1600, 1600 );

            file.setStatus( Status.PROGRESS );

            file.on( 'statuschange', function( cur ) {
                switch( cur ) {
                    case Status.ERROR:
                    case Status.COMPLETE:
                        setTimeout( _tick, 1 );
                        file.off( 'statuschange', arguments.callee );
                        break;
                }
            } );
        }

        api = {

            start: function() {
                if ( runing || !queue.stats.numOfQueue && !requestsLength ) {
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

            pause: function( interrupt ) {
                runing = false;
                $.each( requests, function( id, transport ) {
                    var file = queue.getFile( id );
                    file.setStatus( Status.INTERRUPT,
                            interrupt ? '网络中断': '用户暂停' );
                    transport.pause();
                } );
            },

            cancelFile: function( file ) {
                file = file.id ? file : queue.getFile( file );

                if ( requests[ file.id ] ) {

                }
            }
        };

        Mediator.installTo( api );

        return api;
    }

    return UploadMgr;
} );