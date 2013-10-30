/**
 * @fileOverview
 * @import base.js, runtime/client.js
 */
define( 'webuploader/runtime/target', [ 'webuploader/base',
        'webuploader/runtime/client' ], function( Base, RuntimeClient ) {
    var $ = Base.$;

    function RuntimeTarget() {
        RuntimeClient.apply( this, arguments );
    }

    Base.inherits( RuntimeClient, {
        constructor: RuntimeTarget,

        destroy: function() {
            this.disconnectRuntime();
            this.off();
        }
    } );

    return RuntimeTarget;
} );