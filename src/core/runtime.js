/**
 * @fileOverview Runtime管理器，负责Runtime的选择。
 * @import base.js
 */
define( 'WebUploader/core/Runtime', [ 'WebUploader/Base',
        'WebUploader/core/Mediator' ], function( Base, Mediator ) {
    var $ = Base.$,
        factories = {},
        separator = /\s*,\s*/,
        runtime;

    function Runtime( opts, type, caps ) {
        var me = this,
            klass = me.constructor;

        caps = caps || {};

        // 执行detects
        $.each( klass.getDetects(), function( key, val ) {
            $.extend( caps, val() );
        } );

        caps = $.extend( {

            // 是否能调正图片大小
            resize_image: false,

            // 是否能选择图片
            select_file: false,

            // 是否能多选
            select_multiple: false,

            // 是否支持文件过滤
            filter_by_extension: false,

            // 是否支持拖放
            drag_and_drop: false

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
            return true;
        },

        /**
         * 执行指定模块的，指定方法。
         */
        exec: function( component, api/*, args...*/ ) {
            var args = [].slice.call( arguments, 2 );

            component = this.getComponent( component );

            if ( typeof component[ api ] === 'function' ) {
                return component[ api ].apply( component, args );
            }
        },

        /**
         * 获取component, 每个Runtime中component只会实例化一次。
         */
        getComponent: function( name, opts ) {
            var me = this,
                klass = me.klass,
                components = klass.components,
                pool = me._objPool || (me._objPool = {}),
                component;

            if ( !pool[ name ] && (component = components[ name ]) ) {

                if ( typeof component === 'function' ) {
                    Mediator.installTo( component.prototype );
                    component = new component( opts );
                } else {
                    component = $.extend( {}, component );
                    Mediator.installTo( component );
                }

                component.getRuntime = function() {
                    return me;
                }
                pool[ name ] = component;
            }

            return pool[ name ];
        },

        destory: function() {
        }
    }

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
    Runtime.getInstance = function( opts, caps, orders ) {
        var factory;

        // 如果已经实例化过，则直接返回。
        if ( runtime ) {
            return runtime;
        }

        orders = (orders || Runtime.orders).split( separator );
        $.each( orders, function( i, type ) {
            factory = factories[ type ];
            runtime = new factory( opts );

            if ( !runtime.capable( caps ) ) {
                runtime.destory();
                runtime = null;
            } else {
                return false;
            }
        } );

        if ( !runtime ) {
            throw new Error( '不能找到合适的runtime.' );
        }

        return runtime;
    };

    // 添加检测函数，在Runtime初始化的时候执行。
    Runtime.addDetect = function( fn ) {
        var pool = this.detects || (this.detects = []);

        pool.push( fn );
    };

    Runtime.getDetects = function( fn ) {
        return this.detects || [];
    };

    Runtime.register = function( name, component ) {
        var pool = this.components || (this.components = {});

        pool[ name ] = component;
        return this;
    };

    return Runtime;
} );