/**
 * @fileOverview Image帮助类，主要用来生成缩略图和压缩图片。
 * @import base.js, runtime/client.js
 */
define( 'webuploader/lib/image', [ 'webuploader/base',
        'webuploader/runtime/client',
        'webuploader/core/mediator' ],
        function( Base, RuntimeClient, Mediator ) {
    var $ = Base.$;

    function Image( opts ) {
        this.options = $.extend( {}, Image.options, opts );
        RuntimeClient.call( this, 'Image' )
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
            return this.exec( 'toBlob', type, quality );
        },

        getMetas: function() {
            return this.exec( 'getMetas' );
        },

        setMetas: function( val ) {
            var me = this;
            this.runtimeReady( function() {
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

    Mediator.installTo( Image.prototype );

    return Image;
} );