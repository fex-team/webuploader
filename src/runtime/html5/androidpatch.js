/**
 * @fileOverview Fix android canvas.toDataUrl bug.
 */
define([
    './util',
    './jpegencoder',
    '../../base'
], function( Util, JPEGEncoder, Base ) {
    var origin = Util.canvasToDataUrl;

    Util.canvasToDataUrl = function( canvas, type, quality ) {
        var ret, ctx, w, h;

        // 只有在android环境下才修复
        if ( Base.os.android && type === 'image/jpeg' ) {
            w = canvas.width;
            h = canvas.height;
            ctx = canvas.getContext('2d');

            return JPEGEncoder.encode( ctx.getImageData( 0, 0, w, h ), quality );
        }

        return origin.apply( null, arguments );
    }
});