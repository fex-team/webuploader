/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 */
define([
    '../base',
    '../mediator'
], function( Base, Mediator ) {

    var $ = Base.$,
        factories = {},

        // 获取对象的第一个key
        getFirstKey = function( obj ) {
            for ( var key in obj ) {
                if ( obj.hasOwnProperty( key ) ) {
                    return key;
                }
            }
            return null;
        };

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

            if ( this._container ) {
                return this._container;
            }

            parent = $( opts.container || document.body );
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
            parent.addClass('webuploader-container');
            this._container = container;
            this._parent = parent;
            return container;
        },

        init: Base.noop,
        exec: Base.noop,

        destroy: function() {
            this._container && this._container.remove();
            this._parent && this._parent.removeClass('webuploader-container');
            this.off();
        }
    });

    Runtime.orders = 'html5,flash';


    /**
     * 添加Runtime实现。
     * @param {String} type    类型
     * @param {Runtime} factory 具体Runtime实现。
     */
    Runtime.addRuntime = function( type, factory ) {
        factories[ type ] = factory;
    };

    Runtime.hasRuntime = function( type ) {
        return !!(type ? factories[ type ] : getFirstKey( factories ));
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

    Mediator.installTo( Runtime.prototype );
    return Runtime;
});
