/**
 * 直接来源于jquery的代码。
 * @fileOverview Promise/A+
 * @beta
 */
define([
    './dollar'
], function( $ ) {

    var api;

    // 简单版Callbacks, 默认memory，可选once.
    function Callbacks( once ) {
        var list = [],
            stack = !once && [],
            fire = function( data ) {
                memory = data;
                fired = true;
                firingIndex = firingStart || 0;
                firingStart = 0;
                firingLength = list.length;
                firing = true;

                for ( ; list && firingIndex < firingLength; firingIndex++ ) {
                    list[ firingIndex ].apply( data[ 0 ], data[ 1 ] );
                }
                firing = false;

                if ( list ) {
                    if ( stack ) {
                        stack.length && fire( stack.shift() );
                    }  else {
                        list = [];
                    }
                }
            },
            self = {
                add: function() {
                    if ( list ) {
                        var start = list.length;
                        (function add ( args ) {
                            $.each( args, function( _, arg ) {
                                var type = $.type( arg );
                                if ( type === 'function' ) {
                                    list.push( arg );
                                } else if ( arg && arg.length &&
                                        type !== 'string' ) {

                                    add( arg );
                                }
                            });
                        })( arguments );

                        if ( firing ) {
                            firingLength = list.length;
                        } else if ( memory ) {
                            firingStart = start;
                            fire( memory );
                        }
                    }
                    return this;
                },

                disable: function() {
                    list = stack = memory = undefined;
                    return this;
                },

                // Lock the list in its current state
                lock: function() {
                    stack = undefined;
                    if ( !memory ) {
                        self.disable();
                    }
                    return this;
                },

                fireWith: function( context, args ) {
                    if ( list && (!fired || stack) ) {
                        args = args || [];
                        args = [ context, args.slice ? args.slice() : args ];
                        if ( firing ) {
                            stack.push( args );
                        } else {
                            fire( args );
                        }
                    }
                    return this;
                },

                fire: function() {
                    self.fireWith( this, arguments );
                    return this;
                }
            },

            fired, firing, firingStart, firingLength, firingIndex, memory;

        return self;
    }

    function Deferred( func ) {
        var tuples = [
                // action, add listener, listener list, final state
                [ 'resolve', 'done', Callbacks( true ), 'resolved' ],
                [ 'reject', 'fail', Callbacks( true ), 'rejected' ],
                [ 'notify', 'progress', Callbacks() ]
            ],
            state = 'pending',
            promise = {
                state: function() {
                    return state;
                },
                always: function() {
                    deferred.done( arguments ).fail( arguments );
                    return this;
                },
                then: function( /* fnDone, fnFail, fnProgress */ ) {
                    var fns = arguments;
                    return Deferred(function( newDefer ) {
                        $.each( tuples, function( i, tuple ) {
                            var action = tuple[ 0 ],
                                fn = $.isFunction( fns[ i ] ) && fns[ i ];

                            // deferred[ done | fail | progress ] for
                            // forwarding actions to newDefer
                            deferred[ tuple[ 1 ] ](function() {
                                var returned;

                                returned = fn && fn.apply( this, arguments );

                                if ( returned &&
                                        $.isFunction( returned.promise ) ) {

                                    returned.promise()
                                            .done( newDefer.resolve )
                                            .fail( newDefer.reject )
                                            .progress( newDefer.notify );
                                } else {
                                    newDefer[ action + 'With' ](
                                            this === promise ?
                                            newDefer.promise() :
                                            this,
                                            fn ? [ returned ] : arguments );
                                }
                            });
                        });
                        fns = null;
                    }).promise();
                },

                // Get a promise for this deferred
                // If obj is provided, the promise aspect is added to the object
                promise: function( obj ) {

                    return obj != null ? $.extend( obj, promise ) : promise;
                }
            },
            deferred = {};

        // Keep pipe for back-compat
        promise.pipe = promise.then;

        // Add list-specific methods
        $.each( tuples, function( i, tuple ) {
            var list = tuple[ 2 ],
                stateString = tuple[ 3 ];

            // promise[ done | fail | progress ] = list.add
            promise[ tuple[ 1 ] ] = list.add;

            // Handle state
            if ( stateString ) {
                list.add(function() {
                    // state = [ resolved | rejected ]
                    state = stateString;

                // [ reject_list | resolve_list ].disable; progress_list.lock
                }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
            }

            // deferred[ resolve | reject | notify ]
            deferred[ tuple[ 0 ] ] = function() {
                deferred[ tuple[ 0 ] + 'With' ]( this === deferred ? promise :
                        this, arguments );
                return this;
            };
            deferred[ tuple[ 0 ] + 'With' ] = list.fireWith;
        });

        // Make the deferred a promise
        promise.promise( deferred );

        // Call given func if any
        if ( func ) {
            func.call( deferred, deferred );
        }

        // All done!
        return deferred;
    }

    api = {
        /**
         * 创建一个[Deferred](http://api.jquery.com/category/deferred-object/)对象。
         * 详细的Deferred用法说明，请参照jQuery的API文档。
         *
         * Deferred对象在钩子回掉函数中经常要用到，用来处理需要等待的异步操作。
         *
         * @for  Base
         * @method Deferred
         * @grammar Base.Deferred() => Deferred
         * @example
         * // 在文件开始发送前做些异步操作。
         * // WebUploader会等待此异步操作完成后，开始发送文件。
         * Uploader.register({
         *     'before-send-file': 'doSomthingAsync'
         * }, {
         *
         *     doSomthingAsync: function() {
         *         var deferred = Base.Deferred();
         *
         *         // 模拟一次异步操作。
         *         setTimeout(deferred.resolve, 2000);
         *
         *         return deferred.promise();
         *     }
         * });
         */
        Deferred: Deferred,

        /**
         * 判断传入的参数是否为一个promise对象。
         * @method isPromise
         * @grammar Base.isPromise( anything ) => Boolean
         * @param  {*}  anything 检测对象。
         * @return {Boolean}
         * @for  Base
         * @example
         * console.log( Base.isPromise() );    // => false
         * console.log( Base.isPromise({ key: '123' }) );    // => false
         * console.log( Base.isPromise( Base.Deferred().promise() ) );    // => true
         *
         * // Deferred也是一个Promise
         * console.log( Base.isPromise( Base.Deferred() ) );    // => true
         */
        isPromise: function( anything ) {
            return anything && typeof anything.then === 'function';
        },

        /**
         * 返回一个promise，此promise在所有传入的promise都完成了后完成。
         * 详细请查看[这里](http://api.jquery.com/jQuery.when/)。
         *
         * @method when
         * @for  Base
         * @grammar Base.when( promise1[, promise2[, promise3...]] ) => Promise
         */
        when: function( subordinate /* , ..., subordinateN */ ) {
            var i = 0,
                slice = [].slice,
                resolveValues = slice.call( arguments ),
                length = resolveValues.length,

                // the count of uncompleted subordinates
                remaining = length !== 1 || (subordinate &&
                    $.isFunction( subordinate.promise )) ? length : 0,

                // the master Deferred. If resolveValues consist of
                // only a single Deferred, just use that.
                deferred = remaining === 1 ? subordinate : Deferred(),

                // Update function for both resolve and progress values
                updateFunc = function( i, contexts, values ) {
                    return function( value ) {
                        contexts[ i ] = this;
                        values[ i ] = arguments.length > 1 ?
                                slice.call( arguments ) : value;

                        if ( values === progressValues ) {
                            deferred.notifyWith( contexts, values );
                        } else if ( !(--remaining) ) {
                            deferred.resolveWith( contexts, values );
                        }
                    };
                },

                progressValues, progressContexts, resolveContexts;

            // add listeners to Deferred subordinates; treat others as resolved
            if ( length > 1 ) {
                progressValues = new Array( length );
                progressContexts = new Array( length );
                resolveContexts = new Array( length );
                for ( ; i < length; i++ ) {
                    if ( resolveValues[ i ] &&
                            $.isFunction( resolveValues[ i ].promise ) ) {

                        resolveValues[ i ].promise()
                                .done( updateFunc( i, resolveContexts,
                                        resolveValues ) )
                                .fail( deferred.reject )
                                .progress( updateFunc( i, progressContexts,
                                        progressValues ) );
                    } else {
                        --remaining;
                    }
                }
            }

            // if we're not waiting on anything, resolve the master
            if ( !remaining ) {
                deferred.resolveWith( resolveContexts, resolveValues );
            }

            return deferred.promise();
        }
    };

    return api;
});