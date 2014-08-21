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
    
    /**
     * @property {Selector} [disableGlobalDnd=false]  是否禁掉整个页面的拖拽功能，如果不禁用，图片拖进来的时候会默认被浏览器打开。
     * @namespace options
     * @for Uploader
     */

    /**
     * @event dndAccept
     * @param {DataTransferItemList} items DataTransferItem
     * @description 阻止此事件可以拒绝某些类型的文件拖入进来。目前只有 chrome 提供这样的 API，且只能通过 mime-type 验证。
     * @for  Uploader
     */
    return Uploader.register({
        name: 'dnd',
        
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

            this.dnd = dnd = new Dnd( options );

            dnd.once( 'ready', deferred.resolve );
            dnd.on( 'drop', function( files ) {
                me.request( 'add-file', [ files ]);
            });

            // 检测文件是否全部允许添加。
            dnd.on( 'accept', function( items ) {
                return me.owner.trigger( 'dndAccept', items );
            });

            dnd.init();

            return deferred.promise();
        },

        destroy: function() {
            this.dnd && this.dnd.destroy();
        }
    });
});
