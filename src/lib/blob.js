/**
 * @fileOverview Blob
 * @import base.js, runtime/client.js
 */
define( 'webuploader/lib/blob', [ 'webuploader/base',
        'webuploader/runtime/client' ], function( Base, RuntimeClient ) {
    var $ = Base.$;

    function Blob( ruid, source ) {
        var me = this;

        me.source = source;
        me.ruid = ruid;

        RuntimeClient.call( me, 'Blob' );

        if ( ruid ) {
            me.connectRuntime( ruid, function() {
                me.size = me.exec( 'getSize', source );
                me.type = me.exec( 'getType', source );
            } );
        }
    }

    $.extend( Blob.prototype, {

        slice: function( start, end ) {
            return this.exec( 'slice', start, end );
        },

        getSource: function() {
            return this.source;
        }

    } );

    return Blob;
} );