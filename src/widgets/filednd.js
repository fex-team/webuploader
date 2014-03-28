/**
 * @fileOverview DragAndDrop Widget。
 */
define([
    '../base',
    '../uploader',
    '../lib/dnd',
    './widget'
], function( Base, Uploader, Dnd ) {
    var $ = Base.$;

    Uploader.options.dnd = '';

    /**
     * @property {Selector} [dnd=undefined]  指定Drag And Drop拖拽的容器，如果不指定，则不启动。
     * @namespace options
     * @for Uploader
     */
    return Uploader.register({
        init: function( opts ) {

            if ( !opts.dnd ||
                    this.request('predict-runtime-type') !== 'html5' ) {
                return;
            }

            var me = this,
                deferred = Base.Deferred(),
                options = $.extend({}, {
                    disableGlobalDnd: opts.disableGlobalDnd,
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
