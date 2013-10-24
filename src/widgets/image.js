/**
 * @fileOverview 图片操作
 * @import base.js, core/uploader.js
 */
define( 'webuploader/widgets/image', [
    'webuploader/base',
    'webuploader/core/uploader' ], function(
        Base, Uploader ) {

    var $ = Base.$;

    return Uploader.register(
        {
            'image-resize': 'resize',
            'make-thumb': 'makeThumb'
        },

        {

            init: function( opts ) {
                this.Image = this.runtime.getComponent( 'Image' );

                if ( opts.resize ) {
                    $.extend( this.Image.defaultOptions.resize, opts.resize );
                }
            },

            resize: function( source, callback ) {
                this.Image.resize( source, callback );
            },

            makeThumb: function( file, cb, width, height, type, quality ) {
                var runtime = this.runtime;

                file = this.request( 'get-file', [ file ] );

                // 只预览图片格式。
                if ( !file.type.match( /^image/ ) ) {
                    cb( true );
                    return;
                }

                this.Image.makeThumbnail( file.getSource(), cb, width, height,
                        true, type, quality );
            }
    });
} );