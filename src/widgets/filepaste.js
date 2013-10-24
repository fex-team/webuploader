/**
 * @fileOverview 组件基类。
 * @import base.js, core/uploader.js
 */
define( 'webuploader/widgets/filepaste', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/lib/filepaste' ], function(
        Base, Uploader, FilePaste ) {

    var $ = Base.$;

    return Uploader.register({
        init: function( opts ) {

            if ( !opts.paste ) {
                return;
            }

            var me = this,
                deferred = Base.Deferred(),
                options = $.extend( {}, {
                    id: opts.paste,
                    accept: opts.accept
                } ),
                paste;

            paste = new FilePaste( options );

            paste.one( 'ready', deferred.resolve );
            paste.on( 'paste', function( files ) {
                me.owner.trigger( 'filesin', files );
            } );
            paste.init();

            return deferred.promise();
        }
    });

} );