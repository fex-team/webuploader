/**
 * @fileOverview 让内部各个部件的代码可以用amdefine组织起来。
 */
var amd = (function( global ) {
        var modules = {};

        function require( deps, callback ) {
            var args = [],
                len = deps.length,
                i = -1,
                dep, module;

            while ( ++i < len ) {
                dep = deps[ i ];
                module = modules[ dep ] || global[ dep ];

                if ( !module ) {
                    throw new Error( '`' + dep + '` is undefined' );
                }

                args.push( module );
            }

            callback.apply( null, args );
        }

        function define( id, deps, definition ) {
            if ( arguments.length === 2 ) {
                definition = deps;
                deps = null;
            }

            if ( typeof id !== 'string' || !definition ) {
                throw new Error('Define Error');
            }

            require( deps || [], function() {
                modules[ id ] = typeof definition === 'function' ?
                        definition.apply( null, arguments ) : definition;
            });
        }

        return {
            require: require,
            define: define
        };
    })( window ),

    /* jshint unused: false */
    require = amd.require,
    define = amd.define;