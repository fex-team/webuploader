/**
 * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
 */
define([
    'base',
    'uploader',
    'lib/image',
    './widget'
], function( Base, Uploader, Image ) {

    var $ = Base.$,
        throttle;

    // 根据要处理的文件大小来节流，一次不能处理太多，会卡。
    throttle = (function( max ) {
        var occupied = 0,
            waiting = [],
            tick = function() {
                var item;

                while( waiting.length && occupied < max ) {
                    item = waiting.shift();
                    occupied += item[ 0 ];
                    item[ 1 ]();
                }
            };

        return function( emiter, size, cb ) {
            waiting.push( [ size, cb ] );
            emiter.once( 'destroy', function() {
                occupied -= size;
                setTimeout( tick, 1 );
            } );
            setTimeout( tick, 1 );
        }
    })( 5 * 1024 * 1024 );

    $.extend( Uploader.options, {

        // 配置生成缩略图的选项。
        thumb: {
            width: 110,
            height: 110,
            quality: 70,
            allowMagnify: true,
            crop: true,
            preserveHeaders: false,

            // 为空的话则保留原有图片格式。
            // 否则强制转换成指定的类型。
            type: 'image/jpeg'
        },

        // 配置压缩的图片的选项。
        compress: {
            width: 1600,
            height: 1600,
            quality: 90,
            allowMagnify: false,
            crop: false,
            preserveHeaders: true
        }
    });

    return Uploader.register({
        'make-thumb': 'makeThumb',
        'before-send-file': 'compressImage'
    }, {

        makeThumb: function( file, cb, width, height ) {
            var opts, image;

            file = this.request( 'get-file', file );

            // 只预览图片格式。
            if ( !file.type.match( /^image/ ) ) {
                cb( true );
                return;
            }

            opts = $.extend( {}, this.options.thumb );

            // 如果传入的是object.
            if ( $.isPlainObject( width ) ) {
                opts = $.extend( opts, width );
                width = null;
            }

            width = width || opts.width;
            height = height || opts.height;

            image = new Image( opts );

            image.once( 'load', function() {
                file._info = file._info || image.info();
                file._meta = file._meta || image.meta();
                image.resize( width, height );
            });

            image.once( 'complete', function() {
                cb( false, image.getAsDataUrl( opts.type ) );
                image.destroy();
            });

            image.once( 'error', function() {
                cb( true );
                image.destroy();
            });

            throttle( image, file.source.size, function() {
                file._info && image.info( file._info );
                file._meta && image.meta( file._meta );
                image.loadFromBlob( file.source );
            });
        },

        compressImage: function( file ) {
            var opts = this.options.compress || this.options.resize,
                compressSize = opts && opts.compressSize || 300 * 1024,
                image, deferred;

            file = this.request( 'get-file', file );

            // 只预览图片格式。
            if ( !opts || !~'image/jpeg,image/jpg'.indexOf( file.type ) ||
                    file.size < compressSize ||
                    file._compressed ) {
                return;
            }

            opts = $.extend( {}, opts );
            deferred = Base.Deferred();

            image = new Image( opts );

            deferred.always(function() {
                image.destroy();
                image = null;
            });
            image.once( 'error', deferred.reject );
            image.once( 'load', function() {
                file._info = file._info || image.info();
                file._meta = file._meta || image.meta();
                image.resize( opts.width, opts.height );
            });

            image.once( 'complete', function() {
                var blob, size;

                blob = image.getAsBlob( opts.type );
                size = file.size;

                // 如果压缩后，比原来还大则不用压缩后的。
                if ( blob.size < size ) {
                    // file.source.destroy && file.source.destroy();
                    file.source = blob;
                    file.size = blob.size;

                    file.trigger( 'resize', blob.size, size );
                }

                // 标记，避免重复压缩。
                file._compressed = true;
                deferred.resolve( true );
            });

            file._info && image.info( file._info );
            file._meta && image.meta( file._meta );

            image.loadFromBlob( file.source );
            return deferred.promise();
        }
    });
});