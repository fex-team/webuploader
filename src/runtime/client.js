/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 */
define([
    '../base',
    '../mediator',
    './runtime'
], function( Base, Mediator, Runtime ) {

    var cache;

    cache = (function() {
        var obj = {};

        return {
            add: function( runtime ) {
                obj[ runtime.uid ] = runtime;
            },

            get: function( ruid, standalone ) {
                var i;

                if ( ruid ) {
                    return obj[ ruid ];
                }

                for ( i in obj ) {
                    // 有些类型不能重用，比如filepicker.
                    if ( standalone && obj[ i ].__standalone ) {
                        continue;
                    }

                    return obj[ i ];
                }

                return null;
            },

            remove: function( runtime ) {
                delete obj[ runtime.uid ];
            }
        };
    })();

    function RuntimeClient( component, standalone ) {
        var deferred = Base.Deferred(),
            runtime;

        this.uid = Base.guid('client_');

        // 允许runtime没有初始化之前，注册一些方法在初始化后执行。
        this.runtimeReady = function( cb ) {
            return deferred.done( cb );
        };

        this.connectRuntime = function( opts, cb ) {

            // already connected.
            if ( runtime ) {
                throw new Error('already connected!');
            }

            deferred.done( cb );

            if ( typeof opts === 'string' && cache.get( opts ) ) {
                runtime = cache.get( opts );
            }

            // 像filePicker只能独立存在，不能公用。
            runtime = runtime || cache.get( null, standalone );

            // 需要创建
            if ( !runtime ) {
                runtime = Runtime.create( opts, opts.runtimeOrder );
                runtime.__promise = deferred.promise();
                runtime.once( 'ready', deferred.resolve );
                runtime.init();
                cache.add( runtime );
                runtime.__client = 1;
            } else {
                // 来自cache
                Base.$.extend( runtime.options, opts );
                runtime.__promise.then( deferred.resolve );
                runtime.__client++;
            }

            standalone && (runtime.__standalone = standalone);
            return runtime;
        };

        this.getRuntime = function() {
            return runtime;
        };

        this.disconnectRuntime = function() {
            if ( !runtime ) {
                return;
            }

            runtime.__client--;

            if ( runtime.__client <= 0 ) {
                cache.remove( runtime );
                delete runtime.__promise;
                runtime.destroy();
            }

            runtime = null;
        };

        this.exec = function() {
            if ( !runtime ) {
                return;
            }

            var args = Base.slice( arguments );
            component && args.unshift( component );

            return runtime.exec.apply( this, args );
        };

        this.getRuid = function() {
            return runtime && runtime.uid;
        };

        this.destroy = (function( destroy ) {
            return function() {
                destroy && destroy.apply( this, arguments );
                this.trigger('destroy');
                this.off();
                this.exec('destroy');
                this.disconnectRuntime();
            };
        })( this.destroy );
    }

    Mediator.installTo( RuntimeClient.prototype );
    return RuntimeClient;
});