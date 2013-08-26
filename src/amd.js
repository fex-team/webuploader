/**
 * @fileOverview 实现amd js功能，大部分的代码都是通过amd规范组织起来的，
 * 此文件主要当代码不在AMD环境下时使用。也就是说如果你的应用已经是用了RequireJS的话
 * 此文件完全没有必要打包进来。
 */
var amd = (function( exports, undefined ) {
        var modules = {};

        function require( deps, callback ) {
            var args = [],
                len = deps.length,
                i = -1,
                dep,
                module;

            while ( ++i < len ) {
                dep = deps[ i ];
                module = modules[ dep ] || exports[ dep ];

                if ( !module ) {
                    throw new Error( '模块没有定义' + dep );
                }

                args.push( module );
            }

            callback.apply( null, args );
        }

        function define( id, deps, definition ) {
            if ( typeof id !== 'string' ) {
                throw new Error( '模块定义必须以字符串形式指定' );
            }

            if ( deps === undefined ) {
                throw new Error( '依赖格式不正确' );
            }

            if ( definition === undefined ) {
                throw new Error( '模块定义工厂方法格式不正确' );
            }

            require( deps, function() {
                modules[ id ] = definition.apply( null, arguments );
            } );
        }

        return {
            require: require,
            define: define
        }
    })( window ),

    require = amd.require,
    define = amd.define;