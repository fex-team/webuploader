/**
 * @file 暴露变量给外部使用。
 */
require( [ 'webuploader/base' ], function( Base ) {
    var exportName, origin;

    if ( typeof module === 'object' && typeof module.exports === 'object' ) {
        module.exports = Base;
    } else {
        exportName = 'WebUploader';
        origin = window[ exportName ];
        window[ exportName ] = Base;

        window[ exportName ].noConflict = function() {
            window[ exportName ] = origin;
        };
    }
} );