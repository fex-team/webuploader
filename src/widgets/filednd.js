/**
 * @fileOverview DragAndDrop Widget。
 */
define([
    'base',
    'core/uploader',
    'lib/dnd',
    './widget'
], function( Base, Uploader, Dnd ) {

    Uploader.options.dnd = '';

    return Uploader.register({
        init: function( opts ) {

            if ( !opts.dnd || this.request('get-runtime-type') !== 'html5' ) {
                return;
            }

            var me = this,
                deferred = Base.Deferred(),
                options = $.extend({}, {
                    container: opts.dnd,
                    accept: opts.accept
                }),
                dnd;

            dnd = new Dnd( options );

            dnd.once( 'ready', deferred.resolve );
            dnd.on( 'drop', function( files ) {
                me.request( 'add-file', [ files ]);
            });
            dnd.init();

            return deferred.promise();
        }
    });
});