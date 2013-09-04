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
            api;

        function _tick() {
            while( runing && stats.numOfProgress < thread &&
                    stats.numOfQueue ) {

                _sendFile( queue.fetch() );
            }

            runing = stats.numOfQueue;
            runing || api.trigger( 'uploadFinished' );
        }

        function _sendFile( file ) {
            // 有必要？
            // 如果外部阻止了此文件上传，则跳过此文件
            if ( !api.trigger( 'uploadStart', file ) ) {

                // 先标记它是错误的。
                file.setStatus( File.Status.ERROR );
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
                            error: File.Status.ERROR,
                            complete: File.Status.COMPLETE
                        },
                        ret;

                    args.unshift( file );
                    args.unshift( 'upload' + type.substring( 0, 1 )
                        .toUpperCase() + type.substring( 1 ) );

                    status[ type ] && file.setStatus( status[ type ] );
                    ret = api.trigger.apply( api, args );

                    if ( ~[ 'error', 'complete' ].indexOf( type ) ) {
                        setTimeout(function() {
                            delete requests[ file.id ];
                            requestsLength--;
                            _tick();
                        }, 1 );
                    }

                    return ret;
                } );

                requests[ file.id ] =  tr;
                requestsLength++;

            }, 1600, 1600 );

            file.setStatus( File.Status.PROGRESS );
        }

        api = {

            start: function() {
                if ( runing || !queue.stats.numOfQueue && !requestsLength ) {
                    return;
                }

                runing = true;
                $.each( requests, function( id, transport ) {
                    transport.resume();
                });
                _tick();
            },

            pause: function() {
                runing = false;
                $.each( requests, function( id, transport ) {
                    transport.pause();
                });
            }
        };

        Mediator.installTo( api );

        return api;
    }

    return UploadMgr;
} );