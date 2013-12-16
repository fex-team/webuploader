/**
 * @fileOverview Image
 */
define([
    './runtime',
    './util',
    './imagemeta'
], function( Html5Runtime, Util, ImageMeta ) {

    var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D',
        throttle;

    // 根据要处理的文件大小来节流，一次不能处理太多，会卡。
    throttle = (function( max ) {
        var occupied = 0,
            waiting = [],
            tick = function() {
                var item;

                while ( waiting.length && occupied < max ) {
                    item = waiting.shift();
                    occupied += item[ 0 ];
                    item[ 1 ]();
                }
            };

        return function( emiter, size, cb ) {
            waiting.push([ size, cb ]);
            emiter.once( 'destroy', function() {
                occupied -= size;
                setTimeout( tick, 1 );
            });
            setTimeout( tick, 1 );
        };
    })( 5 * 1024 * 1024 );

    return Html5Runtime.register( 'ImagePreview', {

        // flag: 标记是否被修改过。
        modified: false,

        init: function() {
            var me = this,
                img = new Image();

            img.onload = function() {
                // 读取meta信息。
                if ( me.type === 'image/jpeg' ) {
                    ImageMeta.parse( me._blob, function( error, ret ) {
                        me.metas = ret;
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

        preview: function( blob, width, height ) {
            var me = this,
                img = me._img;

            throttle( me.owner, blob.size, function() {
                me._blob = blob;
                me.type = blob.type;
                img.src = Util.createObjectURL( blob.getSource() );
                me.owner.once( 'load', function() {
                    Util.revokeObjectURL( img.src );
                    me.resize( width, height );
                    me.owner.trigger('complete');
                });
            });
        },

        /**
         * 创建缩略图，但是不会修改原始图片大小。
         */
        resize: function( width, height ) {
            var canvas = this.canvas = document.createElement('canvas');

            // if ( this.metas && this.metas.exif && (result =
            //         this.metas.exif.get( 'Thumbnail' )) ) {
            //     return result;
            // }

            this._resize( this._img, canvas, width, height, true );
        },

        getAsDataURL: function( type ) {
            var canvas = this.canvas,
                opts = this.options,
                result;

            type = type || this.type;

            if ( type === 'image/jpeg' ) {
                result = canvas.toDataURL( 'image/jpeg', opts.quality / 100 );
            } else {
                result = canvas.toDataURL( type );
            }

            canvas.getContext('2d')
                    .clearRect( 0, 0, canvas.width, canvas.height );
            canvas.width = canvas.height = 0;
            canvas = null;
            return result;
        },

        getOrientation: function() {
            return this.metas && this.metas.exif &&
                    this.metas.exif.get('Orientation') || 1;
        },

        getDimension: function() {
            var img = this._img;
            return {
                width: img.width,
                height: img.height
            };
        },

        getMetas: function() {
            return this.metas;
        },

        setMetas: function( val ) {
            this.metas = val;
        },

        destroy: function() {
            this._img.onload = null;

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
            scale = !opts.allowMagnify ? Math.min( 1, scale ) : scale;

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

            this._rotateToOrientaion( cvs, orientation );

            this._renderImageToCanvas( cvs, img, x, y, w, h );
        },

        _rotateToOrientaion: function( canvas, orientation ) {
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
    });
});