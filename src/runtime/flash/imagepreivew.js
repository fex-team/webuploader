/**
 * @fileOverview 图片预览，输入为Blob, 输出为Base64
 */
define([
    './runtime'
], function( FlashRuntime ) {

    return FlashRuntime.register( 'ImagePreview', {

        preview: function( blob, width, height ) {
            var uid = blob.uid;

            this.flashExec( 'ImagePreview', 'preview', uid, width, height );
        },

        getMetas: function() {
            // @todo
        }
    });
});