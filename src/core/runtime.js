/**
 * @fileOverview Runtime管理器，负责Runtime的选择。
 * @import base.js
 */
define( 'webuploader/core/runtime', [ 'webuploader/base',
        'webuploader/core/mediator' ], function( Base, Mediator ) {

    var $ = Base.$,
        factories = {},
        separator = /\s*,\s*/,
        runtime;

    function Runtime( opts, type, caps ) {
        var me = this,
            klass = me.constructor;

        caps = caps || {};

        // 执行detect hooks
        $.each( klass.getDetects(), function( key, val ) {
            $.extend( caps, val() );
        } );

        caps = $.extend( {

            // 是否能调正图片大小
            resizeImage: false,

            // 是否能选择图片
            selectFile: false,

            // 是否能多选
            selectMultiple: false,

            // 是否支持文件过滤
            filterByExtension: false,

            // 是否支持拖放
            dragAndDrop: false

        }, caps );

        $.extend( this, {
            klass: klass,

            type: type,

            caps: caps,

            options: opts
        } );
    }

    Runtime.prototype = {

        /**
         * 判断是否具备指定的能力
         * @todo
         * @method capable
         * @return {Boolean}
         */
        capable: function( requiredCaps ) {
            var caps, i, len;

            if ( typeof requiredCaps === 'string' ) {
                caps = requiredCaps.split( separator );
            } else if ( $.isPlainObject( requiredCaps ) ) {
                caps = [];
                $.each( requiredCaps, function( k, v ) {
                    v && caps.push( k );
                } );
            }

            for( i = 0, len = caps.length; i < len; i++ ) {
                if ( !this.caps[ caps[ i ] ] ) {
                    return false;
                }
            }

            return true;
        },

        hasComponent: function( name ) {
            return !!this.klass.components[ name ];
        },

        /**
         * 获取component, 每个Runtime中component只会实例化一次。
         */
        getComponent: function( name ) {
            var component = this.klass.components[ name ];

            if ( !component ) {
                throw new Error( 'Component ' + name + ' 不存在' );
            }

            if ( typeof component === 'function' ) {
                Mediator.installTo( component.prototype );
                component.prototype.runtime = this;
            } else {
                Mediator.installTo( component );
                component.runtime = this;
            }

            return component;
        },

        destory: function() {
        }
    };

    // 使Runtime具有事件能力
    Mediator.installTo( Runtime.prototype );

    Runtime.orders = 'html5,flash';

    /**
     * 添加运行时类型。
     * @method addRuntime
     * @param  {[type]} type    [description]
     * @param  {[type]} factory [description]
     * @return {[type]}         [description]
     */
    Runtime.addRuntime = function( type, factory ) {
        factories[ type ] = factory;
    };

    /**
     * 获取运行时，根据能力按照指定顺便，找到第一个具有此能力的运行时。
     * @method getInstance
     * @param  {Object} [opts] 配置项
     * @param {String | Object} [caps] 需要的能力
     * @param {String} [orders='html5,flash'] 运行时检测顺序。
     */
    Runtime.getInstance = function( opts, orders ) {
        var factory, caps;

        // 如果已经实例化过，则直接返回。
        if ( runtime ) {
            return runtime;
        }

        caps = opts.requiredCaps;
        orders = (orders || Runtime.orders).split( separator );
        $.each( orders, function( i, type ) {
            factory = factories[ type ];

            if ( !factory ) {
                return;
            }

            runtime = new factory( opts );

            if ( !runtime.capable( caps ) ) {
                runtime.destory();
                runtime = null;
            } else {
                return false;
            }
        } );

        if ( !runtime ) {
            throw new Error( '找不到合适的runtime, 当前浏览器不支持某些html5特性' );
        }

        return runtime;
    };

    // 添加检测函数，在Runtime初始化的时候执行。
    Runtime.addDetect = function( fn ) {
        var pool = this.detects || (this.detects = []);

        pool.push( fn );
    };

    Runtime.getDetects = function() {
        return this.detects || [];
    };

    Runtime.register = function( name, component ) {
        var pool = this.components || (this.components = {});

        pool[ name ] = component;
        return this;
    };

    return Runtime;
} );