/**
 * @fileOverview Image
 */
define([
    '../../base',
    './runtime',
    './util'
], function( Base, Html5Runtime, Util ) {

    var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';

    return Html5Runtime.register( 'Image', {

        // flag: 标记是否被修改过。
        modified: false,

        init: function() {
            var me = this,
                img = new Image();

            img.onload = function() {

                me._info = {
                    type: me.type,
                    width: this.width,
                    height: this.height
                };

                // 读取meta信息。
                if ( !me._metas && 'image/jpeg' === me.type ) {
                    Util.parseMeta( me._blob, function( error, ret ) {
                        me._metas = ret;
                        me.owner.trigger('load');
                    });
                } else {
                    me.owner.trigger('load');
                }
            };

            img.onerror = function() {
                me.owner.trigger('error');
            };

            me._img = img;
        },

        loadFromBlob: function( blob ) {
            var me = this,
                img = me._img;

            me._blob = blob;
            me.type = blob.type;
            img.src = Util.createObjectURL( blob.getSource() );
            me.owner.once( 'load', function() {
                Util.revokeObjectURL( img.src );
            });
        },

        resize: function( width, height ) {
            var canvas = this._canvas ||
                    (this._canvas = document.createElement('canvas'));

            this._resize( this._img, canvas, width, height );
            this._blob = null;    // 没用了，可以删掉了。
            this.modified = true;
            this.owner.trigger( 'complete', 'resize' );
        },

        crop: function( x, y, w, h, s ) {
            var cvs = this._canvas ||
                    (this._canvas = document.createElement('canvas')),
                opts = this.options,
                img = this._img,
                iw = img.naturalWidth,
                ih = img.naturalHeight,
                orientation = this.getOrientation();

            s = s || 1;

            // todo 解决 orientation 的问题。
            // values that require 90 degree rotation
            // if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {

            //     switch ( orientation ) {
            //         case 6:
            //             tmp = x;
            //             x = y;
            //             y = iw * s - tmp - w;
            //             console.log(ih * s, tmp, w)
            //             break;
            //     }

            //     (w ^= h, h ^= w, w ^= h);
            // }

            cvs.width = w;
            cvs.height = h;

            opts.preserveHeaders || this._rotate2Orientaion( cvs, orientation );
            this._renderImageToCanvas( cvs, img, -x, -y, iw * s, ih * s );

            this._blob = null;    // 没用了，可以删掉了。
            this.modified = true;
            this.owner.trigger( 'complete', 'crop' );
        },

        getAsBlob: function( type ) {
            var blob = this._blob,
                opts = this.options,
                canvas;

            type = type || this.type;

            // blob需要重新生成。
            if ( this.modified || this.type !== type ) {
                canvas = this._canvas;

                if ( type === 'image/jpeg' ) {

                    blob = Util.canvasToDataUrl( canvas, type, opts.quality );

                    if ( opts.preserveHeaders && this._metas &&
                            this._metas.imageHead ) {

                        blob = Util.dataURL2ArrayBuffer( blob );
                        blob = Util.updateImageHead( blob,
                                this._metas.imageHead );
                        blob = Util.arrayBufferToBlob( blob, type );
                        return blob;
                    }
                } else {
                    blob = Util.canvasToDataUrl( canvas, type );
                }

                blob = Util.dataURL2Blob( blob );
            }

            return blob;
        },

        getAsDataUrl: function( type ) {
            var opts = this.options;

            type = type || this.type;

            if ( type === 'image/jpeg' ) {
                return Util.canvasToDataUrl( this._canvas, type, opts.quality );
            } else {
                return this._canvas.toDataURL( type );
            }
        },

        getOrientation: function() {
            return this._metas && this._metas.exif &&
                    this._metas.exif.get('Orientation') || 1;
        },

        info: function( val ) {

            // setter
            if ( val ) {
                this._info = val;
                return this;
            }

            // getter
            return this._info;
        },

        meta: function( val ) {

            // setter
            if ( val ) {
                this._meta = val;
                return this;
            }

            // getter
            return this._meta;
        },

        destroy: function() {
            var canvas = this._canvas;
            this._img.onload = null;

            if ( canvas ) {
                canvas.getContext('2d')
                        .clearRect( 0, 0, canvas.width, canvas.height );
                canvas.width = canvas.height = 0;
                this._canvas = null;
            }

            // 释放内存。非常重要，否则释放不了image的内存。
            this._img.src = BLANK;
            this._img = this._blob = null;
        },

        _resize: function( img, cvs, width, height ) {
            var opts = this.options,
                naturalWidth = img.width,
                naturalHeight = img.height,
                orientation = this.getOrientation(),
                scale, w, h, x, y;

            // values that require 90 degree rotation
            if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {

                // 交换width, height的值。
                width ^= height;
                height ^= width;
                width ^= height;
            }

            scale = Math[ opts.crop ? 'max' : 'min' ]( width / naturalWidth,
                    height / naturalHeight );

            // 不允许放大。
            opts.allowMagnify || (scale = Math.min( 1, scale ));

            w = naturalWidth * scale;
            h = naturalHeight * scale;

            if ( opts.crop ) {
                cvs.width = width;
                cvs.height = height;
            } else {
                cvs.width = w;
                cvs.height = h;
            }

            x = (cvs.width - w) / 2;
            y = (cvs.height - h) / 2;

            opts.preserveHeaders || this._rotate2Orientaion( cvs, orientation );

            this._renderImageToCanvas( cvs, img, x, y, w, h );
        },

        _rotate2Orientaion: function( canvas, orientation ) {
            var width = canvas.width,
                height = canvas.height,
                ctx = canvas.getContext('2d');

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

        // https://github.com/stomita/ios-imagefile-megapixel/
        // blob/master/src/megapix-image.js
        _renderImageToCanvas: (function() {

            // 如果不是ios, 不需要这么复杂！
            if ( !Base.os.ios ) {
                return function( canvas ) {
                    var args = Base.slice( arguments, 1 ),
                        ctx = canvas.getContext('2d');

                    ctx.drawImage.apply( ctx, args );
                };
            }

            /**
             * Detecting vertical squash in loaded image.
             * Fixes a bug which squash image vertically while drawing into
             * canvas for some images.
             */
            function detectVerticalSquash( img, iw, ih ) {
                var canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d'),
                    sy = 0,
                    ey = ih,
                    py = ih,
                    data, alpha, ratio;


                canvas.width = 1;
                canvas.height = ih;
                ctx.drawImage( img, 0, 0 );
                data = ctx.getImageData( 0, 0, 1, ih ).data;

                // search image edge pixel position in case
                // it is squashed vertically.
                while ( py > sy ) {
                    alpha = data[ (py - 1) * 4 + 3 ];

                    if ( alpha === 0 ) {
                        ey = py;
                    } else {
                        sy = py;
                    }

                    py = (ey + sy) >> 1;
                }

                ratio = (py / ih);
                return (ratio === 0) ? 1 : ratio;
            }

            // fix ie7 bug
            // http://stackoverflow.com/questions/11929099/
            // html5-canvas-drawimage-ratio-bug-ios
            if ( Base.os.ios >= 7 ) {
                return function( canvas, img, x, y, w, h ) {
                    var iw = img.naturalWidth,
                        ih = img.naturalHeight,
                        vertSquashRatio = detectVerticalSquash( img, iw, ih );

                    return canvas.getContext('2d').drawImage( img, 0, 0,
                            iw * vertSquashRatio, ih * vertSquashRatio,
                            x, y, w, h );
                };
            }

            /**
             * Detect subsampling in loaded image.
             * In iOS, larger images than 2M pixels may be
             * subsampled in rendering.
             */
            function detectSubsampling( img ) {
                var iw = img.naturalWidth,
                    ih = img.naturalHeight,
                    canvas, ctx;

                // subsampling may happen overmegapixel image
                if ( iw * ih > 1024 * 1024 ) {
                    canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    ctx = canvas.getContext('2d');
                    ctx.drawImage( img, -iw + 1, 0 );

                    // subsampled image becomes half smaller in rendering size.
                    // check alpha channel value to confirm image is covering
                    // edge pixel or not. if alpha value is 0
                    // image is not covering, hence subsampled.
                    return ctx.getImageData( 0, 0, 1, 1 ).data[ 3 ] === 0;
                } else {
                    return false;
                }
            }


            return function( canvas, img, x, y, width, height ) {
                var iw = img.naturalWidth,
                    ih = img.naturalHeight,
                    ctx = canvas.getContext('2d'),
                    subsampled = detectSubsampling( img ),
                    doSquash = this.type === 'image/jpeg',
                    d = 1024,
                    sy = 0,
                    dy = 0,
                    tmpCanvas, tmpCtx, vertSquashRatio, dw, dh, sx, dx;

                if ( subsampled ) {
                    iw /= 2;
                    ih /= 2;
                }

                ctx.save();
                tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = tmpCanvas.height = d;

                tmpCtx = tmpCanvas.getContext('2d');
                vertSquashRatio = doSquash ?
                        detectVerticalSquash( img, iw, ih ) : 1;

                dw = Math.ceil( d * width / iw );
                dh = Math.ceil( d * height / ih / vertSquashRatio );

                while ( sy < ih ) {
                    sx = 0;
                    dx = 0;
                    while ( sx < iw ) {
                        tmpCtx.clearRect( 0, 0, d, d );
                        tmpCtx.drawImage( img, -sx, -sy );
                        ctx.drawImage( tmpCanvas, 0, 0, d, d,
                                x + dx, y + dy, dw, dh );
                        sx += d;
                        dx += dw;
                    }
                    sy += d;
                    dy += dh;
                }
                ctx.restore();
                tmpCanvas = tmpCtx = null;
            };
        })()
    });
});