/**
 * @fileOverview 基础类方法。
 */

// 如果生成依赖jquery版本，则用
// define( 'webuploader/base', [ 'jQuery' ], function( $ ) {
define( 'webuploader/base', [ 'webuploader/jq-bridge' ], function( $ ) {
    var noop = function() {},
        call = Function.call;

    // http://jsperf.com/uncurrythis
    // 反科里化
    function uncurryThis( fn ) {
        return function () {
            return call.apply( fn, arguments );
        };
    }

    function bindFn( fn, context ) {
        return fn.bind ? fn.bind( context ) : function() {
            return fn.apply( context, arguments );
        };
    }

    function createObject( proto ) {
        var f;

        if ( Object.create ) {
            return Object.create( proto )
        } else {
            f = function(){};
            f.prototype = proto;
            return new f();
        }
    }

    return {
        // @version@ 将会被package.json中的version值替代。
        version: '@version@',

        $: $,

        isPromise: function( anything ) {
            return anything && typeof anything.then === 'function';
        },

        Deferred: $.Deferred,

        when: $.when,

        // 简单的浏览器检测。
        browser: (function( ua ){
            var ret = {},
                webkit = ua.match(/WebKit\/([\d.]+)/),
                chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
                ie = ua.match(/MSIE\s([\d.]+)/),
                firefox = ua.match(/Firefox\/([\d.]+)/),
                safari = ua.match(/Safari\/([\d.]+)/),
                opera = ua.match(/OPR\/([\d.]+)/);

            webkit && (ret.webkit = parseFloat( webkit[ 1 ] ));
            chrome && (ret.chrome = parseFloat( chrome[ 1 ] ));
            ie && (ret.ie = parseFloat( ie[ 1 ] ));
            firefox && (ret.firefox = parseFloat( firefox[ 1 ] ));
            safari && (ret.safari = parseFloat( safari[ 1 ] ));
            opera && (ret.opera = parseFloat( opera[ 1 ] ));

            return ret
        })( navigator.userAgent ),

        /**
         * 实现类与类之间的继承。
         * @method inherits
         * @param  {Function} super 父类
         * @param  {Object | Function} [protos] 子类或者对象。如果对象中包含constructor，子类将是用此属性值。
         * @param  {Object} [staticProtos] 静态属性或方法。
         * @return {Function} 返回子类。
         * @example
         * function Person() {
         *     console.log( 'Super' );
         * }
         * Person.prototype.hello = function() {
         *     console.log( 'hello' );
         * }
         *
         * var Manager = Base.inherits( Person, {
         *     world: function() {
         *         console.log( 'World' );
         *     }
         * } );
         *
         * // 因为没有指定构造器，父类的构造器将会执行。
         * var instance = new Manager();    // => Super
         *
         * // 继承子父类的方法
         * instance.hello();    // => hello
         * instance.world();    // => World
         *
         * // 子类的__super__属性指向父类
         * console.log( Manager.__super__ === Person );    // => true
         */
        inherits: function( Super, protos, staticProtos ) {
            var child;

            if ( typeof protos === 'function' ) {
                child = protos;
                protos = null;
            } else if ( protos && protos.hasOwnProperty( 'constructor' ) ) {
                child = protos.constructor;
            } else {
                child = function() {
                    return Super.apply( this, arguments );
                };
            }

            // 复制静态方法
            $.extend( true, child, Super, staticProtos || {} );

            /* jshint camelcase: false */

            // 让子类的__super__属性指向父类。
            child.__super__ = Super.prototype;

            // 构建原型，添加原型方法或属性。
            // 暂时用Object.create实现。
            child.prototype = createObject( Super.prototype );
            protos && $.extend( true, child.prototype, protos );

            return child;
        },

        noop: noop,

        // 修复方法的执行上下文。
        bindFn: bindFn,

        log: (function() {
            if ( window.console.log ) {
                return bindFn( console.log, console );
            }
            return noop;
        })(),

        nextTick: (function() {
            
            return function( cb ) {
                setTimeout( cb, 1 );
            }

            // @bug 当浏览器不在当前窗口时就停了。
            // var next = window.requestAnimationFrame ||
            //     window.webkitRequestAnimationFrame ||
            //     window.mozRequestAnimationFrame ||
            //     function( cb ) {
            //         window.setTimeout( cb, 1000 / 60 );
            //     };

            // // fix: Uncaught TypeError: Illegal invocation
            // return bindFn( next, window );
        })(),

        slice: uncurryThis( [].slice ),

        guid: (function() {
            var counter = 0;

            return function( prefix ) {
                var guid = (+new Date()).toString( 32 ),
                    i = 0;

                for ( ; i < 5; i++ ) {
                    guid += Math.floor( Math.random() * 65535 ).toString( 32 );
                }

                return (prefix || 'o_') + guid + (counter++).toString( 32 );
            };
        }()),

        formatSize: function( size, pointLength, units ) {
            var unit;

            units = units || [ 'B', 'K', 'M', 'G', 'TB' ];

            while ( (unit = units.shift()) && size > 1024 ) {
                size = size / 1024;
            }

            return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                    unit;
        }
    };
} );