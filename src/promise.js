/**
 * @fileOverview Promise/A+
 */
define([
    './base'
], function( Base ) {

    var $ = Base.$,
        api;

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
        Deferred: Deferred,

        when: function( subordinate /* , ..., subordinateN */ ) {
            var i = 0,
                resolveValues = Base.slice( arguments ),
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
                                Base.slice( arguments ) : value;

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

    $.extend( Base, api );

    return api;
});