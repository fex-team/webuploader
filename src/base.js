/**
 * @fileOverview 基础类方法。
 */

/**
 * Webuploader是一个以html5为主的现代多文件上传js库，比传统FLASH文件上传具有更高的上传效率、
 * 图片处理能力以及更低的内存消耗，同时结合HTML5 File API使得WebUploader具有了更加丰富的文件交互体验。
 * 目前已应用在百度相册上传页中，承载着海量的用户上传。
 *
 * Git: [https://github.com/gmuteam/webuploader](https://github.com/gmuteam/webuploader)
 *
 * @module WebUploader
 * @title WebUploader API文档
 */
define([
    'jQuery'
], function( $ ) {

    var noop = function() {},
        call = Function.call;

    // http://jsperf.com/uncurrythis
    // 反科里化
    function uncurryThis( fn ) {
        return function() {
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
            return Object.create( proto );
        } else {
            f = function() {};
            f.prototype = proto;
            return new f();
        }
    }


    /**
     * 基础类，提供一些简单常用的方法。
     * @class Base
     */
    return {

        /**
         * @property {String} version 当前版本号。
         */
        version: '@version@',

        /**
         * @property {jQuery|Zepto} $ 依赖的jQuery或者Zepto对象。
         */
        $: $,

        /**
         * 创建一个[Deferred](http://api.jquery.com/category/deferred-object/)对象。
         * 详细的Deferred用法说明，请参照jQuery的API文档。
         *
         * Deferred对象在钩子回掉函数中经常要用到，用来处理需要等待的异步操作。
         *
         *
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
        Deferred: $.Deferred,

        /**
         * 判断传入的参数是否为一个promise对象。
         * @method isPromise
         * @grammar Base.isPromise( anything ) => Boolean
         * @param  {*}  anything 检测对象。
         * @return {Boolean}
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
         * @grammar Base.when( promise1[, promise2[, promise3...]] ) => Promise
         */
        when: $.when,

        /**
         * @description  简单的浏览器检查结果。
         *
         * * `webkit`  webkit版本号，如果浏览器为非webkit内核，此属性为`undefined`。
         * * `chrome`  chrome浏览器版本号，如果浏览器为chrome，此属性为`undefined`。
         * * `ie`  ie浏览器版本号，如果浏览器为非ie，此属性为`undefined`。**暂不支持ie10+**
         * * `firefox`  firefox浏览器版本号，如果浏览器为非firefox，此属性为`undefined`。
         * * `safari`  safari浏览器版本号，如果浏览器为非safari，此属性为`undefined`。
         * * `opera`  opera浏览器版本号，如果浏览器为非opera，此属性为`undefined`。
         *
         * @property {Object} [browser]
         */
        browser: (function( ua ) {
            var ret = {},
                webkit = ua.match( /WebKit\/([\d.]+)/ ),
                chrome = ua.match( /Chrome\/([\d.]+)/ ) ||
                    ua.match( /CriOS\/([\d.]+)/ ),

                ie = ua.match( /MSIE\s([\d.]+)/ ),
                firefox = ua.match( /Firefox\/([\d.]+)/ ),
                safari = ua.match( /Safari\/([\d.]+)/ ),
                opera = ua.match( /OPR\/([\d.]+)/ );

            webkit && (ret.webkit = parseFloat( webkit[ 1 ] ));
            chrome && (ret.chrome = parseFloat( chrome[ 1 ] ));
            ie && (ret.ie = parseFloat( ie[ 1 ] ));
            firefox && (ret.firefox = parseFloat( firefox[ 1 ] ));
            safari && (ret.safari = parseFloat( safari[ 1 ] ));
            opera && (ret.opera = parseFloat( opera[ 1 ] ));

            return ret;
        })( navigator.userAgent ),

        /**
         * 实现类与类之间的继承。
         * @method inherits
         * @grammar Base.inherits( super ) => child
         * @grammar Base.inherits( super, protos ) => child
         * @grammar Base.inherits( super, protos, statics ) => child
         * @param  {Class} super 父类
         * @param  {Object | Function} [protos] 子类或者对象。如果对象中包含constructor，子类将是用此属性值。
         * @param  {Function} [protos.constructor] 子类构造器，不指定的话将创建个临时的直接执行父类构造器的方法。
         * @param  {Object} [staticProtos] 静态属性或方法。
         * @return {Class} 返回子类。
         * @example
         * function Person() {
         *     console.log( 'Super' );
         * }
         * Person.prototype.hello = function() {
         *     console.log( 'hello' );
         * };
         *
         * var Manager = Base.inherits( Person, {
         *     world: function() {
         *         console.log( 'World' );
         *     }
         * });
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
            } else if ( protos && protos.hasOwnProperty('constructor') ) {
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

        /**
         * 一个不做任何事情的方法。可以用来赋值给默认的callback.
         * @method noop
         */
        noop: noop,

        /**
         * 返回一个新的方法，此方法将已指定
         * @mthod bindFn
         */
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
            };

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
        })(),

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
});