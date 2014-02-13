/**
 * @file 暴露变量给外部使用。
 * 此文件也只有在把webupload合并成一个文件使用的时候才会引入。
 *
 * 将所有modules，将路径ids装换成对象。
 */

    var key, host, parts, part, last, origin,
        WebUploader = modules.base;
        // 让首写字母大写。
    var ucFirst = function( str ) {
            return str && (str.charAt( 0 ).toUpperCase() + str.substr( 1 ));
        };

    for ( key in modules ) {
        host = WebUploader;

        if ( !modules.hasOwnProperty( key ) ) {
            continue;
        }

        parts = key.split('/');
        last = ucFirst( parts.pop() );

        while( (part = ucFirst( parts.shift() )) ) {
            host[ part ] = host[ part ] || {};
            host = host[ part ];
        }

        host[ last ] = modules[ key ];
    }

    return WebUploader;
})( window );

var exportName = 'WebUploader';  // 暴露出去的key

if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = WebUploader;
} else if ( typeof define === 'function' && define.amd ) {
    define(exportName, function() { return WebUploader; } );
}

origin = window[ exportName ];
window[ exportName ] = WebUploader;
window[ exportName ].noConflict = function() {
    window[ exportName ] = origin;
};
