/**
 * @fileOverview Image帮助类，主要用来生成缩略图和压缩图片。
 * @import base.js, runtime/client.js
 */
define( 'webuploader/lib/image', [ 'webuploader/base',
        'webuploader/runtime/client' ],
        function( Base, RuntimeClient ) {
    var $ = Base.$;

    function Image( opts ) {
        var me = this;

        me.options = $.extend( {}, Image.options, opts );
        RuntimeClient.call( me, 'Image' );

        me.once( 'load', function() {
            me.info = me.exec( 'getInfo' );
        });
    }

    Image.options = {
        quality: 90,
        crop: false,
        allowMagnify: false,
        crossOrigin: 'Anonymous',
        preserveHeader: true,
        metaHead: true
    };

    Base.inherits( RuntimeClient, {
        constructor: Image,

        load: function( src ) {
            var me = this,
                opts = src.getRuid ? src.getRuid() : $.extend( {}, me.options );

            me.connectRuntime( opts, function() {
                me.exec( 'load', src );
            });
        },

        downsize: function( width, height ) {
            return this.exec( 'downsize', width, height );
        },

        makeThumbnail: function( width, height ) {
            return this.exec( 'makeThumbnail', width, height );
        },

        getOrientation: function() {
            return this.exec( 'getOrientation');
        },

        getAsBlob: function( type, quality ) {
            type = type || this.info.type;
            quality = quality || 90;
            return this.exec( 'getAsBlob', type, quality );
        },

        getMetas: function() {
            return this.exec( 'getMetas' );
        },

        setMetas: function( val ) {
            var me = this;
            this.runtimeReady(function() {
                me.exec( 'setMetas', val );
            });
            return true;
        },

        destroy: function() {
            this.trigger( 'destroy' );
            this.off();
            this.exec( 'destroy' );
        }
    } );

    return Image;
} );