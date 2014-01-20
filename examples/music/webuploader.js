/* WebUploader 0.1.0 */
(function( window, undefined ) {
    /**
     * @fileOverview 让内部各个部件的代码可以用amdefine组织起来。
     */
    var amd = (function( global ) {
            var modules = {};

            function require( deps, callback ) {
                var args = [],
                    len = deps.length,
                    i = -1,
                    dep, module;

                while ( ++i < len ) {
                    dep = deps[ i ];
                    module = modules[ dep ] || global[ dep ];

                    if ( !module ) {
                        throw new Error( '`' + dep + '` is undefined' );
                    }

                    args.push( module );
                }

                callback.apply( null, args );
            }

            function define( id, deps, definition ) {
                if ( arguments.length === 2 ) {
                    definition = deps;
                    deps = null;
                }

                if ( typeof id !== 'string' || !definition ) {
                    throw new Error('Define Error');
                }

                require( deps || [], function() {
                    modules[ id ] = typeof definition === 'function' ?
                            definition.apply( null, arguments ) : definition;
                });
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
     * @fileOverview 基础类方法。
     */
    define( 'base', [
        'jQuery'
    ], function( $ ) {

        var noop = function() {},
            call = Function.call;

        // http://jsperf.com/uncurrythis
        // 反科里化
        function uncurryThis( fn ) {
            return function() {
                return call.apply( fn, arguments );
            };
        }

        function bindFn( fn, context ) {
            return fn.bind ? fn.bind( context ) : function() {
                return fn.apply( context, arguments );
            };
        }

        function createObject( proto ) {
            var f;

            if ( Object.create ) {
                return Object.create( proto );
            } else {
                f = function(){};
                f.prototype = proto;
                return new f();
            }
        }

        return {
            // 0.1.0 将会被package.json中的version值替代。
            version: '0.1.0',

            $: $,

            isPromise: function( anything ) {
                return anything && typeof anything.then === 'function';
            },

            Deferred: $.Deferred,

            when: $.when,

            // 简单的浏览器检测。
            browser: (function( ua ) {
                var ret = {},
                    webkit = ua.match( /WebKit\/([\d.]+)/ ),
                    chrome = ua.match( /Chrome\/([\d.]+)/ ) ||
                        ua.match( /CriOS\/([\d.]+)/ ),

                    ie = ua.match( /MSIE\s([\d.]+)/ ),
                    firefox = ua.match( /Firefox\/([\d.]+)/ ),
                    safari = ua.match( /Safari\/([\d.]+)/ ),
                    opera = ua.match( /OPR\/([\d.]+)/ );

                webkit && (ret.webkit = parseFloat( webkit[ 1 ] ));
                chrome && (ret.chrome = parseFloat( chrome[ 1 ] ));
                ie && (ret.ie = parseFloat( ie[ 1 ] ));
                firefox && (ret.firefox = parseFloat( firefox[ 1 ] ));
                safari && (ret.safari = parseFloat( safari[ 1 ] ));
                opera && (ret.opera = parseFloat( opera[ 1 ] ));

                return ret;
            })( navigator.userAgent ),

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
                } else if ( protos && protos.hasOwnProperty('constructor') ) {
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
                child.prototype = createObject( Super.prototype );
                protos && $.extend( true, child.prototype, protos );

                return child;
            },

            noop: noop,

            // 修复方法的执行上下文。
            bindFn: bindFn,

            log: (function() {
                if ( window.console.log ) {
                    return bindFn( console.log, console );
                }
                return noop;
            })(),

            nextTick: (function() {

                return function( cb ) {
                    setTimeout( cb, 1 );
                };

                // @bug 当浏览器不在当前窗口时就停了。
                // var next = window.requestAnimationFrame ||
                //     window.webkitRequestAnimationFrame ||
                //     window.mozRequestAnimationFrame ||
                //     function( cb ) {
                //         window.setTimeout( cb, 1000 / 60 );
                //     };

                // // fix: Uncaught TypeError: Illegal invocation
                // return bindFn( next, window );
            })(),

            slice: uncurryThis( [].slice ),

            guid: (function() {
                var counter = 0;

                return function( prefix ) {
                    var guid = (+new Date()).toString( 32 ),
                        i = 0;

                    for ( ; i < 5; i++ ) {
                        guid += Math.floor( Math.random() * 65535 ).toString( 32 );
                    }

                    return (prefix || 'o_') + guid + (counter++).toString( 32 );
                };
            })(),

            formatSize: function( size, pointLength, units ) {
                var unit;

                units = units || [ 'B', 'K', 'M', 'G', 'TB' ];

                while ( (unit = units.shift()) && size > 1024 ) {
                    size = size / 1024;
                }

                return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                        unit;
            }
        };
    });

    /**
     * @fileOverview Mediator
     */
    define( 'core/mediator', [
        'base'
    ], function( Base ) {
        var $ = Base.$,
            slice = [].slice,
            protos;

        // 根据条件过滤出事件handlers.
        function findHandlers( arr, name, callback, context ) {
            return $.grep( arr, function( handler ) {
                return handler &&
                    (!name || handler.e === name) &&
                    (!callback || handler.cb === callback ||
                    handler.cb._cb === callback) &&
                    (!context || handler.ctx === context);
            });

            // @todo IE8不支持filter，需要换种写法。
            // return arr.filter(function( handler ) {
            //     return handler &&
            //             (!name || handler.e === name) &&
            //             (!callback || handler.cb === callback ||
            //             handler.cb._cb === callback) &&
            //             (!context || handler.ctx === context);
            // });
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

                $.each( findHandlers( events, name, callback, context ), function() {
                    delete events[ this.id ];
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
    });

    /**
     * @fileOverview Uploader上传类
     */
    define( 'core/uploader', [
        'base',
        'core/mediator'
    ], function( Base, Mediator, Runtime ) {

        var $ = Base.$;

        function Uploader( opts ) {
            this.options = $.extend( true, {}, Uploader.options, opts );
            this._init( this.options );
        }

        // default Options
        // widgets中有相应扩展
        Uploader.options = {};
        Mediator.installTo( Uploader.prototype );

        // 批量添加纯命令式方法。
        $.each({
            upload: 'start-upload',
            stop: 'stop-upload',
            getFile: 'get-file',
            getFiles: 'get-files',
            addFile: 'add-file',
            addFiles: 'add-file',
            removeFile: 'remove-file',
            retry: 'retry',
            isInProgress: 'is-in-progress',
            makeThumb: 'make-thumb',
            addButton: 'add-btn',
            getRuntimeType: 'get-runtime-type',
            refresh: 'refresh',
            disable: 'disable',
            enable: 'enable'
        }, function( fn, command ) {
            Uploader.prototype[ fn ] = function() {
                return this.request( command, arguments );
            };
        });

        $.extend( Uploader.prototype, {
            state: 'pending',

            _init: function( opts ) {
                var me = this;

                me.request( 'init', opts, function() {
                    me.state = 'ready';
                    me.trigger( 'ready' );
                });
            },

            // @todo trigger change event.
            option: function( key, val ) {
                var opts = this.options;
                if ( arguments.length > 1 ) {    // setter
                    if ( $.isPlainObject( val ) &&
                            $.isPlainObject( opts[ key ] ) ) {
                        $.extend( opts[ key ], val );
                    } else {
                        opts[ key ] = val;
                    }
                } else {    // getter
                    return key ? opts[ key ] : opts;
                }
            },

            getStats: function() {
                // return this._mgr.getStats.apply( this._mgr, arguments );
                var stats = this.request( 'get-stats' );

                return {
                    successNum: stats.numOfSuccess,
                    queueFailNum: 0,
                    cancelNum: stats.numOfCancel,
                    invalidNum: stats.numOfInvalid,
                    uploadFailNum: stats.numOfUploadFailed,
                    queueNum: stats.numOfQueue
                };
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
            },

            request: Base.noop,

            reset: function() {
                // @todo
            }
        } );

        Base.create = function( opts ) {
            return new Uploader( opts );
        };

        // 暴露Uploader，可以通过它来扩展业务逻辑。
        Base.Uploader = Uploader;

        return Uploader;
    });

    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define( 'runtime/runtime', [
        'base',
        'core/mediator'
    ], function( Base, Mediator ) {

        var $ = Base.$,
            factories = {};

        // 接口类。
        function Runtime( options ) {
            this.options = $.extend( {
                container: document.body
            }, options );
            this.uid = Base.guid( 'rt_' );
        }

        $.extend( Runtime.prototype, {

            getContainer: function() {
                var opts = this.options,
                    parent, container;

                if ( this.container ) {
                    return this.container;
                }

                parent = opts.container || $( document.body );

                container = $(document.createElement( 'div' ));

                container.attr( 'id', 'rt_' + this.uid );
                container.css({
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                });

                parent.append( container );

                return this.container = container;
            },

            init: Base.noop,
            exec: Base.noop
        });

        Runtime.orders = 'html5,flash';


        /**
         * 添加Runtime实现。
         * @method addRuntime
         * @param {String} type    类型
         * @param {Runtime} factory 具体Runtime实现。
         */
        Runtime.addRuntime = function( type, factory ) {
            factories[ type ] = factory;
        };

        Runtime.hasRuntime = function( type ) {
            return !!factories[ type ];
        };

        Runtime.create = function( opts, orders ) {
            var type, runtime;

            orders = orders || Runtime.orders;
            $.each( orders.split( /\s*,\s*/g ), function() {
                if ( factories[ this ] ) {
                    type = this;
                    return false;
                }
            } );

            type = type || getFirstKey( factories );

            if ( !type ) {
                throw new Error( 'Runtime Error' );
            }

            return runtime = new factories[ type ]( opts );
        };

        // 获取对象的第一个key
        function getFirstKey( obj ) {
            var key;

            for( key in obj ) {
                if ( obj.hasOwnProperty( key ) ) {
                    return key;
                }
            }

            return '';
        }

        Mediator.installTo( Runtime.prototype );
        return Runtime;
    });

    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define( 'runtime/client', [
        'base',
        'core/mediator',
        'runtime/runtime'
    ], function( Base, Mediator, Runtime ) {

        var cache = (function() {
            var obj = {};

            return {
                add: function( runtime ) {
                    obj[ runtime.uid ] = runtime;
                },

                get: function( ruid ) {
                    var i;

                    if ( ruid ) {
                        return obj[ ruid ];
                    }

                    for ( i in obj ) {
                        return obj[ i ];
                    }

                    return null;
                },

                remove: function( runtime ) {
                    delete obj[ runtime.uid ];
                },

                has: function() {
                    return !!this.get.apply( this, arguments );
                }
            }
        })();

        function RuntimeClient( component, standalone ) {
            var deferred = Base.Deferred(),
                runtime;

            this.uid = Base.guid( 'client_' );

            this.runtimeReady = function( cb ) {
                return deferred.done( cb );
            };

            this.connectRuntime = function( opts, cb ) {
                if ( runtime ) {
                    return;
                }

                deferred.done( cb );

                if ( typeof opts === 'string' && cache.get( opts ) ) {
                    runtime = cache.get( opts );
                } else if ( !standalone && cache.has() ) {
                    runtime = cache.get();
                }

                if ( !runtime ) {
                    runtime = Runtime.create( opts, opts.runtimeOrder );
                    cache.add( runtime );
                    runtime.promise = deferred.promise();
                    runtime.once( 'ready', deferred.resolve );
                    runtime.init();
                    runtime.client = 1;
                    return runtime;
                }

                runtime.promise.then( deferred.resolve );
                runtime.client++;
                return runtime;
            };

            this.getRuntime = function() {
                return runtime;
            };

            this.disconnectRuntime = function() {
                if ( !runtime ) {
                    return;
                }

                runtime.client--;

                if ( runtime.client <= 0 ) {
                    cache.remove( runtime );
                    delete runtime.promise;
                    runtime.destroy();
                    runtime = null;
                }
            };

            this.exec = function() {
                if ( !runtime ) {
                    Base.log( 'Runtime Error' );
                    return;
                }

                var args = Base.slice( arguments );
                component && args.unshift( component );

                return runtime.exec.apply( this, args );
            };

            this.getRuid = function() {
                return runtime && runtime.uid;
            };
        }

        Mediator.installTo( RuntimeClient.prototype );
        return RuntimeClient;
    });

    /**
     * @fileOverview Blob
     */
    define( 'lib/blob', [
        'base',
        'runtime/client'
    ], function( Base, RuntimeClient ) {

        var $ = Base.$;

        function Blob( ruid, source ) {
            var me = this;

            me.source = source;
            me.ruid = ruid;

            RuntimeClient.call( me, 'Blob' );

            this.uid = source.uid || this.uid;
            this.type = source.type || '';
            this.size = source.size || 0;

            if ( ruid ) {
                me.connectRuntime( ruid );
            }
        }

        Base.inherits( RuntimeClient, {
            constructor: Blob,

            slice: function( start, end ) {
                return this.exec( 'slice', start, end );
            },

            getSource: function() {
                return this.source;
            }
        } );

        return Blob;
    });

    /**
     * @fileOverview File
     */
    define( 'lib/file', [
        'base',
        'lib/blob'
    ], function( Base, Blob ) {

        var $ = Base.$,
            uid = 0,
            rExt = /\.([^.]+)$/;

        function File( ruid, file ) {
            var ext;

            Blob.apply( this, arguments );
            this.name = file.name || ('untitled' + uid++);

            if ( !this.type ) {
                ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';
                if ( ~'jpg,jpeg,png,gif,bmp'.indexOf( ext ) ) {
                    this.type = 'image/'+ext;
                }
            }

            this.lastModifiedDate = file.lastModifiedDate || (new Date()).toLocaleString();
        }

        return Base.inherits( Blob, File );
    });

    /**
     * @fileOverview 错误信息
     */
    define( 'lib/filepicker', [
        'base',
        'runtime/client',
        'lib/file'
    ], function( Base, RuntimeClent, File ) {

        var $ = Base.$;

        function FilePicker( opts ) {

            opts = this.options = $.extend( {}, FilePicker.options, opts );
            opts.container = $( opts.id );

            if ( !opts.container.length ) {
                throw new Error( '按钮指定错误' );
            }

            opts.label = opts.label || opts.container.text();
            opts.button = $( opts.button || document.createElement('div') );
            opts.button.text( opts.label );
            opts.container.append( opts.button );

            RuntimeClent.call( this, 'FilePicker', true );
        }

        FilePicker.options = {
            button: null,
            container: null,
            label: '选择文件',
            multiple: true,
            accept: null
        }

        Base.inherits( RuntimeClent, {
            constructor: FilePicker,

            init: function() {
                var me = this,
                    opts = me.options,
                    button = opts.button;

                button.addClass( 'webuploader-pick' );

                me.on( 'all', function( type ) {
                    var files;

                    switch ( type ) {
                        case 'mouseenter':
                            button.addClass( 'webuploader-pick-hover');
                            break;

                        case 'mouseleave':
                            button.removeClass( 'webuploader-pick-hover' );
                            break;

                        case 'change':
                            files = me.exec( 'getFiles' );
                            me.trigger( 'select', $.map( files, function( file ) {
                                return new File( me.getRuid(), file );
                            } ));
                            break;
                    }
                });

                me.connectRuntime( opts, function() {
                    me.refresh();
                    me.exec( 'init', opts );
                });

                $( window ).on( 'resize', function(){
                    me.refresh();
                });
            },

            refresh: function() {
                var shimContainer = this.getRuntime().getContainer(),
                    button = this.options.button,
                    width = button.outerWidth(),
                    height = button.outerHeight(),
                    pos = button.offset();

                width && shimContainer.css({
                    width: width + 'px',
                    height: height + 'px'
                }).offset( pos );
            },

            destroy: function() {
                if ( this.runtime ) {
                    this.exec( 'destroy' );
                    this.disconnectRuntime();
                }
            }
        } );

        return FilePicker;
    });

    /**
     * @fileOverview 组件基类。
     */
    define( 'widgets/widget', [
        'base',
        'core/uploader'
    ], function( Base, Uploader ) {

        var $ = Base.$,
            _init = Uploader.prototype._init,
            IGNORE = {},
            widgetClass = [];

        function isArrayLike( obj ) {
            if ( !obj ) {
                return false;
            }

            var length = obj.length,
                type = $.type( obj );

            if ( obj.nodeType === 1 && length ) {
                return true;
            }

            return type === 'array' || type !== 'function' && type !== 'string' &&
                    (length === 0 || typeof length === 'number' && length > 0 &&
                    (length - 1) in obj);
        }

        function Widget( uploader ) {
            this.owner = uploader;
            this.options = uploader.options;
        }

        $.extend( Widget.prototype, {

            init: Base.noop,

            // 类Backbone的事件监听声明，监听uploader实例上的事件
            // widget直接无法监听事件，事件只能通过uploader来传递
            invoke: function( apiName, args ) {

                /*
                    {
                        'make-thumb': 'makeThumb'
                    }
                 */
                var map = this.responseMap;

                // 如果无API响应声明则忽略
                if ( !map || !(apiName in map) || !(map[ apiName ] in this) ||
                        !$.isFunction( this[ map[ apiName ] ] ) ) {

                    return IGNORE;
                }

                return this[ map[ apiName ] ].apply( this, args );

            },

            request: function() {
                return this.owner.request.apply( this.owner, arguments );
            }
        });

        // 扩展Uploader.
        $.extend( Uploader.prototype, {

            // 覆写_init用来初始化widgets
            _init: function() {
                var me = this,
                    widgets = me._widgets = [];

                $.each( widgetClass, function( _, klass ) {
                    widgets.push( new klass( me ) );
                });

                return _init.apply( me, arguments );
            },

            request: function( apiName, args, callback ) {
                var i = 0,
                    widgets = this._widgets,
                    len = widgets.length,
                    rlts = [],
                    dfds = [],
                    widget, rlt;

                args = isArrayLike( args ) ? args : [ args ];

                for ( ; i < len; i++ ) {
                    widget = widgets[ i ];
                    rlt = widget.invoke( apiName, args );

                    if ( rlt !== IGNORE ) {

                        // Deferred对象
                        if ( Base.isPromise( rlt ) ) {
                            dfds.push( rlt );
                        } else {
                            rlts.push( rlt );
                        }
                    }
                }

                // 如果有callback，则用异步方式。
                if ( callback || dfds.length ) {
                    return Base.when.apply( Base, dfds )

                            // 很重要不能删除。删除了会死循环。
                            // 保证执行顺序。让callback总是在下一个tick中执行。
                            .then(function() {
                                var deferred = Base.Deferred(),
                                    args = arguments;

                                setTimeout(function() {
                                    deferred.resolve.apply( deferred, args );
                                }, 1 );

                                return deferred.promise();
                            })
                            .then( callback || Base.noop );
                } else {
                    return rlts[ 0 ];
                }
            }
        });

        /**
         * 添加组件
         * @param  {object} widgetProto 组件原型，构造函数通过constructor属性定义
         * @param  {object} responseMap API名称与函数实现的映射
         * @example
         *     Uploader.register( {
         *         init: function( options ) {},
         *         makeThumb: function() {}
         *     }, {
         *         'make-thumb': 'makeThumb'
         *     } );
         */
        Uploader.register = function( responseMap, widgetProto ) {
            var map = { init: 'init' },
                klass;

            if ( arguments.length === 1 ) {
                widgetProto = responseMap;
                widgetProto.responseMap = map;
            } else {
                widgetProto.responseMap = $.extend( map, responseMap );
            }

            klass = Base.inherits( Widget, widgetProto );
            widgetClass.push( klass );

            return klass;
        };

        return Widget;
    });

    /**
     * @fileOverview 组件基类。
     */
    define( 'widgets/filepicker', [
        'base',
        'core/uploader',
        'lib/filepicker',
        'widgets/widget'
    ], function(Base, Uploader, FilePicker) {

        var $ = Base.$,
            browser = Base.browser;

        $.extend( Uploader.options, {
            pick: {
                multiple: true,
                id: '#uploaderBtn'
            },

            accept: [{
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }]
        });

        return Uploader.register({
            'add-btn': 'addButton',
            'refresh': 'refresh'
        },

        {
            init: function( opts ) {
                this.pickers = [];
                return opts.pick && this.addButton( opts.pick );
            },

            refresh: function() {
                $.each( this.pickers, function() {
                    this.refresh();
                });
            },

            addButton: function( pick ) {
                var me = this,
                    opts = me.options,
                    options, picker, deferred;

                if ( !pick ) {
                    return;
                }

                deferred = Base.Deferred();
                if (typeof pick === 'string') {
                    pick = {
                        id: pick
                    };
                }

                options = $.extend({}, pick, {
                    accept: opts.accept,
                    swf: opts.swf,
                    runtimeOrder: opts.runtimeOrder
                });

                picker = new FilePicker(options);

                picker.once('ready', deferred.resolve);
                picker.on('select', function(files) {
                    me.owner.request('add-file', [files]);
                });
                picker.init();

                this.pickers.push( picker );

                return deferred.promise();
            }
        });
    });

    /**
     * @fileOverview 错误信息
     */
    define( 'lib/dnd', [
        'base',
        'core/mediator',
        'runtime/client',
        'runtime/runtime'
    ], function( Base, Mediator, RuntimeClent, Runtime ) {

        var $ = Base.$;

        function DragAndDrop( opts ) {
            opts = this.options = $.extend( {}, DragAndDrop.options, opts );

            opts.container = $( opts.container );

            if ( !opts.container.length ) {
                throw new Error( '容器没有找到' );
            }

            RuntimeClent.call( this, 'DragAndDrop' );
        }

        DragAndDrop.options = {
            accept: null
        };

        Base.inherits( RuntimeClent, {
            constructor: DragAndDrop,

            init: function() {
                var me = this;

                me.connectRuntime( me.options, function() {
                    me.exec( 'init' );
                });
            },

            destroy: function() {
                this.disconnectRuntime();
            }
        } );

        Mediator.installTo( DragAndDrop.prototype );

        return DragAndDrop;
    });

    /**
     * @fileOverview DragAndDrop Widget。
     */
    define( 'widgets/filednd', [
        'base',
        'core/uploader',
        'lib/dnd',
        'widgets/widget'
    ], function( Base, Uploader, Dnd ) {

        var $ = Base.$;

        Uploader.options.dnd = '';

        return Uploader.register({
            init: function( opts ) {

                if ( !opts.dnd || this.request( 'get-runtime-type' ) !== 'html5' ) {
                    return;
                }

                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend( {}, {
                        container: opts.dnd,
                        accept: opts.accept
                    } ),
                    dnd;

                dnd = new Dnd( options );

                dnd.once( 'ready', deferred.resolve );
                dnd.on( 'drop', function( files ) {
                    me.request('add-file', [files]);
                } );
                dnd.init();

                return deferred.promise();
            }
        });
    });

    /**
     * @fileOverview 文件属性封装
     */
    define( 'core/file', [
        'base',
        'core/mediator'
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
            this.loaded = 0;

            this.on( 'error', function( msg ) {
                this.setStatus( WUFile.Status.ERROR, msg );
            });
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
        });

        Mediator.installTo( WUFile.prototype );

        WUFile.Status = {
            INITED:     'inited',    // 初始状态
            QUEUED:     'queued',    // 已经进入队列, 等待上传
            PROGRESS:   'progress',    // 上传中
            ERROR:      'error',    // 上传出错，可重试
            COMPLETE:   'complete',    // 上传完成。
            CANCELLED:  'cancelled',    // 上传取消。
            INTERRUPT:  'interrupt',    // 上传中断，可续传。
            INVALID:    'invalid'    // 文件不合格，不能重试上传。
        };

        return WUFile;
    });

    /**
     * @fileOverview 文件队列
     */
    define( 'core/queue', [
        'base',
        'core/mediator',
        'core/file'
    ], function( Base, Mediator, WUFile ) {

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
            fetch: function() {
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

                    if ( sts.length && !~$.inArray( file.getStatus(), sts ) ) {
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

                    case STATUS.INVALID:
                        stats.numOfInvalid--;
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
                        stats.numOfInvalid++;
                        break;
                }
            }

        });

        Mediator.installTo( Queue.prototype );

        return Queue;
    });

    /**
     * @fileOverview 队列
     */
    define( 'widgets/queue', [
        'base',
        'core/uploader',
        'core/queue',
        'core/file'
    ], function( Base, Uploader, Queue, WUFile ) {

        var $ = Base.$,
            Status = WUFile.Status;

        return Uploader.register({
            'add-file': 'addFiles',
            'get-file': 'getFile',
            'fetch-file': 'fetchFile',
            'get-stats': 'getStats',
            'get-files': 'getFiles',
            'remove-file': 'removeFile',
            'retry': 'retry'
        },

        {
            init: function( opts ) {
                var len, i, item, arr, accept;

                // accept中的中生成匹配正则。
                if ( opts.accept ) {
                    arr = [];

                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        item = opts.accept[ i ].extensions;
                        item && arr.push( item );
                    }

                    if ( arr.length ) {
                        accept = arr.join( ',' );
                        accept = accept.replace(/,/g, '$|').replace(/\*/g, '.*');
                    }
                }
                this.accept = accept = new RegExp(accept, 'i');

                this.queue = new Queue();
                this.stats = this.queue.stats;
            },

            _addFile: function( file ) {
                var me = this;

                if ( !file || file.size < 6 || !me.accept.test( file.type ) ) {
                    return;
                }

                if ( !(file instanceof WUFile) ) {
                    file = new WUFile( file );
                }

                if ( !me.owner.trigger( 'beforeFileQueued', file ) ) {
                    return;
                }

                me.queue.append( file );
                me.owner.trigger( 'fileQueued', file );
                return file;
            },

            getFile: function( fileId ) {
                return this.queue.getFile( fileId );
            },

            addFiles: function( files ) {
                var me = this;

                if ( !files.length ) {
                    files = [ files ];
                }

                files = $.map( files, function( file ) {
                    return me._addFile( file );
                });

                me.owner.trigger( 'filesQueued', files );
            },

            getStats: function() {
                return this.stats;
            },

            removeFile: function( file ) {
                var me = this;

                file = file.id ? file : me.queue.getFile( file );

                file.setStatus( Status.CANCELLED );
                me.owner.trigger( 'fileDequeued', file );
            },

            getFiles: function() {
                return this.queue.getFiles.apply( this.queue, arguments );
            },

            fetchFile: function() {
                return this.queue.fetch.apply( this.queue, arguments );
            },

            retry: function( file, noForceStart ) {
                var me = this;

                if ( file ) {
                    file = file.id ? file : me.queue.getFile( file );
                    file.setStatus( Status.QUEUED );
                    noForceStart || me.request( 'start-upload' );
                    return;
                }

                var files = me.queue.getFiles( Status.ERROR ),
                    i = 0,
                    len = files.length;

                for( ; i < len; i++ ) {
                    file = files[ i ];
                    file.setStatus( Status.QUEUED );
                }

                me.request( 'start-upload' );
            }
        });

    });

    /**
     * @fileOverview DragAndDrop Widget。
     */
    define( 'widgets/runtime', [
        'base',
        'core/uploader',
        'runtime/runtime'
    ], function( Base, Uploader, Runtime ) {

        var $ = Base.$;

        return Uploader.register({
                'get-runtime-type': 'getRuntmeType'
            }, {

            init: function() {
                if ( !this.getRuntmeType() ) {
                    throw Error( 'Runtime Error' );
                }
            },

            getRuntmeType: function() {
                var orders = this.options.runtimeOrder || Runtime.orders,
                    type = this.type,
                    i, len;

                if ( !type ) {
                    orders = orders.split(/\s*,\s*/g);
                    for ( i = 0, len = orders.length; i < len; i++ ) {
                        if ( Runtime.hasRuntime( orders[ i ] ) ) {
                            this.type = type = orders[ i ];
                            break;
                        }
                    }
                }

                return type;
            }
        });
    });

    /**
     * @fileOverview Transport
     */
    define( 'lib/transport', [
        'base',
        'runtime/client',
        'core/mediator'
    ], function( Base, RuntimeClient, Mediator ) {

        var $ = Base.$;

        function Transport( opts ) {
            this.options = $.extend( true, {}, Transport.options, opts || {} );
            RuntimeClient.call( this, 'Transport' );

            this._blob = null;
            this._formData = opts.formData || {};
            this._headers = opts.headers || {};

            this.on( 'progress', this._timeout );
        }

        Transport.options = {
            server: '',
            method: 'POST',

            // 跨域时，是否允许携带cookie, 只有html5 runtime才有效
            withCredentials: false,
            fileVar: 'file',
            timeout: 2 * 60 * 1000,    // 2分钟
            formData: {},
            headers: {},
            sendAsBinary: false
        };

        $.extend( Transport.prototype, {

            // 添加Blob, 只能添加一次，最后一次有效。
            appendBlob: function( key, blob, filename ) {
                var me = this,
                    opts = me.options;

                if ( me.getRuid() ) {
                    me.disconnectRuntime();
                }

                // 连接到blob归属的同一个runtime.
                me.connectRuntime( blob.ruid, function() {
                    me.exec( 'init' );
                } );

                me._blob = blob;
                opts.fileVar = key || opts.fileVar;
                opts.filename = filename;
            },

            // 添加其他字段
            append: function( key, value ) {
                if ( typeof key === 'object' ) {
                    $.extend( this._formData, key );
                } else {
                    this._formData[ key ] = value;
                }
            },

            setRequestHeader: function( key, value ) {
                if ( typeof key === 'object' ) {
                    $.extend( this._headers, key );
                } else {
                    this._headers[ key ] = value;
                }
            },

            send: function( method ) {
                this.exec( 'send' );
                this._timeout();
            },

            abort: function() {
                return this.exec( 'abort' );
            },

            destroy: function() {
                this.trigger( 'destroy' );
                this.off();
                this.exec( 'destroy' );
                this.disconnectRuntime();
            },

            getResponse: function() {
                return this.exec( 'getResponse' );
            },

            getResponseAsJson: function() {
                return this.exec( 'getResponseAsJson' );
            },

            getResponseHeader: function() {
                return this.exec( 'getResponseHeader' );
            },

            _timeout: function() {
                var me = this,
                    duration = me.options.timeout;

                if ( !duration ) {
                    return;
                }

                clearTimeout( me._timer );
                me._timer = setTimeout(function() {
                    me.abort();
                    me.trigger( 'error', 'timeout' );
                }, duration );
            }

        } );

        Mediator.installTo( Transport.prototype );

        return Transport;
    });

    /**
     * @fileOverview 数据发送
     */
    define( 'widgets/upload', [
        'base',
        'core/uploader',
        'core/file',
        'lib/transport'
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
            }
        }

        Uploader.register({
            'start-upload': 'start',
            'stop-upload': 'stop',
            'skip-file': 'skipFile',
            'is-in-progress': 'isInProgress'
        }, {

            init: function( opts ) {
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

                me.owner.trigger( 'startUpload' );
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

                me.owner.trigger( 'stopUpload' );
            },

            isInProgress: function() {
                return !!this.runing;
            },

            getStats: function() {
                return this.request( 'get-stats' );
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
                        me.owner.trigger( 'uploadFinished' );
                    });
                    me._trigged = true;
                }
            },

            _getNextBlock: function() {
                var me = this,
                    owner = me.owner,
                    act = me._act,
                    opts = me.options,
                    file, deferred, next, done;

                if ( act && act.has() && act.file.getStatus() === Status.PROGRESS ) {

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

                        me._act = act = new Wrapper( file, opts.chunked ? opts.chunkSize : 0 );
                        return act.fetch();
                    };

                    return next && next.promise ? next.then( done ) : done( next );
                }

                return null;
            },

            _prepareNextFile: function() {
                var file = this.request( 'fetch-file' ),
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
                        return owner.request( 'after-send-file', file, function() {
                                file.setStatus( Status.COMPLETE );
                                owner.trigger( 'uploadComplete', file );
                            })
                            .fail(function( reason ) {
                                if ( file.getStatus() === Status.PROGRESS ) {
                                    file.setStatus( Status.ERROR, type );
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
                    if ( block.chunks > 1 && ~'http,abort'.indexOf( type ) && block.retried < opts.chunkRetry ) {
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

                    if ( !owner.trigger( 'uploadAccept', block, ret, headers, fn ) ) {
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
                                if ( file.getStatus() === Status.PROGRESS ) {
                                    file.setStatus( Status.ERROR, type );
                                }
                                owner.trigger( 'uploadError', file, reason );
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
                    tr.append(data);
                    tr.setRequestHeader( headers );

                    tr.send();
                })
            }

        });
    });

    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define( 'runtime/compbase', [
        'base'
    ], function( Base ) {

        function CompBase( owner, runtime ) {

            this.owner = owner;
            this.options = owner.options;

            this.getRuntime = function() {
                return runtime;
            };

            this.getRuid = function() {
                return runtime.uid;
            };

            this.trigger = function() {
                return owner.trigger.apply( owner, arguments );
            };
        }

        return CompBase;
    });

    /**
     * @fileOverview Html5Runtime
     */
    define( 'runtime/html5/runtime', [
        'base',
        'runtime/runtime',
        'runtime/compbase'
    ], function( Base, Runtime, CompBase ) {

        var $ = Base.$,
            type = 'html5',
            pool = {},
            components = {};

        function Html5Runtime() {
            var pool = {},
                me = this,
                destory = this.destory;

            Runtime.apply( me, arguments );
            me.type = type;


            // 这个方法的调用者，实际上是RuntimeClient
            me.exec = function( comp, fn/*, args...*/) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice( arguments, 2 ),
                    instance;

                if ( components[ comp ] ) {
                    instance = pool[ uid ] = pool[ uid ] || new components[ comp ]( client, me );

                    if ( instance[ fn ] ) {
                        return instance[ fn ].apply( instance, args );
                    }
                }
            }

            me.destory = function() {
                // @todo 删除池子中的所有实例
                return destory && destory.apply( this, arguments );
            };
        }

        Base.inherits( Runtime, {
            constructor: Html5Runtime,

            // 不需要连接其他程序，直接执行callback
            init: function( cb ) {
                var me = this;
                setTimeout( function() {
                    me.trigger('ready');
                }, 1 );
            }

        } );

        Html5Runtime.register = function( name, component ) {
            return components[ name ] = Base.inherits( CompBase, component );
        };

        // 注册html5运行时。
        if ( window.Blob && window.FileReader && window.DataView ) {
            Runtime.addRuntime( type, Html5Runtime );
        }

        return Html5Runtime;
    });

    /**
     * @fileOverview Blob Html实现
     */
    define( 'runtime/html5/blob', [
        'runtime/html5/runtime',
        'lib/blob'
    ], function( Html5Runtime, Blob ) {

        return Html5Runtime.register( 'Blob', {
            slice: function( start, end ) {
                var blob = this.owner.source,
                    slice = blob.slice || blob.webkitSlice || blob.mozSlice;

                blob = slice.call( blob, start, end );

                return new Blob( this.getRuid(), blob );
            }
        });
    });

    /**
     * @fileOverview Transport
     * @todo 支持chunked传输，优势：
     * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
     * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
     */
    define( 'runtime/html5/transport', [
        'base',
        'runtime/html5/runtime'
    ], function( Base, Html5Runtime ) {

        var noop = Base.noop,
            $ = Base.$;

        return Html5Runtime.register( 'Transport', {
            init: function() {
                this._status = 0;
                this._response = null;
                this._responseHeader = null;
            },

            send: function() {
                var owner = this.owner,
                    opts = this.options,
                    xhr = this._initAjax(),
                    blob = owner._blob,
                    server = opts.server,
                    formData, binary;

                if ( opts.sendAsBinary ) {
                    server += (/\?/.test(server) ? '&' : '?') + $.param( owner._formData );
                    binary = blob.getSource();
                } else {
                    formData = new FormData();
                    $.each( owner._formData, function( k, v ) {
                        formData.append( k, v );
                    });

                    formData.append( opts.fileVar, blob.getSource(), opts.filename || owner._formData.name || '' );
                }

                if ( opts.withCredentials && 'withCredentials' in xhr ) {
                    xhr.open( opts.method, server, true );
                    xhr.withCredentials = true;
                } else {
                    xhr.open( opts.method, server );
                }

                this._setRequestHeader( xhr, opts.headers );
                binary && xhr.overrideMimeType('application/octet-stream');
                xhr.send( binary || formData );
            },

            getResponse: function() {
                return this._response;
            },

            getResponseAsJson: function() {
                return this._parseJson( this._response );
            },

            getStatus: function() {
                return this._status;
            },

            getResponseHeader: function() {
                return this._responseHeader;
            },

            abort: function() {
                var xhr = this._xhr;

                if ( xhr ) {
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    xhr.abort();

                    this._xhr = xhr = null;
                }
            },

            destroy: function() {
                this.abort();
            },

            _initAjax: function() {
                var me = this,
                    xhr = new XMLHttpRequest(),
                    opts = this.options;

                if ( opts.withCredentials && !('withCredentials' in xhr) &&
                        typeof XDomainRequest !== 'undefined' ) {
                    xhr = new XDomainRequest();
                }

                xhr.upload.onprogress = function( e ) {
                    var percentage = 0;

                    if ( e.lengthComputable ) {
                        percentage = e.loaded / e.total;
                    }

                    return me.trigger( 'progress', percentage );
                }

                xhr.onreadystatechange = function() {
                    var ret, rHeaders, reject;

                    if ( xhr.readyState !== 4 ) {
                        return;
                    }

                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    me._xhr = null;

                    // 只考虑200的情况
                    if ( xhr.status === 200 ) {
                        me._response = xhr.responseText;
                        me._responseHeader = me._parseXhrHeaders( xhr );
                        return me.trigger( 'load' );
                    }

                    me._status = xhr.status;
                    xhr = null;

                    return me.trigger( 'error', me._status ? 'http' : 'abort' );
                };

                return me._xhr = xhr;
            },

            _setRequestHeader: function( xhr, headers ) {
                $.each( headers, function( key, val ) {
                    xhr.setRequestHeader( key, val );
                });
            },

            _parseXhrHeaders: function( xhr ) {
                var str = xhr.getAllResponseHeaders(),
                    ret = {};


                $.each( str.split( /\n/ ), function( i, str ) {
                    var match = /^(.*?): (.*)$/.exec( str );

                    if ( match ) {
                        ret[ match[ 1 ] ] = match[ 2 ];
                    }
                });

                return ret;
            },

            _parseJson: function( str ) {
                var json;

                try {
                    json = JSON.parse( str );
                } catch ( ex ) {
                    json = {};
                }

                return json;
            }
        });
    });

    /**
     * @fileOverview FilePicker
     */
    define( 'runtime/html5/filepicker', [
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function( Base, Html5Runtime, File ) {

        var $ = Base.$;

        function getMineTypeByExtensions( extensition ) {

        }

        return Html5Runtime.register( 'FilePicker', {
            init: function() {
                var container = this.getRuntime().getContainer(),
                    me = this,
                    owner = me.owner,
                    opts = me.options,
                    lable = $( document.createElement( 'label' ) ),
                    input = $( document.createElement( 'input' ) ),
                    browser = Base.browser,
                    arr, i, len, mouseHandler;

                input.attr( 'type', 'file' );

                input.css({
                    position: 'absolute',
                    clip: 'rect(1px,1px,1px,1px)'
                });

                lable.on( 'click', function() {
                    input.trigger( 'click' );
                });

                lable.css({
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'pointer',
                    background: '#ffffff'
                });

                if ( opts.multiple ) {
                    input.attr( 'multiple', 'multiple' );
                }

                // @todo Firefox不支持单独指定后缀
                if ( opts.accept && opts.accept.length > 0 ) {
                    arr = [];

                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        arr.push( opts.accept[i].mimeTypes );
                    };

                    input.attr( 'accept', arr.join( ',' ) );
                }

                container.append( input );
                container.append( lable );

                mouseHandler = function( e ) {
                    owner.trigger( e.type );
                };

                input.on( 'change', function( e ) {
                    var fn = arguments.callee,
                        ruid = owner.getRuid(),
                        clone;

                    me.files = e.target.files;

                    // reset input
                    clone = this.cloneNode( true );
                    this.parentNode.replaceChild( clone, this );

                    input.off();
                    input = $( clone ).on( 'change', fn ).on( 'mouseenter mouseleave', mouseHandler);

                    owner.trigger( 'change' );
                } );

                lable.on( 'mouseenter mouseleave', mouseHandler );

            },


            getFiles: function() {
                return this.files;
            },

            destroy: function() {
                // todo
            }
        } );
    });

    /**
     * @fileOverview FilePaste
     */
    define( 'runtime/html5/dnd', [
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function( Base, Html5Runtime, File ) {

        var $ = Base.$;

        return Html5Runtime.register( 'DragAndDrop', {
            init: function() {
                var elem = this.elem = this.options.container;

                this.dragEnterHander = Base.bindFn( this._dragEnterHander, this );
                this.dragLeaveHander = Base.bindFn( this._dragLeaveHander, this );
                this.dropHander = Base.bindFn( this._dropHander, this );

                elem.on( 'dragenter', this.dragEnterHander );
                elem.on( 'dragover', this.dragEnterHander );
                elem.on( 'dragleave', this.dragLeaveHander );
                elem.on( 'drop', this.dropHander );
            },

            _dragEnterHander: function( e ) {
                this.elem.addClass( 'webuploader-dnd-over' );
                e.stopPropagation();
                e.preventDefault();
            },

            _dragLeaveHander: function( e ) {
                this.elem.removeClass( 'webuploader-dnd-over' );
                e.stopPropagation();
                e.preventDefault();
            },

            // _dragOverHander: function( e ) {
            //     var elem = this.elem[ 0 ],
            //         target = e.target;

            //     $.contains( elem, target ) || elem === target || e.preventDefault();
            //     e.stopPropagation();
            // },

            _dropHander: function( e ) {
                var results  = [],
                    promises = [],
                    me = this,
                    ruid = me.getRuid(),
                    items, files, dataTransfer, file, i, len, canAccessFolder;

                e.preventDefault();
                e.stopPropagation();

                e = e.originalEvent || e;
                dataTransfer = e.dataTransfer;
                items = dataTransfer.items;
                files = dataTransfer.files;

                canAccessFolder = !!(items && items[ 0 ].webkitGetAsEntry);

                for ( i = 0, len = files.length; i < len; i++ ) {
                    file = files[ i ];
                    if ( file.type ) {
                        results.push( file );
                    } else if ( !file.type && canAccessFolder ) {
                        promises.push( this._traverseDirectoryTree( items[ i ].webkitGetAsEntry(), results ) )
                    }
                }

                Base.when.apply( Base, promises ).done(function(){
                    me.trigger( 'drop', $.map( results, function( file ) {
                        return new File( ruid, file );
                    }));
                });

                this.elem.removeClass( 'webuploader-dnd-over' );
            },

            _traverseDirectoryTree: function( entry, results ) {
                var deferred = Base.Deferred(),
                    me = this;

                if ( entry.isFile ) {
                    entry.file(function( file ) {
                        file.type && results.push( file );
                        deferred.resolve( true );
                    });
                } else if ( entry.isDirectory ) {
                    entry.createReader().readEntries(function( entries ) {
                        var len = entries.length,
                            promises = [],
                            arr = [],  // 为了保证顺序。
                            i;

                        for ( i = 0; i < len; i++ ) {
                            promises.push( me._traverseDirectoryTree( entries[ i ], arr ) );
                        }

                        Base.when.apply( Base, promises ).then(function() {
                            results.push.apply( results, arr );
                            deferred.resolve( true );
                        }, deferred.reject);
                    });
                }

                return deferred.promise();
            },

            destroy: function() {
                var elem = this.elem;

                elem.on( 'dragenter', this.dragEnterHander );
                elem.on( 'dragover', this.dragEnterHander );
                elem.on( 'dragleave', this.dragLeaveHander );
                elem.on( 'drop', this.dropHander );
            }
        });
    });

    /**
     * @file 暴露变量给外部使用。
     */
    require([
        'base'
    ], function( Base ) {

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
    });
})( this );