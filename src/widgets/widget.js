/**
 * @fileOverview 组件基类。
 * @import base.js
 */
define( 'webuploader/widgets/widget', [ 'webuploader/base',
        'webuploader/core/uploader' ], function( Base, Uploader ) {

    var $ = Base.$
        _init = Uploader.prototype._init,
        IGNORE = {},
        widgetClass = [],
        toString = Object.prototype.toString;

    function isArrayLike( obj ) {
        return obj && ~[ '[object Arguments]', '[object Array]'].indexOf( toString.call( obj ) );
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
            if ( !map
                || !( apiName in map )
                || !( map[ apiName ] in this )
                || !$.isFunction( this[ map[ apiName ] ] ) ) {
                return IGNORE;
            }

            return this[ map[ apiName ] ].apply( this, args );

        },

        request: function( apiName, args, callback ) {
            return this.owner.request.apply( this.owner, arguments );
        }
    } );

    // 扩展Uploader.
    $.extend( Uploader.prototype, {

        // 覆写_init用来初始化widgets
        _init: function() {
            var me = this,
                widgets = me._widgets = [];

            $.each( widgetClass, function( _, klass ) {
                widgets.push( new klass( me ) );
            } );

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

            for( ; i < len; i++ ) {
                widget = widgets[ i ];
                rlt = widget.invoke( apiName, args );

                if ( rlt !== IGNORE ) {

                    // Deferred对象
                    if ( Base.isPromise( rlt ) ) {
                        dfds.push( rlt );
                    } else {
                        rlts.push( rlt );
                    }
                };
            }

            // 如果有callback，则用异步方式。
            if ( callback || dfds.length ) {
                Base.when.apply( Base, dfds ).done( callback || Base.noop );
            } else {
                return rlts[ 0 ];
            }
        }
    } );

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

        if ( arguments.length === 1 ) {
            widgetProto = responseMap;
        }
        else {
            widgetProto.responseMap = $.extend({ init: 'init' }, responseMap);
        }

        var klass = Base.inherits( Widget, widgetProto );
        widgetClass.push( klass );

        return klass;
    };

    return Widget;
} );