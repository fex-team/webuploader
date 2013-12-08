/**
 * @fileOverview 可能不需要此功能。
 */
define([
    '/base',
    'client'
], function( Base, RuntimeClient ) {

    function RuntimeTarget() {
        RuntimeClient.apply( this, arguments );
    }

    Base.inherits( RuntimeClient, {
        constructor: RuntimeTarget,

        destroy: function() {
            this.disconnectRuntime();
            this.off();
        }
    });

    return RuntimeTarget;
});