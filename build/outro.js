/**
 * @file 暴露变量给外部使用。
 * 此文件也只有在把webupload合并成一个文件使用的时候才会引入。
 *
 * 将所有modules，将路径ids装换成对象。
 */
(function( modules ) {
    var
        // 让首写字母大写。
        ucFirst = function( str ) {
            return str && (str.charAt( 0 ).toUpperCase() + str.substr( 1 ));
        },

        // 暴露出去的key
        exportName = 'WebUploader',
        exports = modules.base,
        key, host, parts, part, last, origin;

    for ( key in modules ) {
        host = exports;

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

    if ( typeof module === 'object' && typeof module.exports === 'object' ) {
        module.exports = exports;
    } else if ( window.define && window.define.amd ) {
        window.define( function() { return exports; } );
    } else {
        origin = window[ exportName ];
        window[ exportName ] = exports;
        window[ exportName ].noConflict = function() {
            window[ exportName ] = origin;
        };
    }
})( internalAmd.modules );
