/**
 * @fileOverview 错误信息
 */
define([
    '../base',
    '../mediator',
    '../runtime/client'
], function( Base, Mediator, RuntimeClient ) {

    var $ = Base.$;

    function FilePaste( opts ) {
        opts = this.options = $.extend({}, opts );
        opts.container = $( opts.container || document.body );
        RuntimeClient.call( this, 'FilePaste', true );//与FilePicker一样为一种文件选择器，不能重用
    }

    Base.inherits( RuntimeClient, {
        constructor: FilePaste,

        init: function() {
            var me = this;

            me.connectRuntime( me.options, function() {
                me.exec('init');
                me.trigger('ready');
            });
        }
    });

    Mediator.installTo( FilePaste.prototype );

    return FilePaste;
});
