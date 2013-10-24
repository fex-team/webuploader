/**
 * @fileOverview DragAndDrop Widget。
 * @import base.js, widgets/widget.js, core/uploader.js
 */
define( 'webuploader/widgets/filednd', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/lib/dnd' ], function(
        Base, Uploader, Dnd ) {

    var $ = Base.$;

    return Uploader.register({
        init: function( opts ) {

            if ( !opts.dnd ) {
                return;
            }

            var me = this,
                deferred = Base.Deferred(),
                options = $.extend( {}, {
                    id: opts.dnd,
                    accept: opts.accept
                } ),
                dnd;

            dnd = new Dnd( options );

            dnd.one( 'ready', deferred.resolve );
            dnd.on( 'drop', function( files ) {
                me.owner.trigger( 'filesin', files );
            } );
            dnd.init();

            return deferred.promise();
        }
    });

} );