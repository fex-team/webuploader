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

    // 带有节流性质的创建器, 根据文件大小来节流
    getInstance = (function( throttle ){
        var runing = 0,
            wating = [],
            getInstance = function( size, opts ) {
                var image = new Image( opts );

                image.on( 'destroy', function() {
                    runing -= size;
                    Base.nextTick( tick );
                });

                return image;
            },
            tick = function() {
                var item;
                while ( runing < throttle && wating.length ) {
                    item = wating.shift();
                    runing += item[ 1 ];
                    item[ 0 ]( getInstance( item[ 1 ], item[ 2 ] ) );
                }
            };

        return function( source, cb, opts ) {
            wating.push( [cb, source.size || source.length, opts] );
            Base.nextTick( tick );
        };
    })( 5 * 1024 * 1024 );

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

                getInstance( file.source, function( image ) {
                    image.once( 'load', function() {
                        file.metas = image.getMetas();
                        file.orientation = image.getOrientation();
                        cb( false, image.makeThumbnail( width, height ) );
                        image.destroy();
                    });
                    image.once( 'error', function( reason ) {
                        cb( reason );
                        image.destroy();
                    })
                    image.load( file.source );
                }, {
                    allowMagnify: true,
                    crop: true,
                    preserveHeader:false
                });
            },

            resizeImage: function( file ) {
                var resize = this.options.resize,
                    deferred;

                if ( resize && (file.type === 'image/jpg' ||
                        file.type === 'image/jpeg') && !file.resized ) {

                    deferred = Base.Deferred();

                    getInstance( file.source, function( image ) {
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
                            // @todo
                            image.destroy();
                        });

                        file.metas && image.setMetas( file.metas );
                        image.load( file.source );
                    }, {
                        preserveHeader: true
                    });

                    return deferred.promise();
                }
            }
    });
} );