/**
 * @fileOverview 添加获取Runtime相关信息的方法。
 */
define([
    '../uploader',
    '../runtime/runtime',
    './widget'
], function( Uploader, Runtime ) {

    Uploader.support = function() {
        return Runtime.hasRuntime.apply( Runtime, arguments );
    };

    /**
     * @property {Object} [runtimeOrder=html5,flash]
     * @namespace options
     * @for Uploader
     * @description 指定运行时启动顺序。默认会想尝试 html5 是否支持，如果支持则使用 html5, 否则则使用 flash.
     *
     * 可以将此值设置成 `flash`，来强制使用 flash 运行时。
     */

    return Uploader.register({
        name: 'runtime',

        init: function() {
            if ( !this.predictRuntimeType() ) {
                throw Error('Runtime Error');
            }
        },

        /**
         * 预测Uploader将采用哪个`Runtime`
         * @grammar predictRuntimeType() => String
         * @method predictRuntimeType
         * @for  Uploader
         */
        predictRuntimeType: function() {
            var orders = this.options.runtimeOrder || Runtime.orders,
                type = this.type,
                i, len;

            if ( !type ) {
                orders = orders.split( /\s*,\s*/g );

                for ( i = 0, len = orders.length; i < len; i++ ) {
                    if ( Runtime.hasRuntime( orders[ i ] ) ) {
                        this.type = type = orders[ i ];
                        break;
                    }
                }
            }

            return type;
        }
    });
});