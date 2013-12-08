/**
 * @fileOverview 错误信息
 */
define([
    '../base',
    '../core/mediator',
    '../runtime/client'
], function( Base, Mediator, RuntimeClent ) {

    var $ = Base.$;

    function DragAndDrop( opts ) {
        opts = this.options = $.extend({}, DragAndDrop.options, opts );

        opts.container = $( opts.container );

        if ( !opts.container.length ) {
            throw new Error('容器没有找到');
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
                me.exec('init');
            });
        },

        destroy: function() {
            this.disconnectRuntime();
        }
    });

    Mediator.installTo( DragAndDrop.prototype );

    return DragAndDrop;
});