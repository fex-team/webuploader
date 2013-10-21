/**
 * @fileOverview 组件基类。
 * @import widget.js
 */
define( 'webuploader/widgets/widget', [ 
    'webuploader/base',
    'webuploader/core/mediator' ], function( Base, Mediator ) {

    var $ = Base.$;

    function Widget( uploader ) {
        this.owner = uploader;
        this.options = uploader.options;
        this.runtime = uploader._runtime;
        this.bindEvents( this.events );

        this.init( this.options );
    }

    $.extend( Widget.prototype, {

        init: function( options ) {
            
        },

        // 类Backbone的事件监听声明，监听uploader实例上的事件
        // widget直接无法监听事件，事件只能通过uploader来传递
        // 
        /*
        events: {
        },
        */

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
                return this._ignore_;
            }

            return this[ map[ apiName ] ].apply( this, args );

        },

        request: function( apiName, args, callback ) {
            return this.owner.request.apply( this.owner, arguments );
        },

        bindEvents: function( events ) {
            var me = this,
                eventName,
                callback;

            if ( !events ) {
                return;
            }

            for( eventName in events ) {
                callback = events[ eventName ];

                if ( typeof callback === 'string' ) {
                    callback = me[ callback ];
                }

                if ( $.isFunction( callback ) ) {
                    me.owner.on( eventName, Base.bindFn( callback, me ) );
                }
            }
        }
    } );

    return Widget;
} );