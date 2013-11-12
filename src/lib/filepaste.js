/**
 * @fileOverview 错误信息
 * @import base.js, core/mediator.js, runtime/client.js, runtime/runtime.js
 */
define( 'webuploader/lib/filepaste', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/runtime/client',
        'webuploader/runtime/runtime'
        ], function( Base, Mediator, RuntimeClent, Runtime ) {

    var $ = Base.$;

    function FilePaste( opts ) {
        opts = this.options = $.extend( {}, opts );
        opts.container = $( opts.container || document.body );
        RuntimeClent.call( this, 'FilePaste' );
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