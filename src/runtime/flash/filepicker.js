/**
 * @fileOverview FilePicker
 */
define([
    '../../base',
    './runtime'
], function( Base, FlashRuntime ) {
    var $ = Base.$;

    return FlashRuntime.register( 'FilePicker', {
        init: function( opts ) {
            var copy = $.extend({}, opts ),
                len, i;

            // 修复Flash再没有设置title的情况下无法弹出flash文件选择框的bug.
            len = copy.accept && copy.accept.length;
            for (  i = 0; i < len; i++ ) {
                if ( !copy.accept[ i ].title ) {
                    copy.accept[ i ].title = 'Files';
                }
            }

            delete copy.button;
            delete copy.id;
            delete copy.container;

            this.flashExec( 'FilePicker', 'init', copy );
        },

        destroy: function() {
            this.flashExec( 'FilePicker', 'destroy' );
        }
    });
});