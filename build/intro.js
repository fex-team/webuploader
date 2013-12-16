/**
 * @fileOverview 让内部各个部件的代码可以用[amd](https://github.com/amdjs/amdjs-api/wiki/AMD)模块定义方式组织起来。
 *
 * AMD API 内部的简单不完全实现，请忽略。只有当WebUploader被合并成一个文件的时候才会引入。
 */
var internalAmd = (function( global, undefined ) {
        var modules = {},

            // 简单不完全实现https://github.com/amdjs/amdjs-api/wiki/require
            require = function( deps, callback ) {
                var args, len, i;

                // 如果deps不是数组，则直接返回指定module
                if ( typeof deps === 'string' ) {
                    return getModule( deps );
                } else {
                    args = [];
                    for( len = deps.length, i = 0; i < len; i++ ) {
                        args.push( getModule( deps[ i ] ) );
                    }

                    return callback.apply( null, args );
                }
            },

            // 内部的define，暂时不支持不指定id.
            define = function( id, deps, factory ) {
                if ( arguments.length === 2 ) {
                    factory = deps;
                    deps = null;
                }

                if ( typeof id !== 'string' || !factory ) {
                    throw new Error('Define Error');
                }

                require( deps || [], function() {
                    setModule( id, factory, arguments );
                });
            },

            // 设置module, 兼容CommonJs写法。
            setModule = function( id, factory, args ) {
                var module = {
                        exports: factory
                    },
                    returned;

                if ( typeof factory === 'function' ) {
                    args.length || (args = [ require, module.exports, module ]);
                    returned = factory.apply( null, args );
                    returned !== undefined && (module.exports = returned);
                }

                modules[ id ] = module.exports;
            },

            // 根据id获取module
            getModule = function( id ) {
                var module = modules[ id ] || global[ id ];

                if ( !module ) {
                    throw new Error( '`' + id + '` is undefined' );
                }

                return module;
            };

        return {
            define: define,
            require: require,

            // 暴露所有的模块。
            modules: modules
        };
    })( window ),

    /* jshint unused: false */
    require = internalAmd.require,
    define = internalAmd.define;