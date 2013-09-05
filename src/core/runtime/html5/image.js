/**
 * Terms:
 *
 * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
 * @fileOverview Image控件
 */
define( 'webuploader/core/runtime/html5/image', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime',
        'webuploader/core/runtime/html5/util'
        ], function( Base, Html5Runtime, util ) {

    var $ = Base.$,
        rdataurl = /^data:/i;

    function Html5Image( crossOrigin ) {
        var me = this,
            img = new Image();

        img.onload = function() {
            var ImageMeta = me.ImageMeta,
                len = ImageMeta.maxMetaDataSize;

            me.width = img.width;
            me.height = img.height;

            me.state = 'loaded';

            // 读取meta信息。
            if ( me.type === 'image/jpeg' && ImageMeta ) {
                me._fileRead( me._blob.slice( 0, len ) , function( ret ) {
                    me.metas = ImageMeta.parse( ret );
                    me.trigger( 'load' );
                }, 'readAsArrayBuffer' );
            } else {
                me.trigger( 'load' );
            }
        };

        me.ImageMeta = me.runtime.getComponent( 'ImageMeta' );
        me._img = img;
    }

    $.extend( Html5Image.prototype, {

        // flag: 标记是否被修改过。
        modified: false,

        crossOrigin: 'Anonymous',

        state: 'pedding',

        type: 'image/png',

        quality: 90,

        width: 0,
        height: 0,

        /**
         * @method load
         */
        load: function( source ) {
            var me = this,
                img, blob;

            // 如果已经是blob了，则直接loadAsBlob
            if ( source instanceof Blob ) {
                me._loadAsBlob( source );
            } else if( rdataurl.test( source ) ) {
                blob = util.dataURL2Blob( source );
                me._loadAsBlob( blob );
            } else {
                // 如果是uri, 远程图片地址，或者ObjectUrl
                // 注意此方法load进来的图片是不带head meta信息的。
                // 如果需要head meta信息，需要改用xhr去读取二进制数据。
                img = new Image();
                img.crossOrigin = me.crossOrigin;
                img.onload = function() {
                    var canvas = document.createElement( 'canvas' );
                    canvas.width = img.width;
                    canvas.height = img.height;
                    me._renderImageToCanvas( canvas, img, 0, 0 );
                    blob = util.dataURL2Blob( canvas.toDataURL( 'image/png' ) );
                    me._loadAsBlob( blob );
                };
                img.src = source;
            }
            return me;
        },

        downsize: function( width, height, crop ) {
            var canvas = this._canvas ||
                    (this._canvas = document.createElement( 'canvas' ));

            this._resize( canvas, width, height, crop, true );
            this.width = width;
            this.height = height;

            this._blob = null;    // 没用了，可以删掉了。
            this.modified = true;
        },

        /**
         * 创建缩略图，但是不会修改原始图片大小。
         */
        makeThumbnail: function( width, height, crop, type, quality ) {
            var canvas = document.createElement( 'canvas' ),
                result;

            type = type || this.type;
            quality = quality || this.quality;
            this._resize( canvas, width, height, crop );

            if ( type === 'image/jpeg' ) {
                result = canvas.toDataURL( 'image/jpeg', quality / 100 );
            } else {
                result = canvas.toDataURL( type );
            }

            canvas.getContext( '2d' )
                    .clearRect( 0, 0, canvas.width, canvas.height );
            canvas.width = canvas.height = 0;
            canvas = null;

            return result;
        },

        toBlob: function( type, quality ) {
            var blob = this._blob,
                canvas;

            type = type || this.type;
            quality = quality || this.quality;

            // blob需要重新生成。
            if ( this.modified || this.type !== type ) {
                canvas = this._canvas;

                if ( type === 'image/jpeg' ) {
                    blob = canvas.toDataURL( 'image/jpeg', quality / 100 );

                    if ( this.metas && this.metas.imageHead ) {
                        blob = util.dataURL2ArrayBuffer( blob );
                        blob = this.ImageMeta.updateImageHead( blob,
                                this.metas.imageHead );
                        return util.arrayBufferToBlob( blob, type );
                    }

                } else {
                    blob = canvas.toDataURL( type );
                }

                blob = util.dataURL2Blob( blob );
            }

            return blob;
        },

        destroy: function() {
            var canvas = this._canvas;
            this._img.onload = null;

            if ( canvas ) {
                canvas.getContext( '2d' )
                        .clearRect( 0, 0, canvas.width, canvas.height );
                canvas.width = canvas.height = 0;
                this._canvas = null;
            }

            this._blob = null;
        },

        _loadAsBlob: function( blob ) {
            var me = this,
                img = this._img;

            me._blob = blob;
            me.type = blob.type;
            img.src = util.createObjectURL( blob );
            me.once( 'load', function() {
                util.revokeObjectURL( img.src );
            } );
        },

        _resize: function( canvas, width, height, crop, preserveHeaders ) {
            // 调用时机不对。
            if ( this.state !== 'loaded' ) {
                return;
            }

            var img = this._img,
                naturalWidth = img.width,
                naturalHeight = img.height,
                orientation = this.metas && this.metas.exif &&
                    this.metas.exif.get( 'Orientation' ) || 1,
                scale, w, h, x, y;

             // values that require 90 degree rotation
            if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {

                // 交换width, height的值。
                width ^= height;
                height ^= width;
                width ^= height;
            }

            scale = Math[ crop ? 'max' : 'min' ]( width / naturalWidth,
                    height / naturalHeight );

            // 不允许放大。
            scale = Math.min( 1, scale );

            w = naturalWidth * scale;
            h = naturalHeight * scale;

            if ( crop ) {
                canvas.width = width;
                canvas.height = height;
            } else {
                canvas.width = w;
                canvas.height = h;
            }

            x = w > canvas.width ? (w - canvas.width) / 2  : 0;
            y = h > canvas.height ? (h - canvas.height) / 2 : 0;

            preserveHeaders || this._rotateToOrientaion( canvas, orientation );

            this._renderImageToCanvas( canvas, img, -x, -y, w, h );
        },

        _rotateToOrientaion: function( canvas, orientation ) {
            var width = canvas.width,
                height = canvas.height,
                ctx = canvas.getContext( '2d' );

            switch ( orientation ) {
                case 5:
                case 6:
                case 7:
                case 8:
                    canvas.width = height;
                    canvas.height = width;
                    break;
            }

            switch ( orientation ) {
                case 2:    // horizontal flip
                    ctx.translate( width, 0 );
                    ctx.scale( -1, 1 );
                    break;

                case 3:    // 180 rotate left
                    ctx.translate( width, height );
                    ctx.rotate( Math.PI );
                    break;

                case 4:    // vertical flip
                    ctx.translate( 0, height );
                    ctx.scale( 1, -1 );
                    break;

                case 5:    // vertical flip + 90 rotate right
                    ctx.rotate( 0.5 * Math.PI );
                    ctx.scale( 1, -1 );
                    break;

                case 6:    // 90 rotate right
                    ctx.rotate( 0.5 * Math.PI );
                    ctx.translate( 0, -height );
                    break;

                case 7:    // horizontal flip + 90 rotate right
                    ctx.rotate( 0.5 * Math.PI );
                    ctx.translate( width, -height );
                    ctx.scale( -1, 1 );
                    break;

                case 8:    // 90 rotate left
                    ctx.rotate( -0.5 * Math.PI );
                    ctx.translate( -width, 0 );
                    break;
            }
        },

        _fileRead: function( file, cb, method ) {
            var me = this,
                reader;

            if ( window.FileReader ) {
                method = method || 'readAsDataURL';
                reader = new FileReader();
                reader.onload = function() {
                    cb( this.result );
                };

                reader.onerror = function( e ) {
                    me.trigger( 'error', e.message );
                };

                reader[ method ]( file );
            }

            return me;
        },

        // @todo 在ios6中，处理像素点过万的图片有问题，待解决
        // 解决方法：https://github.com/stomita/ios-imagefile-megapixel
        _renderImageToCanvas: function( canvas, img, x, y, w, h ) {
            canvas.getContext( '2d' ).drawImage( img, x, y, w, h );
            return canvas;
        }
    } );

    Html5Image.makeThumbnail = function( source, cb, width, height, crop ) {
        var image = new Html5Image();

        image.once( 'load', function() {
            cb( image.makeThumbnail( width, height, crop ) );
            image.destroy();
        } );
        image.load( source );
    };

    Html5Image.downsize = function( source, cb, width, height, crop ) {
        var image = new Html5Image();

        image.once( 'load', function() {
            image.downsize( width, height, crop );
            cb( image.toBlob() );
            image.destroy();
        } );
        image.load( source );
    };

    Html5Runtime.register( 'Image', Html5Image );

    Html5Runtime.addDetect(function(){
        return {
            resizeImage: true
        }
    });
    return Html5Image;
} );