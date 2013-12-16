/**
 * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
 */
define([
    'base',
    'core/uploader',
    'lib/imagecompress',
    'lib/imagepreview',
    './widget'
], function( Base, Uploader, ImageCompress, ImagePreivew ) {

    var $ = Base.$;

    $.extend( Uploader.options, {
        resize: {
            width: 1600,
            height: 1600,
            quality: 90
        }
    });

    return Uploader.register({
        'get-dimension': 'getDimension',
        'make-thumb': 'makeThumb',
        'before-send-file': 'resizeImage'
    }, {

        getDimension: function( file ) {
            return file.info || {};
        },

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

            previewer.once( 'load', function() {
                var dimension = this.getDimension();
                file.info = dimension;
            });

            previewer.once( 'complete', function() {
                // 复用，下次图片操作的时候，直接赋值。
                file.metas = previewer.getMetas();
                file.orientation = previewer.getOrientation();

                cb( false, previewer.getAsDataURL('image/jpeg') );
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

            if ( resize && (file.type === 'image/jpg' ||
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

                    // 如果压缩后，比原来还大则不用压缩后的。
                    if ( blob.size < size ) {
                        file.source = blob;
                        file.size = blob.size;

                        // 同一个文件可能重传，没必要多次压缩。
                        file.trigger( 'resize', blob.size, size );
                    }

                    file.resized = true;
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
});