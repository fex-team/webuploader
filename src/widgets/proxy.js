/**
 * @fileOverview Proxy 在Uploader上增加widget代理功能
 */
define( 'webuploader/widgets/proxy', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/uploader',
        'webuploader/widgets/widget'
        ], function( Base, Mediator, Uploader, Widget ) {

    var $ = Base.$,
        uploaderProto = Uploader.prototype,
        widgetClass = [],
        widgets = [],
        IGNORE = {};

    $.extend( Uploader.prototype, {
        _init: function() {
            this._initWidgets();
            this._checkReady();
        },
        _initWidgets: function() {
            var me = this;

            $.each( widgetClass, function( idx, klass ) {
                var ins = new klass( me );
                ins._ignore_ = IGNORE;

                widgets.push( ins );
            } );
        },
        _checkReady: function() {
            var me = this;

            this.request( 'is-ready', [], function() {
                me.state = 'ready';
                me.trigger( 'ready' );
            } );
        },

        request: function( apiName, args, callback ) {
            var i = 0,
                len = widgets.length,
                rlts = [],
                dfds = [],
                widget,
                rlt;

            args = args || [];

            for( ; i < len; i++ ) {
                widget = widgets[ i ];
                rlt = widget.invoke( apiName, [].slice.call( args, 0 ) );

                if ( rlt !== IGNORE ) {

                    // Deferred对象
                    if ( rlt && rlt.when ) {
                        dfds.push( rlt );
                    }
                    else {
                        rlts.push( rlt );
                    }
                };
            }

            if ( !callback || !dfds.length ) {
                // 暂时只返回单个结果
                return rlts[ 0 ];
            }

            // 等待所有Deferred对象完成后调用回调
            else {

                Base.when.apply( Base, dfds ).done( function() {
                    callback.apply( null, 
                        rlts.concat( [].slice.call( arguments, 0 ) ) );
                } );

            }
        }
    } );


    // 静态方法与属性
    $.extend( Uploader, {
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
        register: function( widgetProto, responseMap ) {
            widgetProto.responseMap = responseMap;
            var klass = Base.inherits( Widget, widgetProto );
            return widgetClass.push( klass );
        }
    } );
});