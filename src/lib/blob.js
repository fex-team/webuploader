/**
 * @fileOverview Blob
 */
define([
    '../base',
    '../runtime/client'
], function( Base, RuntimeClient ) {

    function Blob( ruid, source ) {
        var me = this;

        me.source = source;
        me.ruid = ruid;

        RuntimeClient.call( me, 'Blob' );

        this.uid = source.uid || this.uid;
        this.type = source.type || '';
        this.size = source.size || 0;

        if ( ruid ) {
            me.connectRuntime( ruid );
        }
    }

    Base.inherits( RuntimeClient, {
        constructor: Blob,

        slice: function( start, end ) {
            return this.exec( 'slice', start, end );
        },

        getSource: function() {
            return this.source;
        }
    });

    return Blob;
});