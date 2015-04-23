/**
 * @fileOverview Blob Html实现
 */
define([
    './runtime',
    '../../lib/blob'
], function( FlashRuntime, Blob ) {

    return FlashRuntime.register( 'Blob', {
        slice: function( start, end ) {
            var blob = this.flashExec( 'Blob', 'slice', start, end );

            return new Blob( this.getRuid(), blob );
        }
    });
});