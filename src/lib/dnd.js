/**
 * @fileOverview 错误信息
 * @import base.js, core/mediator.js, runtime/client.js, runtime/runtime.js
 */
define( 'webuploader/lib/dnd', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/runtime/client',
        'webuploader/runtime/runtime'
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

    DragAndDrop.support = function() {
        return Runtime.hasRuntime( 'html5' );
    };

    return DragAndDrop;
});