/**
 * @fileOverview Blob Html实现
 */
define([
    './runtime',
    '../../lib/blob'
], function( Html5Runtime, Blob ) {

    return Html5Runtime.register( 'Blob', {
        slice: function( start, end ) {
            var blob = this.owner.source,
                slice = blob.slice || blob.webkitSlice || blob.mozSlice;

            blob = slice.call( blob, start, end );

            return new Blob( this.getRuid(), blob );
        }
    });
});