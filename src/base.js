/**
 * @fileOverview 基础类方法。
 */

/**
 * Web Uploader内部类的详细说明，以下提及的功能类，都可以在`WebUploader`这个变量中访问到。
 *
 * As you know, Web Uploader的每个文件都是用过[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD)规范中的`define`组织起来的, 每个Module都会有个module id.
 * 默认module id为该文件的路径，而此路径将会转化成名字空间存放在WebUploader中。如：
 *
 * * module `base`：WebUploader.Base
 * * module `file`: WebUploader.File
 * * module `lib/dnd`: WebUploader.Lib.Dnd
 * * module `runtime/html5/dnd`: WebUploader.Runtime.Html5.Dnd
 *
 *
 * 以下文档中对类的使用可能省略掉了`WebUploader`前缀。
 * @module WebUploader
 * @title WebUploader API文档
 */
define([
    './dollar',
    './promise'
], function( $, promise ) {

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
        return function() {
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
         * @property {jQuery|Zepto} $ 引用依赖的jQuery或者Zepto对象。
         */
        $: $,

        Deferred: promise.Deferred,

        isPromise: promise.isPromise,

        when: promise.when,

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

                ie = ua.match( /MSIE\s([\d\.]+)/ ) ||
                    ua.match( /(?:trident)(?:.*rv:([\w.]+))?/i ),
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
         * @description  操作系统检查结果。
         *
         * * `android`  如果在android浏览器环境下，此值为对应的android版本号，否则为`undefined`。
         * * `ios` 如果在ios浏览器环境下，此值为对应的ios版本号，否则为`undefined`。
         * @property {Object} [os]
         */
        os: (function( ua ) {
            var ret = {},

                // osx = !!ua.match( /\(Macintosh\; Intel / ),
                android = ua.match( /(?:Android);?[\s\/]+([\d.]+)?/ ),
                ios = ua.match( /(?:iPad|iPod|iPhone).*OS\s([\d_]+)/ );

            // osx && (ret.osx = true);
            android && (ret.android = parseFloat( android[ 1 ] ));
            ios && (ret.ios = parseFloat( ios[ 1 ].replace( /_/g, '.' ) ));

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
         * @param  {Object} [statics] 静态属性或方法。
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
         * 返回一个新的方法，此方法将已指定的`context`来执行。
         * @grammar Base.bindFn( fn, context ) => Function
         * @method bindFn
         * @example
         * var doSomething = function() {
         *         console.log( this.name );
         *     },
         *     obj = {
         *         name: 'Object Name'
         *     },
         *     aliasFn = Base.bind( doSomething, obj );
         *
         *  aliasFn();    // => Object Name
         *
         */
        bindFn: bindFn,

        /**
         * 引用Console.log如果存在的话，否则引用一个[空函数noop](#WebUploader:Base.noop)。
         * @grammar Base.log( args... ) => undefined
         * @method log
         */
        log: (function() {
            if ( window.console ) {
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

        /**
         * 被[uncurrythis](http://www.2ality.com/2011/11/uncurrying-this.html)的数组slice方法。
         * 将用来将非数组对象转化成数组对象。
         * @grammar Base.slice( target, start[, end] ) => Array
         * @method slice
         * @example
         * function doSomthing() {
         *     var args = Base.slice( arguments, 1 );
         *     console.log( args );
         * }
         *
         * doSomthing( 'ignored', 'arg2', 'arg3' );    // => Array ["arg2", "arg3"]
         */
        slice: uncurryThis( [].slice ),

        /**
         * 生成唯一的ID
         * @method guid
         * @grammar Base.guid() => String
         * @grammar Base.guid( prefx ) => String
         */
        guid: (function() {
            var counter = 0;

            return function( prefix ) {
                var guid = (+new Date()).toString( 32 ),
                    i = 0;

                for ( ; i < 5; i++ ) {
                    guid += Math.floor( Math.random() * 65535 ).toString( 32 );
                }

                return (prefix || 'wu_') + guid + (counter++).toString( 32 );
            };
        })(),

        /**
         * 格式化文件大小, 输出成带单位的字符串
         * @method formatSize
         * @grammar Base.formatSize( size ) => String
         * @grammar Base.formatSize( size, pointLength ) => String
         * @grammar Base.formatSize( size, pointLength, units ) => String
         * @param {Number} size 文件大小
         * @param {Number} [pointLength=2] 精确到的小数点数。
         * @param {Array} [units=[ 'B', 'K', 'M', 'G', 'TB' ]] 单位数组。从字节，到千字节，一直往上指定。如果单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此方法的输出将还是显示成多少K.
         * @example
         * console.log( Base.formatSize( 100 ) );    // => 100B
         * console.log( Base.formatSize( 1024 ) );    // => 1.00K
         * console.log( Base.formatSize( 1024, 0 ) );    // => 1K
         * console.log( Base.formatSize( 1024 * 1024 ) );    // => 1.00M
         * console.log( Base.formatSize( 1024 * 1024 * 1024 ) );    // => 1.00G
         * console.log( Base.formatSize( 1024 * 1024 * 1024, 0, ['B', 'KB', 'MB'] ) );    // => 1024MB
         */
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