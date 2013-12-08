/**
 * @fileOverview 图片压缩
 */
define([
    'runtime'
], function( FlashRuntime ) {

    return FlashRuntime.register( 'ImageCompress', {

        compress: function( blob, width, height ) {
            var uid = blob.uid;

            this.flashExec( 'ImageCompress', 'compress', uid, width, height );
        },

        setMetas: function() {
            // @todo
        }
    });
});