/**
 * @fileOverview 图片压缩
 * @import base.js, runtime/flash/runtime.js
 */
define( 'webuploader/runtime/flash/imagepreview', [
        'webuploader/base',
        'webuploader/runtime/flash/runtime'
    ], function( Base, FlashRuntime ) {

        var $ = Base.$;

        return FlashRuntime.register( 'ImageCompress', {
            init: function( opts ) {
            },

            compress: function( blob, width, height ) {
               var uid = blob.uid;

               this.flashExec( 'ImageCompress', 'compress', uid, width, height );
            },

            setMetas: function() {
                // @todo
            }
        } );
    } );