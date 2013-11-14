/**
 * @fileOverview 数据发送
 * @import base.js, core/uploader.js, core/file.js, lib/transport.js
 */
define( 'webuploader/widgets/upload', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/core/file',
    'webuploader/lib/transport' ], function( Base, Uploader, WUFile, Transport ) {

    var $ = Base.$,
        Status = WUFile.Status;

    $.extend(Uploader.options, {
        chunked: false,
        chunkSize: 5 * 1024 * 1024,
        chunkRetry: 2,
        threads: 3
    });

    function Wrapper( file, chunkSize ) {
        var pending = [],
            blob = file.source,
            end = blob.size,
            start, chunks, index;

        // 切割成小份
        if ( chunkSize && end > chunkSize ) {
            index = chunks = Math.ceil( end / chunkSize );
            while ( end ) {
                start = Math.max( 0, end - chunkSize );
                pending.push({
                    isChunk: true,
                    file: file,
                    start: start,
                    end: end,
                    total: blob.size,
                    chunks: chunks,
                    chunk: --index,
                    blob: blob.slice( start, end )
                });
                end = start;
            }
        } else {
            pending.push({
                total: end,
                start: 0,
                end: end,
                blob: blob,
                file: file
            });
        }

        file.blocks = pending.concat();
        file.remaning = pending.length;

        return {
            file: file,

            has: function() {
                return !!pending.length;
            },

            fetch: function() {
                return pending.shift();
            }
        }
    }

    Uploader.register({
        'start-upload': 'start',
        'stop-upload': 'stop',
        'is-in-progress': 'isInProgress'
    }, {

        init: function( opts ) {
            this.runing = false;
            this.pool = [];
            this.remaning = 0;
            this.__tick = Base.bindFn( this._tick, this );
        },

        start: function() {
            var me = this;

            // 移出invalid的文件
            $.each( me.request( 'get-files', Status.INVALID ), function() {
                me.request( 'remove-file', this );
            });

            if ( me.runing ) {
                return;
            }

            me.runing = true;

            // 如果有暂停的，则续传
            $.each( me.pool, function( _, v ) {
                if ( v.file.getStatus() === Status.INTERRUPT ) {
                    v.file.setStatus( Status.PROGRESS );
                    v.transport.send();
                }
            });

            me.owner.trigger( 'startUpload' );
            Base.nextTick( me.__tick );
        },

        stop: function( interrupt ) {
            var me = this;

            if ( me.runing === false ) {
                return;
            }

            me.runing = false;
            
            if ( interrupt ) {
                $.each( me.pool, function( _, v ) {
                    v.transport.abort();
                    v.file.setStatus( Status.INTERRUPT );
                });
            }

            me.owner.trigger( 'stopUpload' );
        },

        isInProgress: function() {
            return !!this.runing;
        },

        getStats: function() {
            return this.request( 'get-stats' );
        },

        _tick: function() {
            var me = this,
                opts = me.options,
                next;

            if ( me._tickPromise ) {
                me._tickPromise.always( me.__tick );
                return;
            }

            if ( me.pool.length < opts.threads && (next = me._getNext()) ) {
                if ( next.promise ) {
                    me._tickPromise = next;
                    next.then(function( value ) {
                        me._tickPromise = null;
                        value && me._startSend( value );
                        Base.nextTick( me.__tick );
                    });
                } else {
                    me._startSend( next );
                    Base.nextTick( me.__tick );
                }
            } else if ( !me.remaning && !me.getStats().numOfQueue ) {
                me.runing = false;

                me._trigged || Base.nextTick(function() {
                    me.owner.trigger( 'uploadFinished' );
                });
                me._trigged = true;
            }
        },

        _startSend: function( block ) {
            var me = this,
                owner = me.owner,
                opts = me.options,
                file = block.file,
                tr = new Transport( opts ),
                pool = me.pool,
                tick = me.__tick,
                cancelAll = function() {
                    // 把其他块取消了。
                    $.each( file.blocks, function( _, v ) {
                        var _tr = v.transport;

                        _tr && (_tr.abort(), _tr.destroy());
                    });
                    owner.trigger( 'uploadProgress', file, 1 );
                    owner.trigger( 'uploadComplete', file );
                },
                handler = function( cur, prev ) {
                    if ( cur === Status.INVALID ) {
                        cancelAll();
                        file.off( 'statuschange', handler );
                    }
                };

            file.on( 'statuschange', handler );
            tr.on( 'destroy', function() {
                var idx = $.inArray( tr, pool );

                me.remaning--;
                pool.splice( idx, 1 );

                file.off( 'statuschange', handler );
                block.transport =  null;
                Base.nextTick( tick );
            });

            tr.appendBlob( opts.fileVal, block.blob, file.name );
            tr.append({
                id: file.id,
                name: file.name,
                type: file.type,
                lastModifiedDate: file.lastModifiedDate,
                size: file.size
            });

            block.isChunk && tr.append({
                chunks: block.chunks,
                chunk: block.chunk
            });

            tr.on( 'progress', function( percentage ) {
                var totalPercent = 0,
                    uploaded = 0;

                totalPercent = block.percentage = percentage;

                if ( block.isChunk ) {    // 计算文件的整体速度。
                    $.each( file.blocks, function( _, v ) {
                        uploaded += (v.percentage || 0) * (v.end - v.start);
                    });

                    totalPercent = uploaded / file.size;
                }

                owner.trigger( 'uploadProgress', file, totalPercent || 0 );
            });

            tr.on( 'error', function( type ) {
                block.retried = block.retried || 0;
                
                // 自动重试
                if ( block.isChunk && ~'http,abort'.indexOf( type ) && block.retried < opts.chunkRetry ) {
                    block.retried++;
                    tr.send();
                } else {
                    owner.trigger( 'uploadError', file, type );
                    if ( file.getStats() === Status.PROGRESS ) {
                        file.setStatus( Status.ERROR, type );
                    }

                    cancelAll();
                }
            });

            tr.on( 'load', function() {
                var ret = tr.getResponseAsJson(),
                    headers = tr.getResponseHeader(),
                    reject, fn;

                ret._raw = tr.getResponse();
                fn = function( value ) {
                    reject = value;
                };

                if ( !owner.trigger( 'uploadAccept', file, ret, headers, fn ) ) {
                    reject = reject || 'server';
                }

                if ( reject ) {
                    tr.trigger( 'error', reject );
                } else {
                    owner.trigger( 'uploadSuccess', file, ret, headers );
                    file.remaning--;
                    if ( !file.remaning ) {
                        owner.request( 'after-send-file', [ file, ret, headers ], function() {
                            file.setStatus( Status.COMPLETE );
                            owner.trigger( 'uploadComplete', file );
                        }).fail(function( reason ) {
                            owner.trigger( 'uploadError', file, reason );
                            if ( file.getStats() === Status.PROGRESS ) {
                                file.setStatus( Status.ERROR, type );
                            }
                            cancelAll();
                        });
                    }
                    tr.destroy();
                }
            });

            pool.push({
                transport: tr,
                file: file,
                block: block
            });

            block.transport = tr;
            me.remaning++;
            me._trigged = false;
            tr.send();
        },

        _getNext: function() {
            var me = this,
                act = me._act,
                opts = me.options,
                file, deferred;

            if ( act && act.has() && act.file.getStatus() === Status.PROGRESS ) {
                return act.fetch();
            } else if ( me.runing && (file = me.request( 'fetch-file' )) ) {
                me.owner.trigger( 'uploadStart', file );
                file.setStatus( Status.PROGRESS );
                deferred = Base.Deferred();
                
                // hook 可能会需要压缩图片。
                me.request( 'before-send-file', file, function() {
                    if ( file.getStatus() === Status.PROGRESS ) {
                        me._act = act = new Wrapper( file, opts.chunked ? opts.chunkSize : 0 );
                        deferred.resolve( act.fetch() );
                    } else {

                        // skip this.
                        me.owner.trigger( 'uploadProgress', file, 1 );
                        me.owner.trigger( 'uploadComplete', file );
                        deferred.resolve( null );
                    }
                });

                return deferred.promise();
            }

            return null;
        }

    });
});