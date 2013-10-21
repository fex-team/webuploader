/**
 * @fileOverview 组件基类。
 * @import widget.js
 */
define( 'webuploader/widgets/filepaste', [ 
    'webuploader/base',
    'webuploader/core/uploader' ], function( 
        Base, Uploader ) {

    var $ = Base.$;

    return Uploader.register({
        init: function( opts ) {

            if ( !opts.paste ) {
                return;
            }

            var me = this,
                options = $.extend( {}, {
                    id: opts.paste,
                    accept: opts.accept
                } ),
                FilePaste = me.runtime.getComponent( 'FilePaste' ),
                paste;

            paste = new FilePaste( options );

            paste.on( 'paste', function( files ) {
                me.owner.trigger( 'filesin', files );
            } );
            paste.init();
        }
    });
    
} );