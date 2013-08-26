/**
 * @fileOverview 基础类方法。其他模块中最好不要直接用jq-bridge, 而是通过Base来使用。
 * jQuery中有的方法，在jq-bridge中实现，jQuery外的方法在此方法中实现。
 */
 define( 'WebUploader/Base', [ 'jq-bridge' ], function( $ ) {
    return {
        $: $,

        version: '@version@',

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
                }
            }

            // 复制静态方法
            $.extend( true, child, Super, staticProtos || {} );

            // 让子类的__super__属性指向父类。
            child.__super__ = Super.prototype;

            // 构建原型，添加原型方法或属性。
            // 暂时用Object.create实现。
            child.prototype = Object.create( Super.prototype );
            protos && $.extend( true, child.prototype, protos );

            return child;
        },

        notImplement: function() {
            throw new Error( 'Not Implemented!');
        }
    }
 } );