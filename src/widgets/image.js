/**
 * @fileOverview 图片操作
 * @import base.js, widgets/widget.js, core/uploader.js, lib/image.js
 */
define( 'webuploader/widgets/image', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/lib/image' ], function(
        Base, Uploader, Image ) {

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
                var image;

                file = this.request( 'get-file', file );

                // 只预览图片格式。
                if ( !file.type.match( /^image/ ) ) {
                    cb( true );
                    return;
                }

                image = new Image({
                    allowMagnify: true,
                    crop: true,
                    preserveHeader:false
                });

                image.once( 'load', function() {
                    file.metas = image.getMetas();
                    file.orientation = image.getOrientation();
                    cb( false, image.makeThumbnail( width, height ) );
                    image.destroy();
                });

                image.once( 'error', function( reason ) {
                    cb( reason );
                    image.destroy();
                    deferred.reject( reason );
                });

                image.load( file.source );
            },

            resizeImage: function( file ) {
                var resize = this.options.resize,
                    deferred, image;

                if ( resize && (file.type === 'image/jpg' ||
                        file.type === 'image/jpeg') && !file.resized ) {

                    deferred = Base.Deferred();

                    image = new Image({
                        preserveHeader: true
                    });

                    image.once( 'load', function() {
                        var blob, size;

                        image.downsize( resize.width, resize.height, resize.quality );
                        blob = image.getAsBlob();
                        image.destroy();
                        image = null;

                        size = file.size;
                        file.source = blob;
                        file.size = blob.size;
                        file.resized = true;
                        file.trigger( 'resize', blob.size, size );
                        deferred.resolve( true );

                    });

                    image.once( 'error', function( reason ) {
                        image.destroy();
                        deferred.reject( reason );
                    });

                    file.metas && image.setMetas( file.metas );
                    image.load( file.source );

                    return deferred.promise();
                }
            }
    });
} );