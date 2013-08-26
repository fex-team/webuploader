define( 'WebUploader/core/runtime/html5/Runtime', [
        'WebUploader/Base',
        'WebUploader/core/Runtime' ], function( Base, Runtime ) {

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