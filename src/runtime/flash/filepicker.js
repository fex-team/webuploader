/**
 * @fileOverview FilePicker
 */
define([
    'base',
    './runtime'
], function( Base, FlashRuntime ) {
    var $ = Base.$;

    return FlashRuntime.register( 'FilePicker', {
        init: function( opts ) {
            var copy = $.extend({}, opts );

            delete copy.button;
            delete copy.container;

            this.flashExec( 'FilePicker', 'init', copy );
        },

        destroy: function() {
            // todo
        }
    });
});