/**
 * @file 暴露变量给外部使用。
 */
if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = WU;
} else {
    window[ exportName ] = WU;

    if ( typeof define === 'function' && define.amd ) {
        define( 'jquery', [], function () { return WU; } );
    }
}