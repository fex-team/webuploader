/**
 * @fileOverview Image
 */
define([
    '../base',
    '../runtime/client',
    './blob'
], function( Base, RuntimeClient, Blob ) {
    var $ = Base.$;

    // 构造器。
    function Image( opts ) {
        this.options = $.extend({}, Image.options, opts );
        RuntimeClient.call( this, 'Image' );

        this.on( 'load', function() {
            this._info = this.exec('info');
            this._meta = this.exec('meta');
        });
    }

    // 默认选项。
    Image.options = {

        // 默认的图片处理质量
        quality: 90,

        // 是否裁剪
        crop: false,

        // 是否保留头部信息
        preserveHeaders: false,

        // 是否允许放大。
        allowMagnify: false
    };

    // 继承RuntimeClient.
    Base.inherits( RuntimeClient, {
        constructor: Image,

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

        loadFromBlob: function( blob ) {
            var me = this,
                ruid = blob.getRuid();

            this.connectRuntime( ruid, function() {
                me.exec( 'init', me.options );
                me.exec( 'loadFromBlob', blob );
            });
        },

        resize: function() {
            var args = Base.slice( arguments );
            return this.exec.apply( this, [ 'resize' ].concat( args ) );
        },

        crop: function() {
            var args = Base.slice( arguments );
            return this.exec.apply( this, [ 'crop' ].concat( args ) );
        },

        getAsDataUrl: function( type ) {
            return this.exec( 'getAsDataUrl', type );
        },

        getAsBlob: function( type ) {
            var blob = this.exec( 'getAsBlob', type );

            return new Blob( this.getRuid(), blob );
        }
    });

    return Image;
});