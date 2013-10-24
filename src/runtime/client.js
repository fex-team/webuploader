/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 * @import base.js, runtime/runtime.js
 */
define( 'webuploader/runtime/client', [ 'webuploader/base',
        'webuploader/runtime/runtime'
        ], function( Base, Runtime ) {

    var cache = {};

    function RuntimeClient( component ) {
        var runtime;

        this.uid = Base.guid( 'client_' );

        this.connectRuntime = function( options, cb ) {

            if ( runtime ) {
                return;
            }

            if ( typeof options === 'string' ) {
                runtime = cache[ options ];
                cb && cb();
            } else {
                runtime = Runtime.create( options );
                cache[ runtime.uid ] = runtime;
                runtime.connect( cb );
                runtime.client = 0;
            }

            runtime.client++;

            return runtime;
        };

        this.disconnectRuntime = function() {
            if ( !runtime ) {
                return;
            }

            runtime.client--;

            if ( runtime.client <= 0 ) {
                delete cache[ ruid ];
                runtime.destroy();
                runtime = null;
            }
        };

        this.exec = function() {
            if ( !runtime ) {
                Base.log( 'Runtime Error' );
                return;
            }

            var args = Base.slice( arguments );
            component && args.unshift( component );

            return runtime.exec.apply( this, args );
        };

        this.getRuid = function() {
            return runtime && runtime.uid;
        };
    }

    return RuntimeClient;
} );