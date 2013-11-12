/**
 * @fileOverview 图片预览，输入为Blob, 输出为Base64
 * @import base.js, runtime/flash/runtime.js
 */
define( 'webuploader/runtime/flash/imagepreview', [
        'webuploader/base',
        'webuploader/runtime/flash/runtime'
    ], function( Base, FlashRuntime ) {

        var $ = Base.$;

        return FlashRuntime.register( 'ImagePreview', {
            init: function( opts ) {
            },

            preview: function( blob, width, height ) {
               var uid = blob.uid;

               this.flashExec( 'ImagePreview', 'preview', uid, width, height );
            },

            getMetas: function() {
                // @todo
            }
        } );
    } );