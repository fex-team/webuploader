/**
 * @fileOverview 组件基类。
 * @import base.js, core/uploader.js
 */
define( 'webuploader/widgets/network', [
    'webuploader/base',
    'webuploader/core/uploader' ], function(
        Base, Uploader ) {

    var $ = Base.$;

    return Uploader.register({
        init: function() {
            var me = this,
                Network = me.runtime.getComponent( 'Network' );

            Network.getInstance().on( 'all', function() {
                return me.owner.trigger.apply( me.owner, arguments );
            } );
        }
    });

} );