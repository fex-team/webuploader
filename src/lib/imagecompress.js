/**
 * @fileOverview Image帮助类，主要用来生成缩略图和压缩图片。
 * @import base.js, runtime/client.js
 */
define( 'webuploader/lib/imagecompress', [ 'webuploader/base',
        'webuploader/runtime/client',
        'webuploader/lib/blob' ],
        function( Base, RuntimeClient, Blob ) {
    var $ = Base.$;

    function ImageCompress( opts ) {
        this.options = $.extend( {}, Image.options, opts );
        RuntimeClient.call( this, 'ImageCompress' );
    }

    ImageCompress.options = {
        quality: 90,
        crop: false,
        preserveHeaders: true
    };

    Base.inherits( RuntimeClient, {
        constructor: ImageCompress,

        compress: function( blob, width, height ) {
            var me = this,
                ruid = blob.getRuid();

            this.connectRuntime( ruid, function() {
                me.exec( 'init', me.options );
                me.exec( 'compress', blob, width, height );
            });
        },

        getAsBlob: function() {
            var blob = this.exec( 'getAsBlob' );
            return new Blob( this.getRuid(), blob );
        },

        setMetas: function() {
            return this.exec( 'setMetas' );
        },

        destroy: function() {
            this.trigger( 'destroy' );
            this.off();
            this.exec( 'destroy' );
        }
    } );

    return ImageCompress;
} );