/**
 * @fileOverview 组件基类。
 */
define([
    '../base',
    '../uploader'
], function( Base, Uploader ) {

    var $ = Base.$,
        _init = Uploader.prototype._init,
        _destroy = Uploader.prototype.destroy,
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

        /**
         * 发送命令。当传入`callback`或者`handler`中返回`promise`时。返回一个当所有`handler`中的promise都完成后完成的新`promise`。
         * @method request
         * @grammar request( command, args ) => * | Promise
         * @grammar request( command, args, callback ) => Promise
         * @for  Uploader
         */
        request: function() {
            return this.owner.request.apply( this.owner, arguments );
        }
    });

    // 扩展Uploader.
    $.extend( Uploader.prototype, {

        /**
         * @property {String | Array} [disableWidgets=undefined]
         * @namespace options
         * @for Uploader
         * @description 默认所有 Uploader.register 了的 widget 都会被加载，如果禁用某一部分，请通过此 option 指定黑名单。
         */

        // 覆写_init用来初始化widgets
        _init: function() {
            var me = this,
                widgets = me._widgets = [],
                deactives = me.options.disableWidgets || '';

            $.each( widgetClass, function( _, klass ) {
                (!deactives || !~deactives.indexOf( klass._name )) &&
                    widgets.push( new klass( me ) );
            });

            return _init.apply( me, arguments );
        },

        request: function( apiName, args, callback ) {
            var i = 0,
                widgets = this._widgets,
                len = widgets && widgets.length,
                rlts = [],
                dfds = [],
                widget, rlt, promise, key;

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
                promise = Base.when.apply( Base, dfds );
                key = promise.pipe ? 'pipe' : 'then';

                // 很重要不能删除。删除了会死循环。
                // 保证执行顺序。让callback总是在下一个 tick 中执行。
                return promise[ key ](function() {
                            var deferred = Base.Deferred(),
                                args = arguments;

                            if ( args.length === 1 ) {
                                args = args[ 0 ];
                            }

                            setTimeout(function() {
                                deferred.resolve( args );
                            }, 1 );

                            return deferred.promise();
                        })[ callback ? key : 'done' ]( callback || Base.noop );
            } else {
                return rlts[ 0 ];
            }
        },

        destroy: function() {
            _destroy.apply( this, arguments );
            this._widgets = null;
        }
    });

    /**
     * 添加组件
     * @grammar Uploader.register(proto);
     * @grammar Uploader.register(map, proto);
     * @param  {object} responseMap API 名称与函数实现的映射
     * @param  {object} proto 组件原型，构造函数通过 constructor 属性定义
     * @method Uploader.register
     * @for Uploader
     * @example
     * Uploader.register({
     *     'make-thumb': 'makeThumb'
     * }, {
     *     init: function( options ) {},
     *     makeThumb: function() {}
     * });
     *
     * Uploader.register({
     *     'make-thumb': function() {
     *         
     *     }
     * });
     */
    Uploader.register = Widget.register = function( responseMap, widgetProto ) {
        var map = { init: 'init', destroy: 'destroy', name: 'anonymous' },
            klass;

        if ( arguments.length === 1 ) {
            widgetProto = responseMap;

            // 自动生成 map 表。
            $.each(widgetProto, function(key) {
                if ( key[0] === '_' || key === 'name' ) {
                    key === 'name' && (map.name = widgetProto.name);
                    return;
                }

                map[key.replace(/[A-Z]/g, '-$&').toLowerCase()] = key;
            });

        } else {
            map = $.extend( map, responseMap );
        }

        widgetProto.responseMap = map;
        klass = Base.inherits( Widget, widgetProto );
        klass._name = map.name;
        widgetClass.push( klass );

        return klass;
    };

    /**
     * 删除插件，只有在注册时指定了名字的才能被删除。
     * @grammar Uploader.unRegister(name);
     * @param  {string} name 组件名字
     * @method Uploader.unRegister
     * @for Uploader
     * @example
     *
     * Uploader.register({
     *     name: 'custom',
     *     
     *     'make-thumb': function() {
     *         
     *     }
     * });
     *
     * Uploader.unRegister('custom');
     */
    Uploader.unRegister = Widget.unRegister = function( name ) {
        if ( !name || name === 'anonymous' ) {
            return;
        }
        
        // 删除指定的插件。
        for ( var i = widgetClass.length; i--; ) {
            if ( widgetClass[i]._name === name ) {
                widgetClass.splice(i, 1)
            }
        }
    };

    return Widget;
});