/**
 * @fileOverview 错误信息
 */
define([
    '../base',
    '../mediator',
    '../runtime/client'
], function( Base, Mediator, RuntimeClent ) {

    var $ = Base.$;

    function FilePaste( opts ) {
        opts = this.options = $.extend({}, opts );
        opts.container = $( opts.container || document.body );
        RuntimeClent.call( this, 'FilePaste' );
    }

    Base.inherits( RuntimeClent, {
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