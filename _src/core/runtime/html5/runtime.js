/**
 * @fileOverview Html5Runtime
 */
define( 'webuploader/core/runtime/html5/runtime', [
        'webuploader/base',
        'webuploader/core/runtime'
    ], function( Base, Runtime ) {

        var type = 'html5';

        function Html5Runtime( opts ) {
            Runtime.call( this, opts, type );
        }

        Base.inherits( Runtime, {
            constructor: Html5Runtime,

            // ---------- 原型方法 ------------

            // 不需要连接其他程序，直接trigger ready
            init: function() {
                this.trigger( 'ready' );
            }

        } );

        // 注册html5运行时。
        Runtime.addRuntime( type, Html5Runtime );

        return Html5Runtime;
    } );