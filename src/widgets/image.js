/**
 * @fileOverview 图片操作
 * @import base.js, widgets/widget.js, core/uploader.js, lib/imagecompress.js, lib/imagepreview.js
 */
define( 'webuploader/widgets/image', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/lib/imagecompress',
    'webuploader/lib/imagepreview' ], function(
        Base, Uploader, ImageCompress, ImagePreivew ) {

    var $ = Base.$,
        getInstance;

    $.extend( Uploader.options, {
        resize: {
            width: 1600,
            height: 1600,
            quality: 90
        }
    } );

    return Uploader.register(
        {
            'make-thumb': 'makeThumb',
            'before-start-transport': 'resizeImage'
        },

        {
            makeThumb: function( file, cb, width, height ) {
                var previewer;

                file = this.request( 'get-file', file );

                // 只预览图片格式。
                if ( !file.type.match( /^image/ ) ) {
                    cb( true );
                    return;
                }

                previewer = new ImagePreivew({
                    allowMagnify: true,
                    crop: true
                });

                previewer.once( 'complete', function() {
                    // 复用，下次图片操作的时候，直接赋值。
                    file.metas = previewer.getMetas();
                    file.orientation = previewer.getOrientation();

                    cb( false, previewer.getAsDataURL() );
                    previewer.destroy();
                });

                previewer.once( 'error', function( reason ) {
                    cb( reason || true );
                    previewer.destroy();
                });

                previewer.preview( file.source, width, height );
            },

            resizeImage: function( file ) {
                var resize = this.options.resize,
                    compressSize = 300 * 1024,
                    deferred, compressor;

                if ( resize &&(file.type === 'image/jpg' ||
                        file.type === 'image/jpeg') &&
                        file.size > compressSize && !file.resized ) {

                    deferred = Base.Deferred();

                    compressor = new ImageCompress({
                        preserveHeader: true
                    });

                    compressor.once( 'complete', function() {
                        var blob, size;

                        blob = compressor.getAsBlob();
                        compressor.destroy();
                        compressor = null;

                        size = file.size;
                        file.source = blob;
                        file.size = blob.size;

                        // 同一个文件可能重传，没必要多次压缩。
                        file.resized = true;
                        file.trigger( 'resize', blob.size, size );
                        // console.log( (blob.size * 100 / size).toFixed(2) + '%' );

                        deferred.resolve( true );

                    });

                    compressor.once( 'error', function( reason ) {
                        compressor.destroy();
                        deferred.reject( reason );
                    });

                    file.metas && compressor.setMetas( file.metas );
                    compressor.compress( file.source, resize.width, resize.height );

                    return deferred.promise();
                }
            }
    });
} );