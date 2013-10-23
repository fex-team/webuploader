/**
 * @fileOverview 组件基类。
 * @import widget.js
 */
define( 'webuploader/widgets/uploadmgr', [ 
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/core/file',
    'webuploader/core/queue' ], function( 
        Base, Uploader, WUFile, Queue ) {

    var $ = Base.$,
        Status = WUFile.Status;

    return Uploader.register(
        {
            'start-upload': 'start',
            'stop-upload': 'stop',
            'is-in-progress': 'isInProgress'
        },

        {
            events: {
                // 'filesin': 'addFile',
                // '.transport': 'handleTransport'
            },
            init: function( opts ) {
                var me = this;

                this.threads = opts.threads || 3;
                this.runing = false;
                this.requestsLength = 0;
                
            },

            _tick: function() {
                var me = this,
                    stats = me.getStats();

                while( me.runing && stats.numOfProgress < me.threads &&
                        stats.numOfQueue ) {

                    me._sendFile( me.request( 'fetch-file' ) );
                }

                if ( !stats.numOfQueue && !me.requestsLength ) {
                    me.runing = false;
                    me.owner.trigger( 'uploadFinished' );
                }
            },

            _sendFile: function( file ) {
                var me = this,
                    trHandler,
                    fileHandler;

                me.owner.trigger( 'uploadStart', file );

                // tr = new Transport( opts );

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

                    if ( type === 'error' ) {
                        file.setStatus( Status.ERROR, args[ 2 ] );
                    } else if ( type === 'success' ) {
                        file.setStatus( Status.COMPLETE );
                    } else if ( type === 'progress' ) {
                        file.loaded = file.size * args[ 2 ];
                    } else if ( type === 'complete' &&
                            file.getStatus() !== Status.INTERRUPT ) {

                        // 如果是interrupt中断了，还需重传的。
                        // delete me.requests[ file.id ];
                        me.request( 'remove-transport', [ file.id ] );
                        me.requestsLength--;
                        // tr.off( 'all', trHandler );
                        // tr.destroy();
                    }

                    me.owner.trigger.apply( me.owner, args );
                };

                // tr.on( 'all', trHandler );
                

                // requests[ file.id ] =  tr;
                me.requestsLength++;

                if ( me.options.resize && (file.type === 'image/jpg' ||
                        file.type === 'image/jpeg') && !file.resized ) {

                    // @todo 如果是重新上传，则不需要再resize.
                    /*
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
                    */
                   me.request( 'image-resize', [ file.source ,
                    function( error, blob ) {
                        var size = file.size;

                        // @todo handle possible resize error.
                        if ( error ) {
                            return;
                        }

                        file.source = blob;
                        file.size = blob.size;
                        file.resized = true;
                        file.trigger( 'resize', blob.size, size );

                        me.request( 'send-blob', [ file, trHandler ] );
                    } ]);
                } else {
                    me.request( 'send-blob', [ file, trHandler ] );
                }

                file.setStatus( Status.PROGRESS );

                fileHandler = function( cur, prev ) {
                    if ( cur === Status.INVALID ) {
                        // tr.cancel();
                        // delete me.requests[ file.id ];
                        me.request( 'remove-transport', [ file.id ] );
                        me.requestsLength--;
                        // tr.off( 'all', trHandler );
                        // tr.destroy();
                    }

                    if ( prev === Status.PROGRESS ) {
                        Base.nextTick( Base.bindFn( me._tick, me ) );
                        // setTimeout( _tick, 1 );

                        if ( cur !== Status.INTERRUPT ) {
                            file.off( 'statuschange', fileHandler );
                        }
                    }
                };

                file.on( 'statuschange', fileHandler );
            },

            getStats: function( ) {
                if ( !this.stats ) {
                    this.stats = this.request( 'get-stats' );
                }

                return this.stats;
            },

            start: function() {
                var me = this;

                // 移出invalid的文件
                $.each( me.request( 'get-files', [ Status.INVALID ] ), function() {
                    me.request( 'remove-file', [ this ] );
                    me.request( 'cancel-transport', [ this.id ] );
                } );

                if ( me.runing || !me.getStats().numOfQueue && !me.requestsLength ) {
                    return;
                }

                me.runing = true;

                // 如果有暂停的，则续传
                me.request( 'resume-transports', [ this.id ] );

                /*
                $.each( me.requests, function( id, transport ) {
                    var file = queue.getFile( id );
                    if ( file.getStatus() !== Status.PROGRESS ) {
                        file.setStatus( Status.PROGRESS, '' );
                        transport.resume();
                    }
                });
                */

                me.owner.trigger( 'startUpload' );
                Base.nextTick( Base.bindFn( me._tick, me ) );
                // setTimeout( _tick, 1 );
            },

            stop: function( interrupt ) {
                var me = this;

                if ( me.runing === false ) {
                    return;
                }

                me.runing = false;

                if ( interrupt ) {
                    me.request( 'pause-all' );
                }

                me.owner.trigger( 'stopUpload' );
            },

            isInProgress: function() {
                return !!this.runing;
            }
    });
    
} );