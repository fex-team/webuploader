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

    return Uploader.register({
        'predict-runtime-type': 'predictRuntmeType'
    }, {

        init: function() {
            if ( !this.predictRuntmeType() ) {
                throw Error('Runtime Error');
            }
        },

        /**
         * 预测Uploader将采用哪个`Runtime`
         * @grammar predictRuntmeType() => String
         * @method predictRuntmeType
         * @for  Uploader
         */
        predictRuntmeType: function() {
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