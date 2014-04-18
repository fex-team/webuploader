/**
 * @fileOverview Fix android canvas.toDataUrl bug.
 */
define([
    './util',
    './jpegencoder',
    '../../base'
], function( Util, encoder, Base ) {
    var origin = Util.canvasToDataUrl,
        supportJpeg;

    Util.canvasToDataUrl = function( canvas, type, quality ) {
        var ctx, w, h, fragement, parts;

        // 非android手机直接跳过。
        if ( !Base.os.android ) {
            return origin.apply( null, arguments );
        }

        // 检测是否canvas支持jpeg导出，根据数据格式来判断。
        // JPEG 前两位分别是：255, 216
        if ( type === 'image/jpeg' && typeof supportJpeg === 'undefined' ) {
            fragement = origin.apply( null, arguments );

            parts = fragement.split(',');

            if ( ~parts[ 0 ].indexOf('base64') ) {
                fragement = atob( parts[ 1 ] );
            } else {
                fragement = decodeURIComponent( parts[ 1 ] );
            }

            fragement = fragement.substring( 0, 2 );

            supportJpeg = fragement.charCodeAt( 0 ) === 255 &&
                    fragement.charCodeAt( 1 ) === 216;
        }

        // 只有在android环境下才修复
        if ( type === 'image/jpeg' && !supportJpeg ) {
            w = canvas.width;
            h = canvas.height;
            ctx = canvas.getContext('2d');

            return encoder.encode( ctx.getImageData( 0, 0, w, h ), quality );
        }

        return origin.apply( null, arguments );
    };
});