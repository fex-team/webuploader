/**
 * @fileOverview Html5Runtime
 */
define( 'webuploader/core/runtime/html5/runtime', [
        'webuploader/base',
        'webuploader/core/runtime/runtime'
    ], function( Base, Runtime ) {

        var type = 'html5',
            components = {};

        function Html5Runtime() {
            Runtime.apply( this, arguments );
        }

        Base.inherits( Runtime, {
            constructor: Html5Runtime,

            // ---------- 原型方法 ------------

            // 不需要连接其他程序，直接执行callback
            connect: function( cb ) {
                setTimeout( cb, 1 );
            },

            exec: function( component, fn/*, args...*/ ) {
                var args = Base.slice( arguments, 2 );

                component = components[ component ] || {};
                fn = component[ fn ];

                if ( !fn ) {
                    throw new Error( 'Exec Error' );
                }

                return fn.apply( component, args );
            }

        } );

        Html5Runtime.register = function( name, component ) {
            components[ name ] = component;
        };

        // 注册html5运行时。
        if ( window.Blob && window.FileReader && window.DataView ) {
            Runtime.addRuntime( type, Html5Runtime );
        }

        return Html5Runtime;
    } );