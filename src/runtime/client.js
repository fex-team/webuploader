/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 */
define([
    '/base',
    '/core/mediator',
    'runtime'
], function( Base, Mediator, Runtime ) {

    var cache = (function() {
        var obj = {};

        return {
            add: function( runtime ) {
                obj[ runtime.uid ] = runtime;
            },

            get: function( ruid ) {
                var i;

                if ( ruid ) {
                    return obj[ ruid ];
                }

                for ( i in obj ) {
                    return obj[ i ];
                }

                return null;
            },

            remove: function( runtime ) {
                delete obj[ runtime.uid ];
            },

            has: function() {
                return !!this.get.apply( this, arguments );
            }
        };
    })();

    function RuntimeClient( component, standalone ) {
        var deferred = Base.Deferred(),
            runtime;

        this.uid = Base.guid('client_');

        this.runtimeReady = function( cb ) {
            return deferred.done( cb );
        };

        this.connectRuntime = function( opts, cb ) {
            if ( runtime ) {
                return;
            }

            deferred.done( cb );

            if ( typeof opts === 'string' && cache.get( opts ) ) {
                runtime = cache.get( opts );
            } else if ( !standalone && cache.has() ) {
                runtime = cache.get();
            }

            if ( !runtime ) {
                runtime = Runtime.create( opts, opts.runtimeOrder );
                cache.add( runtime );
                runtime.promise = deferred.promise();
                runtime.once( 'ready', deferred.resolve );
                runtime.init();
                runtime.client = 1;
                return runtime;
            }

            runtime.promise.then( deferred.resolve );
            runtime.client++;
            return runtime;
        };

        this.getRuntime = function() {
            return runtime;
        };

        this.disconnectRuntime = function() {
            if ( !runtime ) {
                return;
            }

            runtime.client--;

            if ( runtime.client <= 0 ) {
                cache.remove( runtime );
                delete runtime.promise;
                runtime.destroy();
                runtime = null;
            }
        };

        this.exec = function() {
            if ( !runtime ) {
                Base.log('Runtime Error');
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

    Mediator.installTo( RuntimeClient.prototype );
    return RuntimeClient;
});