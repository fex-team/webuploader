/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 * @import base.js
 */
define( 'webuploader/core/runtime/runtime', [ 'webuploader/base',
        'webuploader/core/mediator' ], function( Base, Mediator ) {

    var $ = Base.$,
        factories = {};

    // 接口类。
    function Runtime( options ) {
        this.options = $.extend( {
            container: document.body
        }, options );
        this.uid = Base.guid( 'rt_' );
    }

    // 添加事件功能
    Mediator.installTo( Runtime.prototype );

    Runtime.prototype.connect = Base.notImplement;
    Runtime.prototype.exec = Base.notImplement;
    Runtime.prototype.destroy = Base.notImplement;

    Runtime.orders = 'html5,flash';


    /**
     * 添加Runtime实现。
     * @method addRuntime
     * @param {String} type    类型
     * @param {Runtime} factory 具体Runtime实现。
     */
    Runtime.addRuntime = function( type, factory ) {
        if ( !(factory instanceof Runtime) ) {
            Base.log( 'Runtime类型错误。' );
            return;
        }

        factories[ type ] = factory;
    };

    Runtime.hasRuntime = function( type ) {
        return !!factories[ type ];
    };

    Runtime.create = function( opts, orders ) {
        var type, runtime;

        orders = orders || Runtime.orders;
        Base.each( orders.split( /\s*,\s*/g ), function() {
            if ( factories[ this ] ) {
                type = this;
                return false;
            }
        } );

        type = type || getFirstKey( factories );

        if ( !type ) {
            throw new Error( 'Runtime Error' );
        }

        runtime = new factories[ type ]( opts );
    };

    // 获取对象的第一个key
    function getFirstKey( obj ) {
        var key;

        for( key in obj ) {
            if ( obj.hasOwnProperty( key ) ) {
                return key;
            }
        }

        return '';
    }

    return Runtime;
} );