/**
 * @fileOverview 错误信息
 * @import base.js, core/mediator.js, runtime/client.js
 */
define( 'webuploader/lib/filepaste', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/runtime/client'
        ], function( Base, Mediator, RuntimeClent ) {

    var $ = Base.$;

    function FilePaste( opts ) {
        opts = this.options = $.extend( {}, FilePaste.options, opts );

        opts.container = $( opts.container );
        if ( !opts.container.length ) {
            throw new Error( '容器没有找到' );
        }

        RuntimeClent.call( this, 'FilePaste' );
    }

    FilePaste.options = {
        accept: [{
            title: 'image',
            extensions: 'gif,jpg,bmp,png'
        }]
    }

    Base.inherits( RuntimeClent, {
        constructor: FilePaste,

        init: function() {
            var me = this;

            me.connectRuntime( me.options, function() {
                me.exec( 'init' );
            });
        },

        destroy: function() {
            this.exec( 'destroy' );
            this.disconnectRuntime();
            this.off();
        }
    } );

    Mediator.installTo( FilePaste.prototype );

    return FilePaste;
});