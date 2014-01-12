/**
 * @fileOverview Image
 */
define([
    './runtime',
    './util',
    './imagemeta'
], function( Html5Runtime, Util, ImageMeta ) {

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
                if ( !me._metas && ~'image/jpegimage/jpg'.indexOf( me.type ) ) {
                    ImageMeta.parse( me._blob, function( error, ret ) {
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
            this.owner.trigger('complete');
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
                    blob = canvas.toDataURL( 'image/jpeg', opts.quality / 100 );

                    if ( opts.preserveHeaders && this._metas &&
                            this._metas.imageHead ) {

                        blob = Util.dataURL2ArrayBuffer( blob );
                        blob = ImageMeta.updateImageHead( blob,
                                this._metas.imageHead );
                        blob = Util.arrayBufferToBlob( blob, type );
                        return blob;
                    }
                } else {
                    blob = canvas.toDataURL( type );
                }

                blob = Util.dataURL2Blob( blob );
            }

            return blob;
        },

        getAsDataUrl: function( type ) {
            var opts = this.options;

            type = type || this.type;

            if ( type === 'image/jpeg' ) {
                return this._canvas.toDataURL( type, opts.quality / 100 );
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

        _renderImageToCanvas: function( canvas, img, x, y, w, h ) {
            canvas.getContext('2d').drawImage( img, x, y, w, h );
        }

        /*_renderImageToCanvas: (function() {
            var subsampled, vertSquashRatio;

            // Detect subsampling in loaded image.
            // In iOS, larger images than 2M pixels may be subsampled in rendering.
            function detectSubsampling(img) {
                var iw = img.naturalWidth,
                    ih = img.naturalHeight;
                if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
                    var canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, -iw + 1, 0);
                    // subsampled image becomes half smaller in rendering size.
                    // check alpha channel value to confirm image is covering edge pixel or not.
                    // if alpha value is 0 image is not covering, hence subsampled.
                    return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
                } else {
                    return false;
                }
            }


            // Detecting vertical squash in loaded image.
            // Fixes a bug which squash image vertically while drawing into canvas for some images.
            function detectVerticalSquash(img, iw, ih) {
                var canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = ih;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var data = ctx.getImageData(0, 0, 1, ih).data;
                // search image edge pixel position in case it is squashed vertically.
                var sy = 0;
                var ey = ih;
                var py = ih;
                while (py > sy) {
                    var alpha = data[(py - 1) * 4 + 3];
                    if (alpha === 0) {
                        ey = py;
                    } else {
                        sy = py;
                    }
                    py = (ey + sy) >> 1;
                }
                var ratio = (py / ih);
                return (ratio === 0) ? 1 : ratio;
            }

            return function( canvas, img, x, y, w, h ) {


                var iw = img.naturalWidth, ih = img.naturalHeight;
                var width = w, height = h;
                var ctx = canvas.getContext('2d');
                ctx.save();

                subsampled = typeof subsampled === 'undefined' ? detectSubsampling( img ) : subsampled;
                if ( subsampled ) {
                    iw /= 2;
                    ih /= 2;
                }

                var d = 1024; // size of tiling canvas
                var tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = tmpCanvas.height = d;
                var tmpCtx = tmpCanvas.getContext('2d');

                vertSquashRatio = vertSquashRatio || detectVerticalSquash(img, iw, ih);
                console.log( vertSquashRatio );

                var dw = Math.ceil(d * width / iw);
                var dh = Math.ceil(d * height / ih / vertSquashRatio);
                var sy = 0;
                var dy = 0;
                while (sy < ih) {
                  var sx = 0;
                  var dx = 0;
                  while (sx < iw) {
                    tmpCtx.clearRect(0, 0, d, d);
                    tmpCtx.drawImage(img, x - sx, y - sy );
                    ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
                    sx += d;
                    dx += dw;
                  }
                  sy += d;
                  dy += dh;
                }
                ctx.restore();
                tmpCanvas = tmpCtx = null;
            };
        })()*/
    });
});