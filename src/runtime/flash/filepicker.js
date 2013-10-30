/**
 * @fileOverview FilePicker
 * @import base.js, runtime/flash/runtime.js, lib/file.js
 */
define( 'webuploader/runtime/flash/filepicker', [
        'webuploader/base',
        'webuploader/runtime/flash/runtime',
        'webuploader/lib/file'
    ], function( Base, FlashRuntime, File ) {

        var $ = Base.$;

        return FlashRuntime.register( 'FilePicker', {
            init: function( opts ) {
                var copy = $.extend( {}, opts );

                delete copy.button;
                delete copy.container;

                this.flashExec( 'FilePicker', 'init', copy );
            },

            destroy: function() {
                // todo
            }
        } );
    } );