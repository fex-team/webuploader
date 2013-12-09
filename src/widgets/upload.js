/**
 * @fileOverview 负责文件上传相关。
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

    // 添加默认配置项
    $.extend( Uploader.options, {
        prepareNextFile: false,
        chunked: false,
        chunkSize: 5 * 1024 * 1024,
        chunkRetry: 2,
        threads: 3
    });

    // 负责将文件接片。
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
                chunk: index
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

            // 记录当前正在传的数据，跟threads相关
            this.pool = [];

            // 缓存即将上传的文件。
            this.pending = [];

            // 跟踪还有多少分片没有完成上传。
            this.remaning = 0;
            this.__tick = Base.bindFn( this._tick, this );

            owner.on( 'uploadComplete', function( file ) {
                // 把其他块取消了。
                file.blocks && $.each( file.blocks, function( _, v ) {
                    v.transport && v.transport.destroy();
                });

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
                    me._trigged = false;
                    v.transport.send();
                }
            });

            me.owner.trigger('startUpload');
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
            file.skipped = true;

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

                if ( Base.isPromise( next ) ) {
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

                return Base.isPromise( next ) ? next.then( done ) :
                        done( next );
            }

            return null;
        },

        _prepareNextFile: function() {
            var me = this,
                file = me.request('fetch-file'),
                pending = me.pending,
                promise;

            if ( file ) {

                promise = me.request( 'before-send-file', file, function() {

                    // 有可能文件被skip掉了。文件被skip掉后，状态坑定不是Queued.
                    if ( file.getStatus() === Status.QUEUED ) {
                        me.owner.trigger( 'uploadStart', file );
                        file.setStatus( Status.PROGRESS );
                        return file;
                    }

                    return me._finishFile( file );
                });

                // 如果还在pending中，则替换成文件本身。
                promise.done(function() {
                    var idx = $.inArray( promise, pending );

                    ~idx && pending.splice( idx, 1, file );
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
                tick = me.__tick;

            // 从pool中移除，并调用tick，看后面还是否有要上传的。
            tr.on( 'destroy', function() {
                var idx = $.inArray( tr, pool );

                me.remaning--;
                pool.splice( idx, 1 );

                delete block.transport;
                Base.nextTick( tick );
            });

            // 广播上传进度。以文件为单位。
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

            // 尝试重试，然后广播文件上传出错。
            tr.on( 'error', function( type ) {
                block.retried = block.retried || 0;

                // 自动重试
                if ( block.chunks > 1 && ~'http,abort'.indexOf( type ) &&
                        block.retried < opts.chunkRetry ) {

                    block.retried++;
                    tr.send();

                } else {
                    file.setStatus( Status.ERROR, type );
                    owner.trigger( 'uploadError', file, type );
                    owner.trigger( 'uploadComplete', file );
                }
            });

            // 上传成功
            tr.on( 'load', function() {
                var ret = tr.getResponseAsJson(),
                    hd = tr.getResponseHeader(),
                    reject, fn;

                ret._raw = tr.getResponse();
                fn = function( value ) {
                    reject = value;
                };

                // 服务端响应了，不代表成功了，询问是否响应正确。
                if ( !owner.trigger( 'uploadAccept', block, ret, hd, fn ) ) {
                    reject = reject || 'server';
                }

                // 如果非预期，转向上传出错。
                if ( reject ) {
                    tr.trigger( 'error', reject );
                    return;
                }

                owner.trigger( 'uploadSuccess', file, ret, hd );
                file.remaning--;

                if ( file.remaning ) {
                    tr.destroy()
                } else {

                    // 全部上传完成。
                    me._finishFile( file, ret, hd ).always(function() {
                        owner.trigger( 'uploadComplete', file );
                    });
                }
            });

            pool.push({
                transport: tr,
                file: file,
                block: block
            });

            block.transport = tr;
            me.remaning++;

            // 如果没有分片，则直接使用原始的。
            // 不会丢失content-type信息。
            block.blob = block.chunks === 1 ? file.source :
                    file.source.slice( block.start, block.end );

            me.request( 'before-send', block, function() {
                var data = {},
                    headers = {};

                // 配置默认的上传字段。
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
                // 如果默认的字段不够使用，可以通过监听此事件来扩展
                owner.trigger( 'uploadBeforeSend', block, data, headers );

                // 开始发送。
                tr.appendBlob( opts.fileVal, block.blob, file.name );
                tr.append( data );
                tr.setRequestHeader( headers );
                tr.send();
            });
        },

        _finishFile: function( file, ret, headers ) {
            var owner = this.owner;

            return owner
                    .request( 'after-send-file', arguments, function() {
                        file.setStatus( Status.COMPLETE );
                        owner.trigger( 'uploadComplete', file );
                    })
                    .fail(function( reason ) {
                        if ( file.getStatus() === Status.PROGRESS ) {
                            file.setStatus( Status.ERROR, reason );
                        }
                        owner.trigger( 'uploadError', file, reason );
                    });
        }

    });
});