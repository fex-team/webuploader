/**
 * @fileOverview 组件基类。
 * @import base.js, core/uploader.js, lib/filepaste.js
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
                    container: opts.paste,
                    accept: opts.accept
                } ),
                paste;

            paste = new FilePaste( options );

            paste.once( 'ready', deferred.resolve );
            paste.on( 'paste', function( files ) {
                me.owner.request('add-file', [files]);
            } );
            paste.init();

            return deferred.promise();
        }
    });

} );