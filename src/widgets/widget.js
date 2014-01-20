/**
 * @fileOverview 组件基类。
 */
define([
    '../base',
    '../uploader'
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
    Uploader.register = Widget.register = function( responseMap, widgetProto ) {
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