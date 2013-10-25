/**
 * @fileOverview Blob Html实现
 * @import base.js, runtime/html5/runtime.js
 */
define('runtime/html5/blob', ['webuploader/runtime/html5/runtime',
    'webuploader/lib/blob' ], function( Html5Runtime, Blob ) {
    return Html5Runtime.register( 'Blob', {
        getSize: function( source ) {
            return source.size;
        },

        getType: function( source ) {
            return source.type;
        },

        slice: function( start, end ) {
            var owner = this.owner,
                blob = owner.source,
                slice = blob.slice || blob.webkitSlice || blob.mozSlice;

            blob = slice.call( blob, start, end );

            return new Blob( owner.getRuid(), blob );
        }
    });
});