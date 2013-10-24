/**
 * @fileOverview 错误信息
 * @import base.js, core/mediator.js, runtime/client.js
 */
define( 'webuploader/core/filepaste', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/runtime/client'
        ], function( Base, Mediator, RuntimeClent ) {

    var $ = Base.$,
        defaultOpts = {
            accept: [{
                title: 'image',
                extensions: 'gif,jpg,bmp,png'
            }]
        };

    function FilePaste( opts ) {
        var container;

        opts = opts || {};

        opts.container = $( opts.container );

        if ( !opts.container.length ) {
            throw new Error( '容器没有找到' );
        }

        opts = this.options = $.extend( {}, defaultOpts, opts );
        RuntimeClent.call( this, opts );
    }

    Base.inherits( RuntimeClent, {
        constructor: FilePaste,

        init: function() {
            var me = this,
                args = Base.slice( arguments );

            me.on( 'runtimeInit', function( runtime ){
                this.runtime = runtime;
                this.ruid = runtime.uid;
                me.exec( 'FilePaste', 'init', args );
            } );

            me.conncetRuntime();
        },

        destroy: function() {
            if ( this.runtime ) {
                this.exec( 'FilePaste', 'destroy' );
                this.disconncetRuntime();
            }
        }
    } );

    Mediator.installTo( FilePaste.prototype );

    return FilePaste();
});