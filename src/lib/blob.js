/**
 * @fileOverview Blob
 * @import base.js, runtime/client.js
 */
define( 'webuploader/lib/blob', [ 'webuploader/base',
        'webuploader/runtime/client' ], function( Base, RuntimeClient ) {
    var $ = Base.$;

    function Blob( ruid, source ) {
        this.source = source;
        this.ruid = ruid;

        RuntimeClient.call( this );

        if ( ruid ) {
            this.connectRuntime( ruid );
        }
    }

    $.extend( Blob.prototype, {

        slice: function() {

        },

        getSource: function() {

        }

    } );

    return Blob;
} );