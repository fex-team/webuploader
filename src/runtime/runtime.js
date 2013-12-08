/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 */
define([
    '/base',
    '/core/mediator'
], function( Base, Mediator ) {

    var $ = Base.$,
        factories = {};

    // 接口类。
    function Runtime( options ) {
        this.options = $.extend({
            container: document.body
        }, options );
        this.uid = Base.guid('rt_');
    }

    $.extend( Runtime.prototype, {

        getContainer: function() {
            var opts = this.options,
                parent, container;

            if ( this.container ) {
                return this.container;
            }

            parent = opts.container || $( document.body );
            container = $( document.createElement('div') );

            container.attr( 'id', 'rt_' + this.uid );
            container.css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '1px',
                height: '1px',
                overflow: 'hidden'
            });

            parent.append( container );
            this.container = container;

            return container;
        },

        init: Base.noop,
        exec: Base.noop
    });

    Runtime.orders = 'html5,flash';


    /**
     * 添加Runtime实现。
     * @method addRuntime
     * @param {String} type    类型
     * @param {Runtime} factory 具体Runtime实现。
     */
    Runtime.addRuntime = function( type, factory ) {
        factories[ type ] = factory;
    };

    Runtime.hasRuntime = function( type ) {
        return !!factories[ type ];
    };

    Runtime.create = function( opts, orders ) {
        var type, runtime;

        orders = orders || Runtime.orders;
        $.each( orders.split( /\s*,\s*/g ), function() {
            if ( factories[ this ] ) {
                type = this;
                return false;
            }
        });

        type = type || getFirstKey( factories );

        if ( !type ) {
            throw new Error('Runtime Error');
        }

        runtime = new factories[ type ]( opts );
        return runtime;
    };

    // 获取对象的第一个key
    function getFirstKey( obj ) {
        var key;

        for ( key in obj ) {
            if ( obj.hasOwnProperty( key ) ) {
                return key;
            }
        }

        return '';
    }

    Mediator.installTo( Runtime.prototype );
    return Runtime;
});