/**
 * @fileOverview DragAndDrop Widget。
 * @import base.js, widgets/widget.js, core/uploader.js, lib/dnd.js
 */
define( 'webuploader/widgets/filednd', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/lib/dnd' ], function(
        Base, Uploader, Dnd ) {

    var $ = Base.$;

    Uploader.options.dnd = '';

    return Uploader.register({
        init: function( opts ) {

            if ( !opts.dnd || !Dnd.support() ) {
                return;
            }

            var me = this,
                deferred = Base.Deferred(),
                options = $.extend( {}, {
                    container: opts.dnd,
                    accept: opts.accept
                } ),
                dnd;

            dnd = new Dnd( options );

            dnd.once( 'ready', deferred.resolve );
            dnd.on( 'drop', function( files ) {
                me.request('add-file', [files]);
            } );
            dnd.init();

            return deferred.promise();
        }
    });

} );