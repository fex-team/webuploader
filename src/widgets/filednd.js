/**
 * @fileOverview 组件基类。
 * @import widget.js
 */
define( 'webuploader/widgets/filednd', [ 
    'webuploader/base',
    'webuploader/core/uploader' ], function( 
        Base, Uploader ) {

    var $ = Base.$;

    return Uploader.register({
        init: function( opts ) {

            if ( !opts.dnd ) {
                return;
            }

            var me = this,
                options = $.extend( {}, {
                    id: opts.dnd,
                    accept: opts.accept
                } ),
                Dnd = me.runtime.getComponent( 'Dnd' ),
                dnd;

            dnd = new Dnd( options );

            dnd.on( 'drop', function( files ) {
                me.owner.trigger( 'filesin', files );
            } );
            dnd.init();
        }
    });
    
} );