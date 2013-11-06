/**
 * @fileOverview DragAndDrop Widget。
 * @import base.js, core/uploader.js, widgets/widget.js, runtime/runtime.js
 */
define( 'webuploader/widgets/runtime', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/runtime/runtime' ], function( Base, Uploader, Runtime ) {

    var $ = Base.$;

    return Uploader.register({
            'get-runtime-type': 'getRuntmeType'
        }, {

        getRuntmeType: function() {
            var orders = this.options.runtimeOrder || Runtime.orders,
                type = this.type,
                i, len;

            if ( !type ) {
                orders = orders.split(/\s*,\s*/g);
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

} );