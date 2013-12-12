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
        isPromise = Base.isPromise,
        Status = WUFile.Status;

    // 添加默认配置项
    $.extend( Uploader.options, {

        // 是否允许在文件传输时提前把下一个文件准备好。
        // 对于一个文件的准备工作比较耗时，比如图片压缩，md5序列化。
        // 如果能提前在当前文件传输期处理，可以节省总体耗时。
        prepareNextFile: false,

        // 是否要分片
        chunked: false,

        // 如果要分片，分多大一片？
        chunkSize: 5 * 1024 * 1024,

        // 如果某个分片由于网络问题出错，允许自动重传多少次？
        chunkRetry: 2,

        // 上传并发数。
        threads: 3
    });

    // 负责将文件切片。
    function CuteFile( file, chunkSize ) {
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
                    v.transport && (v.transport.abort(), v.transport.destroy());
                    delete v.transport;
                });

                delete file.blocks;
                delete file.remaning;
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
                var file = v.file;

                if ( file.getStatus() === Status.INTERRUPT ) {
                    file.setStatus( Status.PROGRESS );
                    me._trigged = false;
                    v.transport && v.transport.send();
                }
            });

            me._trigged = false;
            me.owner.trigger('startUpload');
            Base.nextTick( me.__tick );
        },

        stop: function( interrupt ) {
            var me = this;

            if ( me.runing === false ) {
                return;
            }

            me.runing = false;

            interrupt && $.each( me.pool, function( _, v ) {
                v.transport && v.transport.abort();
                v.file.setStatus( Status.INTERRUPT );
            });

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
                fn, val;

            // 上一个promise还没有结束，则等待完成后再执行。
            if ( me._promise ) {
                return me._promise.always( me.__tick );
            }

            // 还有位置，且还有文件要处理的话。
            if ( me.pool.length < opts.threads && (val = me._nextBlock()) ) {
                me._trigged = false;

                fn = function( val ) {
                    me._promise = null;

                    // 有可能是reject过来的，所以要检测val的类型。
                    val && val.file && me._startSend( val );
                    Base.nextTick( me.__tick );
                };

                me._promise = isPromise( val ) ? val.always( fn ) : fn( val );

            // 没有要上传的了，且没有正在传输的了。
            } else if ( !me.remaning && !me.getStats().numOfQueue ) {
                me.runing = false;

                me._trigged || Base.nextTick(function() {
                    me.owner.trigger('uploadFinished');
                });
                me._trigged = true;
            }
        },

        _nextBlock: function() {
            var me = this,
                act = me._act,
                opts = me.options,
                next, done;

            // 如果当前文件还有没有需要传输的，则直接返回剩下的。
            if ( act && act.has() &&
                    act.file.getStatus() === Status.PROGRESS ) {

                // 是否提前准备下一个文件
                if ( opts.prepareNextFile && !me.pending.length ) {
                    me._prepareNextFile();
                }

                return act.fetch();

            // 否则，如果正在运行，则准备下一个文件，并等待完成后返回下个分片。
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

                    act = CuteFile( file, opts.chunked ? opts.chunkSize : 0 );
                    me._act = act;
                    return act.fetch();
                };

                // 文件可能还在prepare中，也有可能已经完全准备好了。
                return isPromise( next ) ? next.then( done ) : done( next );
            }
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

                // befeore-send-file的钩子就有错误发生。
                promise.fail( function( reason ) {
                    file.setStatus( Status.ERROR, reason );
                    me.owner.trigger( 'uploadError', file, type );
                    me.owner.trigger( 'uploadComplete', file );
                });

                pending.push( promise );
            }
        },

        // 让出位置了，可以让其他分片开始上传
        _popBlock: function( block ) {
            var idx = $.inArray( block, this.pool );

            this.pool.splice( idx, 1 );
            block.file.remaning--;
            this.remaning--;
        },

        // 开始上传，可以被掉过。如果promise被reject了，则表示跳过此分片。
        _startSend: function( block ) {
            var me = this,
                file = block.file,
                promise;

            me.pool.push( block );
            me.remaning++;

            // 如果没有分片，则直接使用原始的。
            // 不会丢失content-type信息。
            block.blob = block.chunks === 1 ? file.source :
                    file.source.slice( block.start, block.end );

            // hook, 每个分片发送之前可能要做些异步的事情。
            promise = me.request( 'before-send', block, function() {

                // 有可能文件已经上传出错了，所以不需要再传输了。
                if ( file.getStatus() === Status.PROGRESS ) {
                    me._doSend( block );
                } else {
                    me._popBlock( block );
                    Base.nextTick( me.__tick );
                }
            });

            // 如果为fail了，则跳过此分片。
            promise.fail(function() {
                if ( file.remaning === 1 ) {
                    me._finishFile( file ).always(function() {
                        block.percentage = 1;
                        me._popBlock( block );
                        me.owner.trigger( 'uploadComplete', file );
                        Base.nextTick( me.__tick );
                    });
                } else {
                    block.percentage = 1;
                    me._popBlock( block );
                    Base.nextTick( me.__tick );
                }
            });
        },

        // 做上传操作。
        _doSend: function( block ) {
            var me = this,
                owner = me.owner,
                opts = me.options,
                file = block.file,
                tr = new Transport( opts ),
                data = $.extend({}, opts.formData ),
                headers = $.extend({}, opts.headers );

            block.transport = tr;

            tr.on( 'destroy', function() {
                delete block.transport;
                me._popBlock( block );
                Base.nextTick( me.__tick );
            });

            // 广播上传进度。以文件为单位。
            tr.on( 'progress', function( percentage ) {
                var totalPercent = 0,
                    uploaded = 0;

                // 可能没有abort掉，progress还是执行进来了。
                // if ( !file.blocks ) {
                //     return;
                // }

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

                // 全部上传完成。
                if ( file.remaning === 1 ) {
                    me._finishFile( file, ret, hd );
                } else {
                    tr.destroy();
                }
            });

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
        },

        // 完成上传。
        _finishFile: function( file, ret, hds ) {
            var owner = this.owner;

            return owner
                    .request( 'after-send-file', arguments, function() {
                        file.setStatus( Status.COMPLETE );
                        owner.trigger( 'uploadSuccess', file, ret, hds );
                    })
                    .fail(function( reason ) {

                        // 如果外部已经标记为invalid什么的，不再改状态。
                        if ( file.getStatus() === Status.PROGRESS ) {
                            file.setStatus( Status.ERROR, reason );
                        }

                        owner.trigger( 'uploadError', file, reason );
                    })
                    .always(function() {
                        owner.trigger( 'uploadComplete', file );
                    });
        }

    });
});