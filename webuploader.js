/* WebUploader 0.1.0 */
(function( window, undefined ) {
    /**
     * @fileOverview 实现amd js功能，大部分的代码都是通过amd规范组织起来的，
     * 此文件主要当代码不在AMD环境下时使用。也就是说如果你的应用已经是用了RequireJS的话
     * 此文件完全没有必要打包进来。
     */
    var amd = (function( exports, undefined ) {
            var modules = {};
    
            function require( deps, callback ) {
                var args = [],
                    len = deps.length,
                    i = -1,
                    dep,
                    module;
    
                while ( ++i < len ) {
                    dep = deps[ i ];
                    module = modules[ dep ] || exports[ dep ];
    
                    if ( !module ) {
                        throw new Error( '模块没有定义' + dep );
                    }
    
                    args.push( module );
                }
    
                callback.apply( null, args );
            }
    
            function define( id, deps, definition ) {
                if ( typeof id !== 'string' ) {
                    throw new Error( '模块定义必须以字符串形式指定' );
                }
    
                if ( deps === undefined ) {
                    throw new Error( '依赖格式不正确' );
                }
    
                if ( definition === undefined ) {
                    throw new Error( '模块定义工厂方法格式不正确' );
                }
    
                require( deps, function() {
                    modules[ id ] = definition.apply( null, arguments );
                } );
            }
    
            return {
                require: require,
                define: define
            };
        })( window ),
    
        /* jshint unused: false */
        require = amd.require,
        define = amd.define;

    /**
     * @fileOverview 基础类方法。其他模块中最好不要直接用jQuery, 而是通过Base来使用。
     * jQuery中有的方法，在jQuery中实现，jQuery外的方法在此方法中实现。
     */
    define( 'webuploader/base', [ 'jQuery' ], function( $ ) {
        var noop = function() {};
    
        return {
            $: $,
    
            version: '0.1.0',
    
            /**
             * 实现类与类之间的继承。
             * @method inherits
             * @param  {Function} super 父类
             * @param  {Object | Function} [protos] 子类或者对象。如果对象中包含constructor，子类将是用此属性值。
             * @param  {Object} [staticProtos] 静态属性或方法。
             * @return {Function} 返回子类。
             * @example
             * function Person() {
             *     console.log( 'Super' );
             * }
             * Person.prototype.hello = function() {
             *     console.log( 'hello' );
             * }
             *
             * var Manager = Base.inherits( Person, {
             *     world: function() {
             *         console.log( 'World' );
             *     }
             * } );
             *
             * // 因为没有指定构造器，父类的构造器将会执行。
             * var instance = new Manager();    // => Super
             *
             * // 继承子父类的方法
             * instance.hello();    // => hello
             * instance.world();    // => World
             *
             * // 子类的__super__属性指向父类
             * console.log( Manager.__super__ === Person );    // => true
             */
            inherits: function( Super, protos, staticProtos ) {
                var child;
    
                if ( typeof protos === 'function' ) {
                    child = protos;
                    protos = null;
                } else if ( protos && protos.hasOwnProperty( 'constructor' ) ) {
                    child = protos.constructor;
                } else {
                    child = function() {
                        return Super.apply( this, arguments );
                    };
                }
    
                // 复制静态方法
                $.extend( true, child, Super, staticProtos || {} );
    
                /* jshint camelcase: false */
    
                // 让子类的__super__属性指向父类。
                child.__super__ = Super.prototype;
    
                // 构建原型，添加原型方法或属性。
                // 暂时用Object.create实现。
                child.prototype = Object.create( Super.prototype );
                protos && $.extend( true, child.prototype, protos );
    
                return child;
            },
    
            notImplement: function() {
                throw new Error( 'Not Implemented!' );
            },
    
            noop: noop,
    
            log: (function(){
                if ( window.console.log ) {
                    return function() {
                        console.log.apply( console, arguments );
                    };
                }
                return noop;
            })(),
    
            // Change the context of a function.
            bindFn: function( fn, context ) {
                return fn.bind ? fn.bind( context ) : function() {
                    return fn.apply( context, arguments );
                };
            }
        };
    } );

    /**
     * @fileOverview Mediator
     */
    define( 'webuploader/core/mediator', [ 'webuploader/base' ], function( Base ) {
        var $ = Base.$,
            slice = [].slice,
            protos;
    
        // 根据条件过滤出事件handlers.
        function findHandlers( arr, name, callback, context ) {
            // @todo IE8不支持filter，需要换种写法。
            return arr.filter(function( handler ) {
                return handler &&
                        (!name || handler.e === name) &&
                        (!callback || handler.cb === callback ||
                        handler.cb._cb === callback) &&
                        (!context || handler.ctx === context);
            });
        }
    
        function triggerHanders( events, args ) {
            var stoped = false,
                i = -1,
                len = events.length,
                handler;
    
            while ( ++i < len ) {
                handler = events[ i ];
    
                if ( handler.cb.apply( handler.ctx2, args ) === false ) {
                    stoped = true;
                    break;
                }
            }
            return !stoped;
        }
    
        protos = {
    
            /**
             * 绑定事件。
             * @method on
             * @grammar on( name, fn[, context] ) => self
             * @param  {String}   name     事件名
             * @param  {Function} callback 事件处理器
             * @param  {Object}   context  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             * @class Mediator
             */
            on: function( name, callback, context ) {
                var me = this,
                    handler, set;
    
                if ( !callback ) {
                    return this;
                }
    
                set = this._events || (this._events = []);
    
                handler = { e: name };
    
                handler.cb = callback;
                handler.ctx = context;
                handler.ctx2 = context || me;
                handler.id = set.length;
    
                set.push( handler );
    
                return this;
            },
    
            /**
             * 绑定事件，且当handler执行完后，自动解除绑定。
             * @method once
             * @grammar once( name, fn[, context] ) => self
             * @param  {String}   name     事件名
             * @param  {Function} callback 事件处理器
             * @param  {Object}   context  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             */
            once: function( name, callback, context ) {
                var me = this,
                    once;
    
                if ( !callback ) {
                    return me;
                }
    
                once = function() {
                    me.off( name, once );
                    return callback.apply( context || me, arguments );
                };
    
                once._cb = callback;
                me.on( name, once, context );
    
                return me;
            },
    
            /**
             * 解除事件绑定
             * @method off
             * @grammar off( name[, fn[, context] ] ) => self
             * @param  {String}   name     事件名
             * @param  {Function} callback 事件处理器
             * @param  {Object}   context  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             */
            off: function( name, callback, context ) {
                var events = this._events;
    
                if ( !events ) {
                    return this;
                }
    
                if ( !name && !callback && !context ) {
                    this._events = [];
                    return this;
                }
    
                findHandlers( events, name, callback, context )
                        .forEach(function( handler ) {
                            delete events[ handler.id ];
                        });
    
                return this;
            },
    
            /**
             * 触发事件
             * @method trigger
             * @grammar trigger( name[, ...] ) => self
             * @param  {String}   type     事件名
             * @param  {*} [...] 任意参数
             * @return {Boolean} 如果handler中return false了，则返回false, 否则返回true
             */
            trigger: function( type ) {
                var args, events, allEvents;
    
                if ( !this._events || !type ) {
                    return this;
                }
    
                args = slice.call( arguments, 1 );
                events = findHandlers( this._events, type );
                allEvents = findHandlers( this._events, 'all' );
    
                return triggerHanders( events, args ) &&
                        triggerHanders( allEvents, arguments );
            }
        };
    
        /**
         * 中介者，它本身是个单例，但可以通过[installTo](#WebUploader:Mediator:installTo)方法，使任何对象具备事件行为。
         * 主要目的是负责模块与模块之间的合作，降低耦合度。
         * @class Mediator
         */
        return $.extend( {
    
            /**
             * 可以通过这个接口，使任何对象具备事件功能。
             * @method installTo
             * @param  {Object} obj 需要具备事件行为的对象。
             * @return {Object} 返回obj.
             */
            installTo: function( obj ) {
                return $.extend( obj, protos );
            }
    
        }, protos );
    } );

    /**
     * @fileOverview 文件属性封装
     */
    define( 'webuploader/core/file', [
            'webuploader/base',
            'webuploader/core/mediator'
        ], function( Base, Mediator ) {
    
            var $ = Base.$,
                idPrefix = 'WU_FILE_',
                idSuffix = 0,
                rExt = /\.([^.]+)$/,
                statusMap = {};
    
            function gid() {
                return idPrefix + idSuffix++;
            }
    
            /**
             * 构造函数
             * @class 文件
             * @constructor File
             * @param {DOMFile|Object} domfile     HTML5 File对象或者自定义对象
             */
            function WUFile( file ) {
    
                // if ( !file || !('name' in file) ) {
                //     throw new Error( 'File构造函数参数错误!' );
                // }
    
                /**
                 * 文件名，包括扩展名
                 * @property name
                 * @type {string}
                 */
                this.name = file.name || 'Untitled';
    
                /**
                 * 文件体积（字节）
                 * @property size
                 * @type {int}
                 * @default 0
                 */
                this.size = file.size || 0;
    
                /**
                 * 文件MIMETYPE类型，与文件类型的对应关系请参考 http://t.cn/z8ZnFny
                 * @property type
                 * @type {string}
                 * @default ''
                 */
                this.type = file.type || 'image/png';
    
                /**
                 * 文件最后修改日期
                 * @property lastModifiedDate
                 * @type {int}
                 * @default 当前时间戳
                 */
                this.lastModifiedDate = file.lastModifiedDate || (new Date() * 1);
    
                /**
                 * 文件ID，每个对象具有唯一ID，与文件名无关
                 * @property id
                 * @type {string}
                 */
                this.id = gid();
    
                /**
                 * 文件扩展名，通过文件名获取，例如test.png的扩展名为png
                 * @property ext
                 * @type {string}
                 */
                this.ext = rExt.exec( file.name ) ? RegExp.$1 : '';
    
    
                /**
                 * 状态文字说明。
                 * @property statusText
                 * @type {string}
                 */
                this.statusText = '';
    
                /**
                 * 文件上传成功后对应的服务器端URL
                 * @property url
                 * @type {string}
                 * @default ''
                 */
                // this.url = '';
    
                // 存储文件状态，防止通过属性直接修改
                statusMap[ this.id ] = WUFile.Status.INITED;
    
                this.source = file;
    
                this.on( 'error', function( msg ) {
                    this.setStatus( WUFile.Status.ERROR, msg );
                } );
            }
    
            $.extend( WUFile.prototype, {
    
                /**
                 * 设置状态，状态变化时会触发`change`事件。
                 *
                 * @method setStatus
                 * @param  {File.Status} status 状态
                 * @example
                         文件状态具体包括以下几种类型：
                         {
                             // 初始化
                            INITED:     0,
                            // 已入队列
                            QUEUED:     1,
                            // 正在上传
                            PROGRESS:     2,
                            // 上传出错
                            ERROR:         3,
                            // 上传成功
                            COMPLETE:     4,
                            // 上传取消
                            CANCELLED:     5
                        }
                 */
                setStatus: function( status, text ) {
    
                    var prevStatus = statusMap[ this.id ];
    
                    typeof text !== 'undefined' && (this.statusText = text);
    
                    if ( status !== prevStatus ) {
                        statusMap[ this.id ] = status;
                        /**
                         * 文件状态变化
                         * @event statuschange
                         */
                        this.trigger( 'statuschange', status, prevStatus );
                    }
    
                },
    
                /**
                 * 获取文件状态
                 * @return {File.Status}
                 * @example
                         文件状态具体包括以下几种类型：
                         {
                             // 初始化
                            INITED:     0,
                            // 已入队列
                            QUEUED:     1,
                            // 正在上传
                            PROGRESS:     2,
                            // 上传出错
                            ERROR:         3,
                            // 上传成功
                            COMPLETE:     4,
                            // 上传取消
                            CANCELLED:     5
                        }
                 */
                getStatus: function() {
                    return statusMap[ this.id ];
                },
    
                /**
                 * 获取文件原始信息。
                 * @return {*}
                 */
                getSource: function() {
                    return this.source;
                },
    
                destory: function() {
                    delete statusMap[ this.id ];
                }
            } );
    
            Mediator.installTo( WUFile.prototype );
    
            WUFile.Status = {
                INITED:     'inited',
                QUEUED:     'queued',
                PROGRESS:   'progress',
                ERROR:      'error',
                COMPLETE:   'complete',
                CANCELLED:  'cancelled',
                INTERRUPT:  'interrupt',
                INVALID:     'invalid'
            };
    
            return WUFile;
        }
    );

    /**
     * @fileOverview 错误信息
     */
    define( 'webuploader/core/error', [], function() {
    
    		return {
    
    			QUEUE: {
    				EXCEED_NUM_LIMIT: 101,
    				EXCEED_SIZE_LIMIT: 102,
    				EMPTY_FILE: 103, 
    				INVALID_TYPE: 104
    			},
    
    			UPLOAD: {
    				HTTP: 201,
    				CANCELLED: 202
    			}
    		};
        }
    );

    /**
     * @fileOverview 文件队列
     */
    define( 'webuploader/core/queue', [
            'webuploader/base',
            'webuploader/core/mediator',
            'webuploader/core/error',
            'webuploader/core/file'
    	], function( Base, Mediator, Error, WUFile ) {
    
            var $ = Base.$,
                STATUS = WUFile.Status;
    
            /**
             * 文件队列
             *
             * @class  Queue
             * @constructor
             */
            function Queue() {
    
                this.stats = {
                    numOfQueue: 0,
                    numOfQueueFailed: 0,
                    numOfSuccess: 0,
                    numOfCancel: 0,
                    numOfProgress: 0,
                    numOfUploadFailed: 0,
                    numOfInvalid: 0
                };
    
                // 上传队列，仅包括等待上传的文件
                this._queue = [];
    
                // 存储所有文件
                this._map = {};
            }
    
            $.extend( Queue.prototype, {
    
                /**
                 * 将新文件加入对队列尾部
                 *
                 * @method append
                 * @param  {File} file   文件对象
                 * @param  {Mixed} [source] 文件内容源，例如DOM File/Blob/Base64 String
                 *                          文件首次加入队列时必须携带该参数
                 */
                append: function( file ) {
                    this._queue.push( file );
                    this._fileAdded( file );
                    return this;
                },
    
                /**
                 * 将新文件加入对队列头部
                 *
                 * @method prepend
                 * @param  {File} file   文件对象
                 * @param  {Mixed} [source] 文件内容源，例如DOM File/Blob/Base64 String
                 *                          文件首次加入队列时必须携带该参数
                 */
                prepend: function( file ) {
                    this._queue.unshift( file );
                    this._fileAdded( file );
                    return this;
                },
    
                /**
                 * 获取文件对象
                 *
                 * @method getFile
                 * @param  {String} fileId   文件ID
                 * @return {File}
                 */
                getFile: function( fileId ) {
                    if ( typeof fileId !== 'string' ) {
                        return fileId;
                    }
                    return this._map[ fileId ];
                },
    
                /**
                 * 从队列中取出一个指定状态的文件。
                 */
                fetch: function( status ) {
                    var len = this._queue.length,
                        i, file;
    
                    status = STATUS.QUEUED;
    
                    for( i = 0; i < len; i++ ) {
                        file = this._queue[ i ];
    
                        if ( status === file.getStatus() ) {
                            return file;
                        }
                    }
    
                    return null;
                },
    
                // 获取指定类型的文件列表
                getFiles: function(/*status1, status2...*/) {
                    var sts = [].slice.call( arguments, 0 ),
                        ret = [],
                        i = 0,
                        len = this._queue.length,
                        file;
    
                    for( ; i < len; i++ ) {
                        file = this._queue[ i ];
    
                        if ( sts.length && !~sts.indexOf( file.getStatus() ) ) {
                            continue;
                        }
    
                        ret.push( file );
                    }
    
                    return ret;
                },
    
                _fileAdded: function( file ) {
                    var me = this,
                        existing = this._map[ file.id ];
    
                    if ( !existing ) {
                        this._map[ file.id ] = file;
    
                        file.on( 'statuschange', function( cur, pre ) {
                            me._onFileStatusChange( cur, pre );
                        } );
                    }
    
                    file.setStatus( STATUS.QUEUED );
                },
    
                _onFileStatusChange: function( curStatus, preStatus ) {
                    var stats = this.stats;
    
                    switch ( preStatus ) {
                        case STATUS.PROGRESS:
                            stats.numOfProgress--;
                            break;
    
                        case STATUS.QUEUED:
                            stats.numOfQueue --;
                            break;
    
                        case STATUS.ERROR:
                            stats.numOfUploadFailed--;
                            break;
                    }
    
                    switch ( curStatus ) {
                        case STATUS.QUEUED:
                            stats.numOfQueue++;
                            break;
    
                        case STATUS.PROGRESS:
                            stats.numOfProgress++;
                            break;
    
                        case STATUS.ERROR:
                            stats.numOfUploadFailed++;
                            break;
    
                        case STATUS.COMPLETE:
                            stats.numOfSuccess++;
                            break;
    
                        case STATUS.CANCELLED:
                            stats.numOfCancel++;
                            break;
    
                        case STATUS.INVALID:
                            status.numOfInvalid++;
                            break;
                    }
                }
    
            } );
    
            Mediator.installTo( Queue.prototype );
    
            return Queue;
        }
    );

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
    
                tr = new Transport( opts );
    
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

    /**
     * @fileOverview Runtime管理器，负责Runtime的选择。
     * @import base.js
     */
    define( 'webuploader/core/runtime', [ 'webuploader/base',
            'webuploader/core/mediator' ], function( Base, Mediator ) {
    
        var $ = Base.$,
            factories = {},
            separator = /\s*,\s*/,
            runtime;
    
        function Runtime( opts, type, caps ) {
            var me = this,
                klass = me.constructor;
    
            caps = caps || {};
    
            // 执行detect hooks
            $.each( klass.getDetects(), function( key, val ) {
                $.extend( caps, val() );
            } );
    
            caps = $.extend( {
    
                // 是否能调正图片大小
                resizeImage: false,
    
                // 是否能选择图片
                selectFile: false,
    
                // 是否能多选
                selectMultiple: false,
    
                // 是否支持文件过滤
                filterByExtension: false,
    
                // 是否支持拖放
                dragAndDrop: false
    
            }, caps );
    
            $.extend( this, {
                klass: klass,
    
                type: type,
    
                caps: caps,
    
                options: opts
            } );
        }
    
        Runtime.prototype = {
    
            /**
             * 判断是否具备指定的能力
             * @todo
             * @method capable
             * @return {Boolean}
             */
            capable: function( requiredCaps ) {
                var caps, i, len;
    
                if ( typeof requiredCaps === 'string' ) {
                    caps = requiredCaps.split( separator );
                } else if ( $.isPlainObject( requiredCaps ) ) {
                    caps = [];
                    $.each( requiredCaps, function( k, v ) {
                        v && caps.push( k );
                    } );
                }
    
                for( i = 0, len = caps.length; i < len; i++ ) {
                    if ( !this.caps[ caps[ i ] ] ) {
                        return false;
                    }
                }
    
                return true;
            },
    
            hasComponent: function( name ) {
                return !!this.klass.components[ name ];
            },
    
            /**
             * 获取component, 每个Runtime中component只会实例化一次。
             */
            getComponent: function( name ) {
                var component = this.klass.components[ name ];
    
                if ( !component ) {
                    throw new Error( 'Component ' + name + ' 不存在' );
                }
    
                if ( typeof component === 'function' ) {
                    Mediator.installTo( component.prototype );
                    component.prototype.runtime = this;
                } else {
                    Mediator.installTo( component );
                    component.runtime = this;
                }
    
                return component;
            },
    
            destory: function() {
            }
        };
    
        // 使Runtime具有事件能力
        Mediator.installTo( Runtime.prototype );
    
        Runtime.orders = 'html5,flash';
    
        /**
         * 添加运行时类型。
         * @method addRuntime
         * @param  {[type]} type    [description]
         * @param  {[type]} factory [description]
         * @return {[type]}         [description]
         */
        Runtime.addRuntime = function( type, factory ) {
            factories[ type ] = factory;
        };
    
        /**
         * 获取运行时，根据能力按照指定顺便，找到第一个具有此能力的运行时。
         * @method getInstance
         * @param  {Object} [opts] 配置项
         * @param {String | Object} [caps] 需要的能力
         * @param {String} [orders='html5,flash'] 运行时检测顺序。
         */
        Runtime.getInstance = function( opts, orders ) {
            var factory, caps;
    
            // 如果已经实例化过，则直接返回。
            if ( runtime ) {
                return runtime;
            }
    
            caps = opts.requiredCaps;
            orders = (orders || Runtime.orders).split( separator );
            $.each( orders, function( i, type ) {
                factory = factories[ type ];
    
                if ( !factory ) {
                    return;
                }
    
                runtime = new factory( opts );
    
                if ( !runtime.capable( caps ) ) {
                    runtime.destory();
                    runtime = null;
                } else {
                    return false;
                }
            } );
    
            if ( !runtime ) {
                throw new Error( '找不到合适的runtime, 当前浏览器不支持某些html5特性' );
            }
    
            return runtime;
        };
    
        // 添加检测函数，在Runtime初始化的时候执行。
        Runtime.addDetect = function( fn ) {
            var pool = this.detects || (this.detects = []);
    
            pool.push( fn );
        };
    
        Runtime.getDetects = function() {
            return this.detects || [];
        };
    
        Runtime.register = function( name, component ) {
            var pool = this.components || (this.components = {});
    
            pool[ name ] = component;
            return this;
        };
    
        return Runtime;
    } );

    /**
     * @fileOverview Uploader上传类
     */
    define( 'webuploader/core/uploader', [ 'webuploader/base',
            'webuploader/core/mediator',
            'webuploader/core/uploadmgr',
            'webuploader/core/runtime'
            ], function( Base, Mediator, UploadMgr, Runtime ) {
    
        var $ = Base.$,
            defaultOpts = {
                threads: 3,
                compress: true,
                server: '../server/fileupload.php',
                pick: {
                    multiple: true,
                    id: 'uploaderBtn'
                },
                accept: [{
                    title: 'image',
                    extensions: 'gif,jpg,jpeg,bmp,png'
                }],
                dnd: '',
                paste: '',
                fileSizeLimit: 0,
                fileNumLimit: 0,
                duplicate: false,
                resize: {
                    width: 1600,
                    height: 1600,
                    quality: 90
                }
            };
    
        function Uploader( opts ) {
            this.options = $.extend( true, {}, defaultOpts, opts || {} );
            this._connectRuntime( this.options, Base.bindFn( this._init, this ) );
            Mediator.trigger( 'uploaderInit', this );
        }
    
        Uploader.defaultOptions = defaultOpts;
        Mediator.installTo( Uploader.prototype );
    
        $.extend( Uploader.prototype, {
            state: 'pedding',
    
            _init: function() {
                var me = this,
                    opts = this.options;
    
                opts.pick && me.addButton( opts.pick );
                opts.dnd && me._initDnd( opts );
                opts.paste && me._initFilePaste( opts );
    
                me._initNetWorkDetect();
    
                me._mgr = UploadMgr( opts, me._runtime );
    
                // 转发所有的事件出去。
                me._mgr.on( 'all', function() {
                    return me.trigger.apply( me, arguments );
                });
    
                me.state = 'inited';
                me.trigger( 'ready' );
            },
    
            _initDnd: function( opts ) {
                var me = this,
                    options = $.extend( {}, {
                        id: opts.dnd,
                        accept: opts.accept
                    } ),
                    Dnd = me._runtime.getComponent( 'Dnd' ),
                    dnd;
    
                dnd = new Dnd( options );
    
                dnd.on( 'drop', function( files ) {
                    me.addFiles( files );
                } );
                dnd.init();
            },
    
            _initFilePaste: function( opts ) {
                var runtime = Runtime.getInstance(),
                    me = this,
                    options = $.extend( {}, {
                        id: opts.paste,
                        accept: opts.accept
                    } ),
                    FilePaste = runtime.getComponent( 'FilePaste' ),
                    paste;
    
                paste = new FilePaste( options );
    
                paste.on( 'paste', function( files ) {
                    me.addFiles( files );
                } );
                paste.init();
            },
    
            _initNetWorkDetect: function() {
                var me = this,
                    Network = me._runtime.getComponent( 'Network' );
    
                Network.getInstance().on( 'all', function() {
                    return me.trigger.apply( me, arguments );
                } );
            },
    
            // todo 根据opts，告诉runtime需要具备哪些能力
            _connectRuntime: function( opts, cb ) {
                var caps = {
                        resizeImage: true
                    },
    
                    runtime;
    
                if ( opts.pick ) {
                    caps.selectFile = true;
    
                    caps.selectMultiple = opts.pick.multiple;
                }
    
                $.extend( opts, { requiredCaps: caps } );
                this._runtime = runtime = Runtime.getInstance( opts );
                runtime.once( 'ready', cb );
                runtime.init();
            },
    
            addButton: function( pick ) {
                if ( typeof pick === 'string' ) {
                    pick = {
                        id: pick
                    };
                }
    
                var me = this,
                    opts = me.options,
                    options = $.extend( {}, pick, {
                        accept: opts.accept
                    } ),
                    FilePicker = me._runtime.getComponent( 'FilePicker' ),
                    picker;
    
                picker = new FilePicker( options );
    
                picker.on( 'select', function( files ) {
                    me.addFiles( files );
                } );
                picker.init();
            },
    
            makeThumb: function( file, cb, width, height ) {
                var runtime = this._runtime,
                    Image = runtime.getComponent( 'Image' );
    
                file = this.getFile( file );
    
                Image.makeThumbnail( file.getSource(), function( ret ) {
                    var img = document.createElement( 'img' );
                    img.src = ret;
                    cb( img );
                }, width, height, true );
            },
    
            formatSize: function( size, pointLength ) {
                var units = [ 'B', 'K', 'M', 'TB' ],
                    unit = units.shift();
    
                while ( size > 1024 && units.length ) {
                    unit = units.shift();
                    size = size / 1024;
                }
    
                return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                        unit;
            },
    
            // ----------------------------------------------
            // 中转到uploadMgr中去。
            // ----------------------------------------------
    
            /**
             * 开始上传
             * @method upload
             */
            upload: function() {
                return this._mgr.start.apply( this._mgr, arguments );
            },
    
            stop: function() {
                return this._mgr.stop.apply( this._mgr, arguments );
            },
    
            getFile: function() {
                return this._mgr.getFile.apply( this._mgr, arguments );
            },
    
            addFile: function() {
                return this._mgr.addFile.apply( this._mgr, arguments );
            },
    
            addFiles: function() {
                return this._mgr.addFiles.apply( this._mgr, arguments );
            },
    
            removeFile: function() {
                return this._mgr.removeFile.apply( this._mgr, arguments );
            },
    
            getStats: function() {
                return this._mgr.getStats.apply( this._mgr, arguments );
            },
    
            retry: function() {
                return this._mgr.retry.apply( this._mgr, arguments );
            },
    
            getFiles: function() {
                return this._mgr.getFiles.apply( this._mgr, arguments );
            },
    
            // 需要重写此方法来来支持opts.onEvent和instance.onEvent的处理器
            trigger: function( type/*, args...*/ ) {
                var args = [].slice.call( arguments, 1 ),
                    opts = this.options,
                    name = 'on' + type.substring( 0, 1 ).toUpperCase() +
                        type.substring( 1 );
    
                if ( Mediator.trigger.apply( this, arguments ) === false ) {
                    return false;
                }
    
                if ( $.isFunction( opts[ name ] ) &&
                        opts[ name ].apply( this, args ) === false ) {
                    return false;
                }
    
                if ( $.isFunction( this[ name ] ) &&
                        this[ name ].apply( this, args ) === false ) {
                    return false;
                }
    
                return true;
            }
    
        } );
    
        Base.create = function( opts ) {
            return new Uploader( opts );
        };
    
        return Uploader;
    } );
    

    /**
     * @fileOverview Html5Runtime
     */
    define( 'webuploader/core/runtime/html5/runtime', [
            'webuploader/base',
            'webuploader/core/runtime'
        ], function( Base, Runtime ) {
    
            var type = 'html5';
    
            function Html5Runtime( opts ) {
                Runtime.call( this, opts, type );
            }
    
            Base.inherits( Runtime, {
                constructor: Html5Runtime,
    
                // ---------- 原型方法 ------------
    
                // 不需要连接其他程序，直接trigger ready
                init: function() {
                    this.trigger( 'ready' );
                }
    
            } );
    
            // 注册html5运行时。
            Runtime.addRuntime( type, Html5Runtime );
    
            return Html5Runtime;
        } );

    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define( 'webuploader/core/runtime/html5/util', [ 'webuploader/base',
            'webuploader/core/runtime/html5/runtime'
            ], function( Base ) {
    
        var $ = Base.$,
            urlAPI = window.createObjectURL && window ||
                window.URL && URL.revokeObjectURL && URL ||
                webkitURL
    
        return {
            createObjectURL: urlAPI.createObjectURL,
            revokeObjectURL: urlAPI.revokeObjectURL,
    
            // 限制fileReader, 因为不能回收，所以只能共用。
            getFileReader: (function(){
                var throttle = 3,
                    pool = [],
                    wating = [];
    
                function _tick() {
                    var avaibles = [],
                        i, fr, cb;
    
                    for ( i = 0; i < throttle; i++ ) {
                        fr = pool[ i ];
                        fr && fr.readyState === 2 && avaibles.push( fr );
                    }
    
                    while ( avaibles.length && wating.length ) {
                        fr = avaibles.shift();
                        cb = wating.shift();
                        fr.onload = fr.onerror = null;
                        cb( fr );
                        fr.onloadend = _tick;
                    }
                }
    
                return function( cb ) {
                    var fr;
    
                    if ( pool.length < throttle ) {
                        fr = new FileReader();
                        pool.push( fr );
                        cb( fr );
                        fr.onloadend = _tick;
                        return;
                    }
    
                    wating.push( cb );
                    _tick();
                }
            })(),
    
            dataURL2Blob: function( dataURI ) {
                var byteStr, intArray, i, mimetype, bb, parts;
    
                parts = dataURI.split( ',' );
                if ( ~parts[ 0 ].indexOf( 'base64' ) ) {
                    byteStr = atob( parts[ 1 ] );
                } else {
                    byteStr = decodeURIComponent( parts[ 1 ] );
                }
    
                intArray = new Uint8Array( byteStr.length );
    
                for ( i = 0; i < byteStr.length; i++ ) {
                    intArray[ i ] = byteStr.charCodeAt( i );
                }
    
                mimetype = parts[ 0 ].split( ':' )[ 1 ].split( ';' )[ 0 ];
    
                return new Blob( [ intArray ], { type: mimetype } );
            },
    
            dataURL2ArrayBuffer: function( dataURI ) {
                var byteStr, intArray, i, bb, parts;
    
                parts = dataURI.split( ',' );
                if ( ~parts[ 0 ].indexOf( 'base64' ) ) {
                    byteStr = atob( parts[ 1 ] );
                } else {
                    byteStr = decodeURIComponent( parts[ 1 ] );
                }
    
                intArray = new Uint8Array( byteStr.length );
    
                for ( i = 0; i < byteStr.length; i++ ) {
                    intArray[ i ] = byteStr.charCodeAt( i );
                }
    
                return intArray.buffer;
            },
    
            arrayBufferToBlob: function( buffer, type ) {
                var intArray = new Uint8Array( buffer );
                return new Blob( [ intArray ], type ? { type: type } : {} );
            },
    
            binaryString2DataURL: function( bin ) {
                // todo.
            }
        }
    } );

    /**
     * @fileOverview Dnd
     */
    define( 'webuploader/core/runtime/html5/dnd', [
            'webuploader/base',
            'webuploader/core/mediator',
            'webuploader/core/runtime/html5/runtime'
        ], function( Base, Mediator, Html5Runtime ) {
    
            var $ = Base.$,
                defaultOpts = {
                    id: '',
    
                    accept: [{
                        title: 'image',
                        extensions: 'gif,jpg,bmp,jpeg'
                    }]
                };
    
            function Dnd( opts ) {
                this.options = $.extend( {}, defaultOpts, opts );
            }
    
            $.extend( Dnd.prototype, {
    
                init: function() {
                    var me = this,
                        opts = me.options,
                        elem = $( opts.id ),
                        triggerFiles = [];
    
                    var isAcceptType = function( type ) {
                        var acceptStr = [],
                            _tmp = [],
                            len,
                            ii,
                            i;
    
                        if ( opts.accept && opts.accept.length > 0 ) {
                            for (i = 0, len = opts.accept.length; i < len; i++) {
                                _tmp = opts.accept[i].extensions.split( ',' );
                                for (ii = 0; ii < _tmp.length; ii++) {
                                    acceptStr.push(  opts.accept[i].title + '/' + _tmp[ii] );
                                };
                            };
                            acceptStr = acceptStr.join(',');
    
                            if ( type != '' && acceptStr.indexOf( type ) > -1) {
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return true;
                        }
                    };
    
                    var traverseDirectoryTree = function( entry ) {
                        var dirReader,
                            i;
    
                        if ( entry.isDirectory ) {
                            dirReader = entry.createReader();
                            dirReader.readEntries( function( entries ) {
    
                                for ( i = 0; i < entries.length; i++ ) {
    
                                    if ( entries[i].isFile ) {
                                        entries[i].file( function( file ) {
                                            if ( isAcceptType( file.type ) ) {
                                                triggerFiles.push( file );
                                            }
                                        }, function( fileError ) {
                                            console.log('fileError');
                                        } );
                                    } else {
                                        triggerFiles.push( traverseDirectoryTree( entries[i] ) );
                                    }
    
                                }
    
                            }, function( fileError ) {});
                        }
                    };
    
                    if ( !elem.length ) {
                        throw new Error( '找不到元素#' + opts.id );
                    }
    
                    elem.on( 'dragenter', function( e ) {
                        elem.addClass( 'webuploader-dnd-over' );
                    } );
    
                    elem.on( 'dragover', function( e ) {
                        e.stopPropagation();
                        e.preventDefault();
                        elem.addClass( 'webuploader-dnd-over' );
                    } );
    
                    elem.on( 'drop', function( e ) {
                        var evt = e.originalEvent || e,
                            dataTrans = evt.dataTransfer,
                            files = evt.dataTransfer.files,
                            _tmp,
                            len,
                            i;
        
                        e.stopPropagation();
                        e.preventDefault();
    
                        for (i = 0, len = files.length; i < len; i++) {
                            if ( files[i].type && isAcceptType( files[i].type ) ) {
                                triggerFiles.push( files[i] );
                            } else if ( dataTrans.items && dataTrans.items[i].webkitGetAsEntry ) {
                                //文件夹处理
                                traverseDirectoryTree( dataTrans.items[i].webkitGetAsEntry() );
                            }
                        };
    
                        me.trigger( 'drop', triggerFiles );
                        evt.dataTransfer.clearData();
                        triggerFiles = [];
                        elem.removeClass( 'webuploader-dnd-over' );
                    } );
    
                    elem.on( 'dragleave', function( e ) {
                        elem.removeClass( 'webuploader-dnd-over' );
                    } );
                }
    
            } );
    
    
            Html5Runtime.register( 'Dnd', Dnd );
    
            /* jshint camelcase:false */
    
            // 告诉Runtime，支持哪些能力
            // 这个方法会在选择时执行，好处是按需执行。
            Html5Runtime.addDetect(function() {
                // todo 需要运行时检测。
    
                return {
    
                    // 是否能选择图片
                    select_file: true,
    
                    // 是否能多选
                    select_multiple: true,
    
                    // 是否支持文件过滤
                    filter_by_extension: true
                };
            });
    
            return Dnd;
        } );

    /**
     * @fileOverview FilePaste
     */
    define( 'webuploader/core/runtime/html5/filepaste', [
            'webuploader/base',
            'webuploader/core/mediator',
            'webuploader/core/runtime/html5/runtime'
        ], function( Base, Mediator, Html5Runtime ) {
    
            var $ = Base.$,
                defaultOpts = {
                    id: '',
    
                    accept: [{
                        title: 'image',
                        extensions: 'gif,jpg,bmp,png'
                    }]
                };
    
            function FilePaste( opts ) {
                this.options = $.extend( {}, defaultOpts, opts );
            }
    
            $.extend( FilePaste.prototype, {
    
                init: function() {
                    var me = this,
                        opts = me.options,
                        elem = $( opts.id );
    
                    if ( !elem.length ) {
                        throw new Error( '找不到元素#' + opts.id );
                    }
    
                    elem.on( 'paste', function( e ) {
                        var files,
                            triggerFiles = [],
                            acceptStr = [],
                            _tmp = [],
                            len,
                            ii,
                            i;
    
                        e.stopPropagation();
                        e.preventDefault();
                        e = e.originalEvent || e;
                        files = e.clipboardData.items;
    
                        if ( opts.accept && opts.accept.length > 0 ) {
                            for (i = 0, len = opts.accept.length; i < len; i++) {
                                _tmp = opts.accept[i].extensions.split( ',' );
                                for (ii = 0; ii < _tmp.length; ii++) {
                                    acceptStr.push(  opts.accept[i].title + '/' + _tmp[ii] );
                                };
                            };
                            acceptStr = acceptStr.join(',');
                        }
    
                        for (i = 0, len = files.length; i < len; i++) {
                            if ( acceptStr != '' ) {
                                if ( files[i].type != '' && acceptStr.indexOf( files[i].type ) > -1 ) {
                                    triggerFiles.push( files[i].getAsFile() );
                                }
                            } else {
                                triggerFiles.push( files[i].getAsFile() );
                            }
    
                        };
    
                        me.trigger( 'paste', triggerFiles );
                    } );
    
                }
    
    
            } );
    
    
            Html5Runtime.register( 'FilePaste', FilePaste );
            return FilePaste;
        } );

    /**
     * @fileOverview FilePicker
     */
    define( 'webuploader/core/runtime/html5/filepicker', [
            'webuploader/base',
            'webuploader/core/mediator',
            'webuploader/core/runtime/html5/runtime'
        ], function( Base, Mediator, Html5Runtime ) {
    
            var $ = Base.$,
                defaultOpts = {
                    id: '',
                    name: 'file',
                    multiple: true,
    
                    accept: [{
                        title: 'image',
                        extensions: 'gif,jpg,bmp'
                    }]
                };
    
            function FilePicker( opts ) {
                this.options = $.extend( {}, defaultOpts, opts );
            }
    
            $.extend( FilePicker.prototype, {
    
                init: function() {
                    var me = this,
                        opts = me.options,
                        elem = $( opts.id ),
                        i,
                        ii,
                        len,
                        acceptStr = [],
                        extStr = [],
                        label,
                        input,
                        inputId;
    
                    if ( !elem.length ) {
                        throw new Error( '找不到元素#' + opts.id );
                    }
    
                    inputId = opts.name ? opts.name : ( 'btn' + Date.now() );
                    input = $( document.createElement( 'input' ) );
                    label = $( document.createElement( 'label' ) );
    
                    input.attr({
                        type: 'file',
                        id: inputId
                    });
                    // input.addClass( 'webuploader-btn-input' );
    
    
                    label.addClass( 'webuploader-btn' );
                    label.html( opts.btnName || elem.text() || '选择文件' );
                    label.attr( 'for', inputId );
    
                    if ( opts.multiple ) {
                        input.attr( 'multiple', 'multiple' );
                    }
    
                    if ( opts.accept && opts.accept.length > 0 ) {
                        for (i = 0, len = opts.accept.length; i < len; i++) {
                            extStr = opts.accept[i].extensions.split( ',' );
                            for (var ii = 0; ii < extStr.length; ii++) {
                                acceptStr.push( opts.accept[i].title + '/' + extStr[ii] );
                            };
                        };
                        input.attr( 'accept', acceptStr.join( ',' ) );
                    }
    
                    if ( opts.btnClass) {
                        label.addClass( opts.btnClass );
                    }
    
                    input.on( 'change', function( e ) {
                        me.trigger( 'select', e.target.files );
                    } );
    
                    // label.on( 'mouseover', function( e ) {
                    //     label.addClass( 'webuploader-btn-hover' );
                    // } );
    
                    // label.on( 'mouseout', function( e ) {
                    //     label.removeClass( 'webuploader-btn-hover' );
                    // } );
    
                    elem.empty().addClass( 'webuploader-pick' ).append( input );
                    elem.append( label );
                }
    
    
            } );
    
    
            Html5Runtime.register( 'FilePicker', FilePicker );
    
            /* jshint camelcase:false */
    
            // 告诉Runtime，支持哪些能力
            // 这个方法会在选择时执行，好处是按需执行。
            Html5Runtime.addDetect(function() {
                // todo 需要运行时检测。
    
                return {
    
                    // 是否能选择图片
                    selectFile: true,
    
                    // 是否能多选
                    selectMultiple: true,
    
                    // 是否支持文件过滤
                    filteByExtension: true
                };
            });
    
            return FilePicker;
        } );

    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define( 'webuploader/core/runtime/html5/image', [ 'webuploader/base',
            'webuploader/core/runtime/html5/runtime',
            'webuploader/core/runtime/html5/util'
            ], function( Base, Html5Runtime, util ) {
    
        var $ = Base.$,
            rdataurl = /^data:/i;
    
        function Html5Image( opts ) {
            var me = this,
                img = new Image();
    
            me.options = $.extend( true, {} , Html5Image.defaultOptions, opts );
    
            img.onload = function() {
                var ImageMeta = me.ImageMeta,
                    len = ImageMeta.maxMetaDataSize;
    
                me.width = img.width;
                me.height = img.height;
    
                me.state = 'loaded';
    
                // 读取meta信息。
                if ( me.type === 'image/jpeg' && ImageMeta ) {
                    me._fileRead( me._blob.slice( 0, len ) , function( ret ) {
                        me.metas = ImageMeta.parse( ret );
                        me.trigger( 'load' );
                    }, 'readAsArrayBuffer' );
                } else {
                    me.trigger( 'load' );
                }
            };
    
            me.ImageMeta = me.runtime.getComponent( 'ImageMeta' );
            me._img = img;
        }
    
        Html5Image.defaultOptions = {
            quality: 90,
            crossOrigin: 'Anonymous',
            downsize: {
                crop: false,
                width: 1600,
                height: 1600
            }
        };
    
        $.extend( Html5Image.prototype, {
    
            // flag: 标记是否被修改过。
            modified: false,
    
            type: 'image/png',
    
            width: 0,
            height: 0,
    
            /**
             * @method load
             */
            load: function( source ) {
                var me = this,
                    img, blob;
    
                me.state = 'pedding';
    
                // 如果已经是blob了，则直接loadAsBlob
                if ( source instanceof Blob ) {
                    me._loadAsBlob( source );
                } else if( rdataurl.test( source ) ) {
                    blob = util.dataURL2Blob( source );
                    me._loadAsBlob( blob );
                } else {
                    // 如果是uri, 远程图片地址，或者ObjectUrl
                    // 注意此方法load进来的图片是不带head meta信息的。
                    // 如果需要head meta信息，需要改用xhr去读取二进制数据。
                    img = new Image();
                    img.crossOrigin = me.crossOrigin;
                    img.onload = function() {
                        var canvas = document.createElement( 'canvas' );
                        canvas.width = img.width;
                        canvas.height = img.height;
                        me._renderImageToCanvas( canvas, img, 0, 0 );
                        blob = util.dataURL2Blob( canvas.toDataURL( 'image/png' ) );
                        me._loadAsBlob( blob );
    
                        canvas.getContext( '2d' )
                            .clearRect( 0, 0, canvas.width, canvas.height );
                        canvas.width = canvas.height = 0;
                        img = img.onload = canvas = null;
                    };
                    img.src = source;
                }
                return me;
            },
    
            downsize: function( width, height, crop ) {
                var opts = this.options,
                    canvas = this._canvas ||
                        (this._canvas = document.createElement( 'canvas' ));
    
                width = width || opts.downsize.width;
                height = height || opts.downsize.height;
                crop = typeof crop === 'undefined' ? opts.downsize.crop : crop;
    
                this._resize( canvas, width, height, crop, true );
                this.width = width;
                this.height = height;
    
                this._blob = null;    // 没用了，可以删掉了。
                this.modified = true;
            },
    
            /**
             * 创建缩略图，但是不会修改原始图片大小。
             */
            makeThumbnail: function( width, height, crop, type, quality ) {
                var opts = this.options,
                    canvas = document.createElement( 'canvas' ),
                    result;
    
                type = type || this.type;
                quality = quality || opts.quality;
                this._resize( canvas, width, height, crop );
    
                if ( type === 'image/jpeg' ) {
                    result = canvas.toDataURL( 'image/jpeg', quality / 100 );
                } else {
                    result = canvas.toDataURL( type );
                }
    
                canvas.getContext( '2d' )
                        .clearRect( 0, 0, canvas.width, canvas.height );
                canvas.width = canvas.height = 0;
                canvas = null;
    
                return result;
            },
    
            toBlob: function( type, quality ) {
                var blob = this._blob,
                    canvas;
    
                type = type || this.type;
                quality = quality || this.quality;
    
                // blob需要重新生成。
                if ( this.modified || this.type !== type ) {
                    canvas = this._canvas;
    
                    if ( type === 'image/jpeg' ) {
                        blob = canvas.toDataURL( 'image/jpeg', quality / 100 );
    
                        if ( this.metas && this.metas.imageHead ) {
                            blob = util.dataURL2ArrayBuffer( blob );
                            blob = this.ImageMeta.updateImageHead( blob,
                                    this.metas.imageHead );
                            return util.arrayBufferToBlob( blob, type );
                        }
    
                    } else {
                        blob = canvas.toDataURL( type );
                    }
    
                    blob = util.dataURL2Blob( blob );
                }
    
                return blob;
            },
    
            destroy: function() {
                var canvas = this._canvas;
                this.off();
                this._img.onload = null;
    
                if ( canvas ) {
                    canvas.getContext( '2d' )
                            .clearRect( 0, 0, canvas.width, canvas.height );
                    canvas.width = canvas.height = 0;
                    this._canvas = null;
                }
    
                this._img = this._blob = null;
            },
    
            _loadAsBlob: function( blob ) {
                var me = this,
                    img = this._img;
    
                me._blob = blob;
                me.type = blob.type;
                img.src = util.createObjectURL( blob );
                me.once( 'load', function() {
                    util.revokeObjectURL( img.src );
                } );
            },
    
            _resize: function( canvas, width, height, crop, preserveHeaders ) {
                // 调用时机不对。
                if ( this.state !== 'loaded' ) {
                    return;
                }
    
                var img = this._img,
                    naturalWidth = img.width,
                    naturalHeight = img.height,
                    orientation = this.metas && this.metas.exif &&
                        this.metas.exif.get( 'Orientation' ) || 1,
                    scale, w, h, x, y;
    
                 // values that require 90 degree rotation
                if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {
    
                    // 交换width, height的值。
                    width ^= height;
                    height ^= width;
                    width ^= height;
                }
    
                scale = Math[ crop ? 'max' : 'min' ]( width / naturalWidth,
                        height / naturalHeight );
    
                // 不允许放大。
                scale = Math.min( 1, scale );
    
                w = naturalWidth * scale;
                h = naturalHeight * scale;
    
                if ( crop ) {
                    canvas.width = width;
                    canvas.height = height;
                } else {
                    canvas.width = w;
                    canvas.height = h;
                }
    
                x = w > canvas.width ? (w - canvas.width) / 2  : 0;
                y = h > canvas.height ? (h - canvas.height) / 2 : 0;
    
                preserveHeaders || this._rotateToOrientaion( canvas, orientation );
    
                this._renderImageToCanvas( canvas, img, -x, -y, w, h );
            },
    
            _rotateToOrientaion: function( canvas, orientation ) {
                var width = canvas.width,
                    height = canvas.height,
                    ctx = canvas.getContext( '2d' );
    
                switch ( orientation ) {
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        canvas.width = height;
                        canvas.height = width;
                        break;
                }
    
                switch ( orientation ) {
                    case 2:    // horizontal flip
                        ctx.translate( width, 0 );
                        ctx.scale( -1, 1 );
                        break;
    
                    case 3:    // 180 rotate left
                        ctx.translate( width, height );
                        ctx.rotate( Math.PI );
                        break;
    
                    case 4:    // vertical flip
                        ctx.translate( 0, height );
                        ctx.scale( 1, -1 );
                        break;
    
                    case 5:    // vertical flip + 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.scale( 1, -1 );
                        break;
    
                    case 6:    // 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.translate( 0, -height );
                        break;
    
                    case 7:    // horizontal flip + 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.translate( width, -height );
                        ctx.scale( -1, 1 );
                        break;
    
                    case 8:    // 90 rotate left
                        ctx.rotate( -0.5 * Math.PI );
                        ctx.translate( -width, 0 );
                        break;
                }
            },
    
            _fileRead: function( file, cb, method ) {
                var me = this;
    
                util.getFileReader(function( reader ) {
                    reader.onload = function() {
                        cb( this.result );
                        reader = reader.onload = reader.onerror = null;
                    };
    
                    reader.onerror = function( e ) {
                        me.trigger( 'error', e.message );
                        reader = reader.onload = reader.onerror = null;
                    };
    
                    reader[ method || 'readAsDataURL' ]( file );
                });
    
                return me;
            },
    
            // @todo 在ios6中，处理像素点过万的图片有问题，待解决
            // 解决方法：https://github.com/stomita/ios-imagefile-megapixel
            _renderImageToCanvas: function( canvas, img, x, y, w, h ) {
                canvas.getContext( '2d' ).drawImage( img, x, y, w, h );
            }
        } );
    
        Html5Image.makeThumbnail = function( source, cb, width, height, crop ) {
            var image = new Html5Image();
    
            image.once( 'load', function() {
                var ret = image.makeThumbnail( width, height, crop );
                image.destroy();
                image = null;
                cb( ret );
            } );
            image.load( source );
        };
    
        Html5Image.downsize = function( source, cb, width, height, crop ) {
            var image = new Html5Image();
    
            image.once( 'load', function() {
                var ret;
                image.downsize( width, height, crop );
                ret = image.toBlob();
                image.destroy();
                image = null;
                cb( ret );
            } );
            image.load( source );
        };
    
        Html5Runtime.register( 'Image', Html5Image );
    
        Html5Runtime.addDetect(function(){
            return {
                resizeImage: true
            }
        });
        return Html5Image;
    } );

    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define( 'webuploader/core/runtime/html5/imagemta', [ 'webuploader/base',
            'webuploader/core/runtime/html5/runtime'
            ], function( Base, Html5Runtime ) {
    
        var $ = Base.$,
            api;
    
        api = {
            parsers: {
                0xffe1: []
            },
    
            maxMetaDataSize: 262144,
    
            parse: function( buffer, noParse ) {
                if ( buffer.byteLength < 6 ) {
                    return;
                }
    
                var dataview = new DataView( buffer ),
                    offset = 2,
                    maxOffset = dataview.byteLength - 4,
                    headLength = offset,
                    ret = {},
                    markerBytes, markerLength, parsers, i;
    
                if ( dataview.getUint16( 0 ) === 0xffd8 ) {
    
                    while ( offset < maxOffset ) {
                        markerBytes = dataview.getUint16( offset );
    
                        if ( markerBytes >= 0xffe0 && markerBytes <= 0xffef ||
                                markerBytes === 0xfffe ) {
    
                            markerLength = dataview.getUint16( offset + 2 ) + 2;
    
                            if ( offset + markerLength > dataview.byteLength ) {
                                break;
                            }
    
                            parsers = api.parsers[ markerBytes ];
    
                            if ( !noParse && parsers ) {
                                for ( i = 0; i < parsers.length; i += 1 ) {
                                    parsers[ i ].call( api, dataview, offset,
                                            markerLength, ret );
                                }
                            }
    
                            offset += markerLength;
                            headLength = offset;
                        } else {
                            break;
                        }
                    }
    
                    if ( headLength > 6 ) {
                        if ( buffer.slice ) {
                            ret.imageHead = buffer.slice( 2, headLength );
                        } else {
                            // Workaround for IE10, which does not yet
                            // support ArrayBuffer.slice:
                            ret.imageHead = new Uint8Array( buffer )
                                    .subarray( 2, headLength );
                        }
                    }
                }
    
                return ret;
            },
    
            updateImageHead: function( buffer, head ) {
                var data = this.parse( buffer, true ),
                    buf1, buf2, head, bodyoffset ;
    
    
                bodyoffset = 2;
                if ( data.imageHead ) {
                    bodyoffset = 2 + data.imageHead.byteLength;
                }
    
                buf2 = buffer.slice( bodyoffset );
    
                buf1 = new Uint8Array( head.byteLength + 2 + buf2.byteLength );
    
                buf1[ 0 ] = 0xFF;
                buf1[ 1 ] = 0xD8;
                buf1.set( new Uint8Array( head ), 2 );
    
                buf1.set( new Uint8Array( buf2 ), head.byteLength + 2 )
    
                return buf1.buffer;
            }
        };
    
        Html5Runtime.register( 'ImageMeta', api );
        return api;
    } );

    /**
     * 代码来自于：https://github.com/blueimp/JavaScript-Load-Image
     * 暂时项目中只用了orientation.
     *
     * 去除了 Exif Sub IFD Pointer, GPS Info IFD Pointer, Exif Thumbnail.
     * @fileOverview EXIF解析
     */
    // Sample
    // ====================================
    // Make : Apple
    // Model : iPhone 4S
    // Orientation : 1
    // XResolution : 72 [72/1]
    // YResolution : 72 [72/1]
    // ResolutionUnit : 2
    // Software : QuickTime 7.7.1
    // DateTime : 2013:09:01 22:53:55
    // ExifIFDPointer : 190
    // ExposureTime : 0.058823529411764705 [1/17]
    // FNumber : 2.4 [12/5]
    // ExposureProgram : Normal program
    // ISOSpeedRatings : 800
    // ExifVersion : 0220
    // DateTimeOriginal : 2013:09:01 22:52:51
    // DateTimeDigitized : 2013:09:01 22:52:51
    // ComponentsConfiguration : YCbCr
    // ShutterSpeedValue : 4.058893515764426
    // ApertureValue : 2.5260688216892597 [4845/1918]
    // BrightnessValue : -0.3126686601998395
    // MeteringMode : Pattern
    // Flash : Flash did not fire, compulsory flash mode
    // FocalLength : 4.28 [107/25]
    // SubjectArea : [4 values]
    // FlashpixVersion : 0100
    // ColorSpace : 1
    // PixelXDimension : 2448
    // PixelYDimension : 3264
    // SensingMethod : One-chip color area sensor
    // ExposureMode : 0
    // WhiteBalance : Auto white balance
    // FocalLengthIn35mmFilm : 35
    // SceneCaptureType : Standard
    define( 'webuploader/core/runtime/html5/imagemta/exif',
            [ 'webuploader/core/runtime/html5/imagemta' ], function( ImageMeta ) {
    
        var EXIF = {};
    
        EXIF.ExifMap = function() {
            return this;
        };
    
        EXIF.ExifMap.prototype.map = {
            'Orientation': 0x0112
        };
    
        EXIF.ExifMap.prototype.get = function( id ) {
            return this[ id ] || this[ this.map[ id ] ];
        };
    
        EXIF.exifTagTypes = {
            // byte, 8-bit unsigned int:
            1: {
                getValue: function( dataView, dataOffset ) {
                    return dataView.getUint8( dataOffset );
                },
                size: 1
            },
    
            // ascii, 8-bit byte:
            2: {
                getValue: function( dataView, dataOffset ) {
                    return String.fromCharCode( dataView.getUint8( dataOffset ) );
                },
                size: 1,
                ascii: true
            },
    
            // short, 16 bit int:
            3: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint16( dataOffset, littleEndian );
                },
                size: 2
            },
    
            // long, 32 bit int:
            4: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint32( dataOffset, littleEndian );
                },
                size: 4
            },
    
            // rational = two long values, first is numerator, second is denominator:
            5: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint32( dataOffset, littleEndian ) /
                        dataView.getUint32( dataOffset + 4, littleEndian );
                },
                size: 8
            },
    
            // slong, 32 bit signed int:
            9: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getInt32( dataOffset, littleEndian );
                },
                size: 4
            },
    
            // srational, two slongs, first is numerator, second is denominator:
            10: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getInt32( dataOffset, littleEndian ) /
                        dataView.getInt32( dataOffset + 4, littleEndian );
                },
                size: 8
            }
        };
    
        // undefined, 8-bit byte, value depending on field:
        EXIF.exifTagTypes[ 7 ] = EXIF.exifTagTypes[ 1 ];
    
        EXIF.getExifValue = function( dataView, tiffOffset, offset, type, length,
                littleEndian ) {
    
            var tagType = EXIF.exifTagTypes[ type ],
                tagSize, dataOffset, values, i, str, c;
    
            if ( !tagType ) {
                console.log('Invalid Exif data: Invalid tag type.');
                return;
            }
    
            tagSize = tagType.size * length;
    
            // Determine if the value is contained in the dataOffset bytes,
            // or if the value at the dataOffset is a pointer to the actual data:
            dataOffset = tagSize > 4 ? tiffOffset + dataView.getUint32( offset + 8,
                    littleEndian ) : (offset + 8);
    
            if ( dataOffset + tagSize > dataView.byteLength ) {
                console.log('Invalid Exif data: Invalid data offset.');
                return;
            }
    
            if (length === 1) {
                return tagType.getValue( dataView, dataOffset, littleEndian );
            }
    
            values = [];
    
            for ( i = 0; i < length; i += 1 ) {
                values[ i ] = tagType.getValue( dataView,
                        dataOffset + i * tagType.size, littleEndian );
            }
    
            if ( tagType.ascii ) {
                str = '';
    
                // Concatenate the chars:
                for (i = 0; i < values.length; i += 1) {
                    c = values[i];
    
                    // Ignore the terminating NULL byte(s):
                    if (c === '\u0000') {
                        break;
                    }
                    str += c;
                }
    
                return str;
            }
            return values;
        };
    
        EXIF.parseExifTag = function( dataView, tiffOffset, offset, littleEndian,
                data ) {
    
            var tag = dataView.getUint16( offset, littleEndian );
            data.exif[ tag ] = EXIF.getExifValue( dataView, tiffOffset, offset,
                    dataView.getUint16( offset + 2, littleEndian ), // tag type
                    dataView.getUint32( offset + 4, littleEndian ), // tag length
                    littleEndian );
        };
    
        EXIF.parseExifTags = function( dataView, tiffOffset, dirOffset,
                littleEndian, data ) {
    
            var tagsNumber, dirEndOffset, i;
    
            if ( dirOffset + 6 > dataView.byteLength ) {
                console.log('Invalid Exif data: Invalid directory offset.');
                return;
            }
    
            tagsNumber = dataView.getUint16( dirOffset, littleEndian );
            dirEndOffset = dirOffset + 2 + 12 * tagsNumber;
    
            if ( dirEndOffset + 4 > dataView.byteLength ) {
                console.log('Invalid Exif data: Invalid directory size.');
                return;
            }
    
            for ( i = 0; i < tagsNumber; i += 1 ) {
                this.parseExifTag( dataView, tiffOffset,
                        dirOffset + 2 + 12 * i, // tag offset
                        littleEndian, data );
            }
    
            // Return the offset to the next directory:
            return dataView.getUint32( dirEndOffset, littleEndian );
        };
    
        EXIF.parseExifData = function( dataView, offset, length, data ) {
    
            var tiffOffset = offset + 10,
                littleEndian,
                dirOffset,
                thumbnailData;
    
            // Check for the ASCII code for "Exif" (0x45786966):
            if ( dataView.getUint32( offset + 4 ) !== 0x45786966 ) {
                // No Exif data, might be XMP data instead
                return;
            }
            if ( tiffOffset + 8 > dataView.byteLength ) {
                console.log( 'Invalid Exif data: Invalid segment size.' );
                return;
            }
    
            // Check for the two null bytes:
            if ( dataView.getUint16( offset + 8 ) !== 0x0000 ) {
                console.log( 'Invalid Exif data: Missing byte alignment offset.' );
                return;
            }
    
            // Check the byte alignment:
            switch ( dataView.getUint16( tiffOffset ) ) {
                case 0x4949:
                    littleEndian = true;
                    break;
    
                case 0x4D4D:
                    littleEndian = false;
                    break;
    
                default:
                    console.log( 'Invalid Exif data: Invalid byte alignment marker.' );
                    return;
            }
    
            // Check for the TIFF tag marker (0x002A):
            if ( dataView.getUint16( tiffOffset + 2, littleEndian ) !== 0x002A ) {
                console.log( 'Invalid Exif data: Missing TIFF marker.' );
                return;
            }
    
            // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
            dirOffset = dataView.getUint32( tiffOffset + 4, littleEndian );
            // Create the exif object to store the tags:
            data.exif = new EXIF.ExifMap();
            // Parse the tags of the main image directory and retrieve the
            // offset to the next directory, usually the thumbnail directory:
            dirOffset = EXIF.parseExifTags( dataView, tiffOffset,
                    tiffOffset + dirOffset, littleEndian, data );
        };
    
        ImageMeta.parsers[ 0xffe1 ].push( EXIF.parseExifData );
        return EXIF;
    } );

    /**
     * @fileOverview Transport
     * @todo 支持chunked传输，优势：
     * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
     * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
     */
    define( 'webuploader/core/runtime/html5/Network', [ 'webuploader/base',
            'webuploader/core/runtime/html5/runtime'
            ], function( Base, Html5Runtime ) {
    
        var $ = Base.$,
            instance;
    
        function Network() {
            if ( instance ) {
                return instance;
            } else {
                instance = this;
            }
    
            var me = this;
    
            if ( !this.runtime.capable( 'onLine' ) ) {
                Base.log( '不支持网络检测' );
                return me;
            }
    
            $( window ).on( 'online', function() {
                me.trigger( 'online' );
            } );
    
            $( window ).on( 'offline', function() {
                me.trigger( 'offline' );
            } );
    
            return this;
        }
    
        Network.getInstance = function() {
            return new Network();
        }
    
        Html5Runtime.register( 'Network', Network );
    
        Html5Runtime.addDetect(function() {
            return {
                onLine: !!navigator.onLine
            };
        });
    
        return Network;
    } );

    /**
     * @fileOverview Transport
     * @todo 支持chunked传输，优势：
     * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
     * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
     */
    define( 'webuploader/core/runtime/html5/transport', [ 'webuploader/base',
            'webuploader/core/runtime/html5/runtime'
            ], function( Base, Html5Runtime ) {
    
        var $ = Base.$,
            noop = Base.noop,
            defaultOpts = {
                server: '',
                fileVar: 'file',
                chunked: true,
                chunkSize: 1024 * 512,    // 0.5M.
                timeout: 2 * 60 * 1000,    // 2分钟
                formData: {},
                headers: {}
            };
    
        function Transport( opts ) {
            opts = this.options = $.extend( true, {}, defaultOpts, opts || {} );
        }
    
        $.extend( Transport.prototype, {
            state: 'pending',
    
            _initAjax: function() {
                var me = this,
                    opts = me.options,
                    xhr = new XMLHttpRequest();
    
                xhr.upload.onprogress = function( e ) {
                    var percentage = 0;
    
                    if ( e.lengthComputable ) {
                        percentage = e.loaded / e.total;
                    }
    
                    return me._onprogress.call( me, percentage );
                };
    
                xhr.onreadystatechange = function() {
                    var ret, rHeaders, reject;
    
                    if ( xhr.readyState !== 4 ) {
                        return;
                    }
    
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    clearTimeout( me.timoutTimer );
                    me._xhr = null;
    
                    // 只考虑200的情况
                    if ( xhr.status === 200 ) {
                        ret = me._parseResponse( xhr.responseText );
                        ret._raw = xhr.responseText;
                        rHeaders = me._getXhrHeaders( xhr );
    
                        // 说明server端返回的数据有问题。
                        if ( !me.trigger( 'accept', ret, rHeaders, function( val ) {
                            reject = val;
                        } ) ) {
                            reject = reject || 'server';
                        } else {
                            return me._onsuccess.call( me, ret, rHeaders );
                        }
                    }
    
                    reject = reject || (xhr.status ? 'http' : 'timeout');
                    return me._reject( reject );
                };
    
                return me._xhr = xhr;
            },
    
            _onprogress: function( percentage ) {
                var opts = this.options,
                    start, end, total;
    
                if ( this.chunks ) {
                    total = this._blob.size;
                    start = this.chunk * opts.chunkSize;
                    end = Math.min( start + opts.chunkSize, total );
    
                    percentage = (start + percentage * (end -start)) / total;
                }
    
                this._notify( percentage );
            },
    
            _onsuccess: function( ret, headers ) {
                if ( this.chunks && this.chunk < this.chunks - 1 ) {
                    this.chunk++;
                    this._upload();
                } else {
                    this._resolve( ret, headers );
                }
            },
    
            _notify: function( percentage ) {
                this.trigger( 'progress', percentage || 0 );
            },
    
            _resolve: function( ret, headers ) {
                this.state = 'done';
                this.trigger( 'success', ret, headers );
                this.trigger( 'complete' );
            },
    
            _reject: function( reason ) {
                // @todo
                // 如果是timeout abort, 在chunk传输模式中应该自动重传。
                // chunkRetryCount = 3;
                this.state = 'fail';
                this.trigger( 'error', reason );
                this.trigger( 'complete' );
            },
    
            _setRequestHeader: function( xhr, headers ) {
                $.each( headers, function( key, val ) {
                    xhr.setRequestHeader( key, val );
                } );
            },
    
            _getXhrHeaders: function( xhr ) {
                var str = xhr.getAllResponseHeaders(),
                    ret = {},
                    match;
    
    
                $.each( str.split( /\n/ ), function( i, str ) {
                    match = /^(.*?): (.*)$/.exec( str );
    
                    if ( match ) {
                        ret[ match[ 1 ] ] = match[ 2 ];
                    }
                } );
    
                return ret;
            },
    
            _parseResponse: function( json ) {
                var ret;
    
                try {
                    ret = JSON.parse( json );
                } catch ( ex ) {
                    ret = {};
                }
    
                return ret;
            },
    
            _upload: function() {
                if ( this.paused ) {
                    return this;
                }
    
                var opts = this.options,
                    xhr = this._initAjax(),
                    formData = new FormData(),
                    blob = this._blob,
                    slice = blob.slice || blob.webkitSlice || blob.mozSlice,
                    start, end;
    
                if ( this.chunks ) {
                    start = this.chunk * opts.chunkSize;
                    end = Math.min( blob.size, start + opts.chunkSize );
    
                    blob = slice.call( blob, start, end );
                    opts.formData.chunk = this.chunk;
                    opts.formData.chunks = this.chunks;
    
                    start === 0 &&
                            xhr.overrideMimeType( 'application/octet-stream' );
                }
    
                // 外部可以在这个时机中添加其他信息
                this.trigger( 'beforeSend', opts.formData, opts.headers, xhr );
    
                $.each( opts.formData, function( key, val ) {
                    formData.append( key, val );
                } );
    
                formData.append( opts.fileVar, blob, opts.formData &&
                        opts.formData.name || '' );
    
                xhr.open( 'POST', opts.server );
                this._setRequestHeader( xhr, opts.headers );
    
                if ( opts.timeout ) {
                    this.timoutTimer = setTimeout(function() {
                        xhr.abort();
                    }, opts.timeout );
                }
    
                xhr.send( formData );
                this.state = 'progress';
                return this;
            },
    
            pause: function() {
                this.paused = true;
                if ( this._xhr ) {
                    this._xhr.upload.onprogress = noop;
                    this._xhr.onreadystatechange = noop;
                    clearTimeout( this.timoutTimer );
                    this._xhr.abort();
                    this._onprogress( 0 );
                }
            },
    
            resume: function() {
                this.paused = false;
                this._upload();
            },
    
            cancel: function() {
                if ( this._xhr ) {
                    this._xhr.upload.onprogress = noop;
                    this._xhr.onreadystatechange = noop;
                    clearTimeout( this.timoutTimer );
                    this._xhr.abort();
                    this._reject( 'abort' );
                }
            },
    
            /**
             * 以Blob的方式发送数据到服务器
             * @method sendAsBlob
             * @param {Blob} blob Blob数据
             * @return {Transport} 返回实例自己，便于链式调用。
             * @chainable
             */
            sendAsBlob: function( blob ) {
                var opts = this.options;
    
                if ( opts.chunked && blob.size > opts.chunkSize ) {
                    this.chunk = 0;
                    this.chunks = Math.ceil( blob.size / opts.chunkSize );
                }
    
                this._blob = blob;
    
                this._upload();
                this._notify( 0 );
                return this;
            },
    
            destroy: function() {
                this._blob = null;
            }
    
        } );
    
        // 静态方法直接发送内容。
        Transport.sendAsBlob = function( blob, options ) {
            var instance = new Transport( options );
            instance.sendAsBlob( blob );
            return instance;
        };
    
        Html5Runtime.register( 'Transport', Transport );
    } );

    /**
     * @fileOverview 负责文件验证
     */
    define( 'webuploader/core/validator', [ 'webuploader/base',
            'webuploader/core/mediator',
            'webuploader/core/file' ], function( Base, Mediator, File ) {
    
        var $ = Base.$,
            validators = {},
            api;
    
        api = {
            addValidator: function( type, cb ) {
                validators[ type ] = cb;
            },
    
            removeValidator: function( type ) {
                delete validators[ type ];
            }
        };
    
        Mediator.on( 'uploaderInit', function( uploader ) {
            $.each( validators, function() {
                this.call( uploader );
            } );
        } );
    
        // 验证文件数量
        api.addValidator( 'fileNumLimit', function() {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = opts.fileNumLimit >>> 0,
                flag = true;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function() {
                if ( count >= max && flag ) {
                    flag = false;
                    this.trigger( 'error', 'Q_EXCEED_NUM_LIMIT', max );
                    setTimeout( function() {
                        flag = true;
                    }, 1 );
                }
    
                return count >= max ? false : true;
            } );
    
            uploader.on( 'fileQueued', function() {
                count++;
            } );
    
            uploader.on( 'fileDequeued', function() {
                count--;
            } );
        } );
    
    
        // 验证文件大小
        api.addValidator( 'fileSizeLimit', function() {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = opts.fileSizeLimit >>> 0,
                flag = true;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                var invalid = count + file.size > max;
                if ( invalid && flag ) {
                    flag = false;
                    this.trigger( 'error', 'Q_EXCEED_SIZE_LIMIT', max );
                    setTimeout( function() {
                        flag = true;
                    }, 1 );
                }
    
                return invalid ? false : true;
            } );
    
            uploader.on( 'fileQueued', function( file ) {
                count += file.size;
            } );
    
            uploader.on( 'fileDequeued', function() {
                count -= file.size;
            } );
        } );
    
        // 当个文件不能超过50M
        api.addValidator( 'fileSingleSizeLimit', function() {
            var uploader = this,
                opts = uploader.options,
                max = opts.fileSingleSizeLimit;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'fileQueued', function( file ) {
                if ( file.size > max ) {
                    file.setStatus( File.Status.INVALID, 'exceed_size' );
                }
            } );
        } );
    
        // 去重
        api.addValidator( 'duplicate', function() {
            var uploader = this,
                opts = uploader.options,
                mapping = {};
    
            if ( opts.duplicate ) {
                return;
            }
    
            function hashString( str ) {
                var hash = 0,
                    i =0,
                    len = str.length,
                    char;
    
                for ( ; i < len; i++ ) {
                    char = str.charCodeAt( i );
                    hash = char + (hash << 6) + (hash << 16) - hash;
                }
    
                return hash;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                var hash = hashString( file.name + file.size +
                        file.lastModifiedDate );
    
                // 已经重复了
                if ( mapping[ hash ] ) {
                    return false;
                }
            } );
    
            uploader.on( 'fileQueued', function( file ) {
                var hash = hashString( file.name + file.size +
                        file.lastModifiedDate );
    
                mapping[ hash ] = true;
            } );
    
            uploader.on( 'fileDequeued', function( file ) {
                var hash = hashString( file.name + file.size +
                        file.lastModifiedDate );
    
                delete mapping[ hash ];
            } );
        } );
    
        return api;
    } );

    /**
     * @file 暴露变量给外部使用。
     */
    require( [ 'webuploader/base' ], function( Base ) {
        var exportName, origin;
    
        if ( typeof module === 'object' && typeof module.exports === 'object' ) {
            module.exports = Base;
        } else {
            exportName = 'WebUploader';
            origin = window[ exportName ];
            window[ exportName ] = Base;
    
            window[ exportName ].noConflict = function() {
                window[ exportName ] = origin;
            };
        }
    } );
})( this );
exports = this.WebUploader;