/**
 * @file 暴露变量给外部使用。
 * 此文件也只有在把webupload合并成一个文件使用的时候才会引入。
 */
(function( modules ) {
    var exportName = 'WebUploader',
        exports = modules.base,
        key, ns, parts, part, last, origin;

    for ( key in modules ) {
        ns = exports;

        if ( !modules.hasOwnProperty( key ) ) {
            continue;
        }

        parts = key.split('/');
        last = parts.pop();

        while( (part = parts.shift()) ) {
            ns[ part ] = ns[ part ] || {};
            ns = ns[ part ];
        }

        ns[ last ] = modules[ key ];
    }

    if ( typeof module === 'object' && typeof module.exports === 'object' ) {
        module.exports = exports;
    } else if ( window.define && window.define.amd ) {
        window.define( exportName, exports );
    } else {
        origin = window[ exportName ];
        window[ exportName ] = exports;
        window[ exportName ].noConflict = function() {
            window[ exportName ] = origin;
        };
    }
})( internalAmd.modules );