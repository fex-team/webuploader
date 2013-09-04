/**
 * @fileOverview Mediator
 */
define( 'webuploader/core/mediator', [ 'webuploader/base' ], function( Base ) {
    var $ = Base.$,
        slice = [].slice,
        protos;


    // 生成匹配namespace的正则
    function matcherFor( ns ) {
        return new RegExp( '(?:^| )' + ns.replace( ' ', ' .* ?' ) + '(?: |$)' );
    }

    // 分离event name和event namespace
    function parse( name ) {
        var parts = ('' + name).split( '.' );

        return {
            e: parts[ 0 ],
            ns: parts.slice( 1 ).sort().join( ' ' )
        };
    }

    // 根据条件过滤出事件handlers.
    function findHandlers( arr, name, callback, context ) {
        var matcher,
            obj;

        obj = parse( name );
        obj.ns && (matcher = matcherFor( obj.ns ));

        // @todo IE8不支持filter，需要换种写法。
        return arr.filter(function( handler ) {
            return handler &&
                    (!obj.e || handler.e === obj.e) &&
                    (!obj.ns || matcher.test( handler.ns )) &&
                    (!callback || handler.cb === callback ||
                    handler.cb._cb === callback) &&
                    (!context || handler.ctx === context);
        });
    }

    function triggerHanders( events, args ) {
        var stoped = false,
            i = -1,
            len = events.length,
            handler;

        while ( ++i < len ) {
            handler = events[ i ];

            if ( handler.cb.apply( handler.ctx2, args ) === false ) {
                stoped = true;
                break;
            }
        }
        return !stoped;
    }

    protos = {

        /**
         * 绑定事件。
         * @method on
         * @grammar on( name, fn[, context] ) => self
         * @param  {String}   name     事件名
         * @param  {Function} callback 事件处理器
         * @param  {Object}   context  事件处理器的上下文。
         * @return {self} 返回自身，方便链式
         * @chainable
         * @class Mediator
         */
        on: function( name, callback, context ) {
            var me = this,
                handler, set;

            if ( !callback ) {
                return this;
            }

            set = this._events || (this._events = []);

            handler = parse( name );

            handler.cb = callback;
            handler.ctx = context;
            handler.ctx2 = context || me;
            handler.id = set.length;

            set.push( handler );

            return this;
        },

        /**
         * 绑定事件，且当handler执行完后，自动解除绑定。
         * @method once
         * @grammar once( name, fn[, context] ) => self
         * @param  {String}   name     事件名
         * @param  {Function} callback 事件处理器
         * @param  {Object}   context  事件处理器的上下文。
         * @return {self} 返回自身，方便链式
         * @chainable
         */
        once: function( name, callback, context ) {
            var me = this,
                once;

            if ( !callback ) {
                return me;
            }

            once = function() {
                me.off( name, once );
                return callback.apply( context || me, arguments );
            };

            once._cb = callback;
            me.on( name, once, context );

            return me;
        },

        /**
         * 解除事件绑定
         * @method off
         * @grammar off( name[, fn[, context] ] ) => self
         * @param  {String}   name     事件名
         * @param  {Function} callback 事件处理器
         * @param  {Object}   context  事件处理器的上下文。
         * @return {self} 返回自身，方便链式
         * @chainable
         */
        off: function( name, callback, context ) {
            var events = this._events;

            if ( !events ) {
                return this;
            }

            if ( !name && !callback && !context ) {
                this._events = [];
                return this;
            }

            findHandlers( events, name, callback, context )
                    .forEach(function( handler ) {
                        delete events[ handler.id ];
                    });

            return this;
        },

        /**
         * 触发事件
         * @method trigger
         * @grammar trigger( name[, ...] ) => self
         * @param  {String}   type     事件名
         * @param  {*} [...] 任意参数
         * @return {Boolean} 如果handler中return false了，则返回false, 否则返回true
         */
        trigger: function( type ) {
            var args, events, allEvents;

            if ( !this._events || !type ) {
                return this;
            }

            args = slice.call( arguments, 1 );
            events = findHandlers( this._events, type );
            allEvents = findHandlers( this._events, 'all' );

            return triggerHanders( events, args ) &&
                    triggerHanders( allEvents, arguments );
        }
    };

    /**
     * 中介者，它本身是个单例，但可以通过[installTo](#WebUploader:Mediator:installTo)方法，使任何对象具备事件行为。
     * 主要目的是负责模块与模块之间的合作，降低耦合度。
     * @class Mediator
     */
    return $.extend( {

        /**
         * 可以通过这个接口，使任何对象具备事件功能。
         * @method installTo
         * @param  {Object} obj 需要具备事件行为的对象。
         * @return {Object} 返回obj.
         */
        installTo: function( obj ) {
            return $.extend( obj, protos );
        }

    }, protos );
} );