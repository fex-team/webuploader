/**
 * @fileOverview 数据发送
 */
define([
    '/base',
    '/core/uploader',
    '/core/file',
    '/lib/transport',
    'widget'
], function( Base, Uploader, WUFile, Transport ) {

    var $ = Base.$,
        Status = WUFile.Status;

    $.extend( Uploader.options, {
        prepareNextFile: false,
        chunked: false,
        chunkSize: 5 * 1024 * 1024,
        chunkRetry: 2,
        threads: 3
    });

    function Wrapper( file, chunkSize ) {
        var pending = [],
            blob = file.source,
            end = blob.size,
            chunks = chunkSize ? Math.ceil( end / chunkSize ) : 1,
            index = chunks,
            start;

        while ( index-- ) {
            start = Math.max( 0, end - chunkSize );
            pending.push({
                file: file,
                start: start,
                end: end,
                total: blob.size,
                chunks: chunks,
                chunk: index,
                blob: chunks === 1 ? blob : blob.slice( start, end )
            });
            end = start;
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
        };
    }

    Uploader.register({
        'start-upload': 'start',
        'stop-upload': 'stop',
        'skip-file': 'skipFile',
        'is-in-progress': 'isInProgress'
    }, {

        init: function() {
            var owner = this.owner;

            this.runing = false;
            this.pool = [];
            this.pending = [];
            this.remaning = 0;
            this.__tick = Base.bindFn( this._tick, this );

            owner.on( 'uploadComplete', function( file ) {
                delete file.blocks;
                delete file.remaning;
                owner.trigger( 'uploadProgress', file, 1 );
            });
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

            me.owner.trigger('startUpload');
            me._trigged = false;
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

            me.owner.trigger('stopUpload');
        },

        isInProgress: function() {
            return !!this.runing;
        },

        getStats: function() {
            return this.request('get-stats');
        },

        skipFile: function( file, status ) {
            file = this.request( 'get-file', file );

            file.setStatus( status || Status.COMPLETE );

            // 如果正在上传。
            file.blocks && $.each( file.blocks, function( _, v ) {
                var _tr = v.transport;

                if ( _tr ) {
                    _tr.abort();
                    _tr.destroy();
                    delete v.transport;
                }
            });

            this.owner.trigger( 'uploadSkip', file );
        },

        _tick: function() {
            var me = this,
                opts = me.options,
                next;

            if ( me._tickPromise ) {
                return me._tickPromise.always( me.__tick );
            }

            // 是否还有位置。
            if ( me.pool.length < opts.threads &&
                    (next = me._getNextBlock()) ) {

                me._trigged = false;

                if ( next.promise ) {
                    me._tickPromise = next.done(function( value ) {
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
                    me.owner.trigger('uploadFinished');
                });
                me._trigged = true;
            }
        },

        _getNextBlock: function() {
            var me = this,
                act = me._act,
                opts = me.options,
                next, done;

            if ( act && act.has() &&
                    act.file.getStatus() === Status.PROGRESS ) {

                // 是否提前准备下一个文件
                if ( opts.prepareNextFile && !me.pending.length ) {
                    me._prepareNextFile();
                }

                return act.fetch();
            } else if ( me.runing ) {

                // 如果缓存中有，则直接在缓存中取，没有则去queue中取。
                if ( !me.pending.length && me.getStats().numOfQueue ) {
                    me._prepareNextFile();
                }

                next = me.pending.shift();

                done = function( file ) {
                    if ( !file ) {
                        return null;
                    }

                    me._act = act = new Wrapper( file,
                            opts.chunked ? opts.chunkSize : 0 );
                    return act.fetch();
                };

                return next && next.promise ? next.then( done ) : done( next );
            }

            return null;
        },

        _prepareNextFile: function() {
            var file = this.request('fetch-file'),
                pending = this.pending,
                owner = this.owner,
                promise;

            if ( file ) {
                owner.trigger( 'uploadStart', file );
                file.setStatus( Status.PROGRESS );

                promise = this.request( 'before-send-file', file, function() {
                    var idx = $.inArray( promise, pending );

                    // 有可能已经移出去了。
                    ~idx && pending.splice( idx, 1, file );    // 替换成文件

                    if ( file.getStatus() === Status.PROGRESS ) {
                        return file;
                    }

                    // @todo 优化这里
                    // 在before-send-file有可能直接把文件的status改成了error或complete
                    // 可以跳过文件上传。
                    return owner
                            .request( 'after-send-file', file, function() {
                                file.setStatus( Status.COMPLETE );
                                owner.trigger( 'uploadComplete', file );
                            })
                            .fail(function( reason ) {
                                if ( file.getStatus() === Status.PROGRESS ) {
                                    file.setStatus( Status.ERROR, reason );
                                }
                                owner.trigger( 'uploadError', file, reason );
                            })
                            .always(function() {
                                // skip this.
                                owner.request( 'skip-file', file );
                                return null;
                            });
                });

                pending.push( promise );
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
                    owner.trigger( 'uploadComplete', file );
                };

            tr.on( 'destroy', function() {
                var idx = $.inArray( tr, pool );

                me.remaning--;
                pool.splice( idx, 1 );

                block.transport =  null;
                Base.nextTick( tick );
            });
            tr.on( 'progress', function( percentage ) {
                var totalPercent = 0,
                    uploaded = 0;

                totalPercent = block.percentage = percentage;

                if ( block.chunks > 1 ) {    // 计算文件的整体速度。
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
                if ( block.chunks > 1 && ~'http,abort'.indexOf( type ) &&
                        block.retried < opts.chunkRetry ) {

                    block.retried++;
                    tr.send();

                } else {

                    if ( file.getStatus() === Status.PROGRESS ) {
                        file.setStatus( Status.ERROR, type );
                    }

                    owner.trigger( 'uploadError', file, type );
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

                if ( !owner.trigger( 'uploadAccept', block, ret, headers,
                        fn ) ) {

                    reject = reject || 'server';
                }

                if ( reject ) {
                    tr.trigger( 'error', reject );
                } else {
                    owner.trigger( 'uploadSuccess', file, ret, headers );
                    file.remaning--;

                    file.remaning || owner
                            .request( 'after-send-file', [ file, ret,
                                    headers ], function() {

                                file.setStatus( Status.COMPLETE );
                                owner.trigger( 'uploadComplete', file );

                            })
                            .fail(function( reason ) {
                                if ( file.getStatus() === Status.PROGRESS ) {
                                    file.setStatus( Status.ERROR, reason );
                                }
                                owner.trigger( 'uploadError', file, reason );
                                cancelAll();
                            });

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

            me.request( 'before-send', block, function() {
                var data = {},
                    headers = {};

                data = $.extend( data, {
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    lastModifiedDate: file.lastModifiedDate,
                    size: file.size
                });

                block.chunks > 1 && $.extend( data, {
                    chunks: block.chunks,
                    chunk: block.chunk
                });

                // 在发送之间可以添加字段什么的。。。
                owner.trigger( 'uploadBeforeSend', block, data, headers );
                tr.appendBlob( opts.fileVal, block.blob, file.name );
                tr.append( data );
                tr.setRequestHeader( headers );

                tr.send();
            });
        }

    });
});