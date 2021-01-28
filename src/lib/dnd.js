/**
 * @fileOverview 错误信息
 */
define([
    '../base',
    '../mediator',
    '../runtime/client'
], function( Base, Mediator, RuntimeClient ) {

    var $ = Base.$;

    function DragAndDrop( opts ) {
        opts = this.options = $.extend({}, DragAndDrop.options, opts );

        opts.container = $( opts.container );

        if ( !opts.container.length ) {
            return;
        }

        RuntimeClient.call( this, 'DragAndDrop', true );//与FilePicker一样为一种文件选择器，不能重用
    }

    DragAndDrop.options = {
        accept: null,
        disableGlobalDnd: false
    };

    Base.inherits( RuntimeClient, {
        constructor: DragAndDrop,

        init: function() {
            var me = this;

            me.connectRuntime( me.options, function() {
                me.exec('init');
                me.trigger('ready');
            });
        }
    });

    Mediator.installTo( DragAndDrop.prototype );

    return DragAndDrop;
});
