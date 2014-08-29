/**
 * @fileOverview 文件选择相关
 */
define([
    '../base',
    '../uploader',
    '../lib/filepicker',
    './widget'
], function( Base, Uploader, FilePicker ) {
    var $ = Base.$;

    $.extend( Uploader.options, {

        /**
         * @property {Selector | Object} [pick=undefined]
         * @namespace options
         * @for Uploader
         * @description 指定选择文件的按钮容器，不指定则不创建按钮。
         *
         * * `id` {Seletor|dom} 指定选择文件的按钮容器，不指定则不创建按钮。**注意** 这里虽然写的是 id, 但是不是只支持 id, 还支持 class, 或者 dom 节点。
         * * `label` {String} 请采用 `innerHTML` 代替
         * * `innerHTML` {String} 指定按钮文字。不指定时优先从指定的容器中看是否自带文字。
         * * `multiple` {Boolean} 是否开起同时选择多个文件能力。
         */
        pick: null,

        /**
         * @property {Arroy} [accept=null]
         * @namespace options
         * @for Uploader
         * @description 指定接受哪些类型的文件。 由于目前还有ext转mimeType表，所以这里需要分开指定。
         *
         * * `title` {String} 文字描述
         * * `extensions` {String} 允许的文件后缀，不带点，多个用逗号分割。
         * * `mimeTypes` {String} 多个用逗号分割。
         *
         * 如：
         *
         * ```
         * {
         *     title: 'Images',
         *     extensions: 'gif,jpg,jpeg,bmp,png',
         *     mimeTypes: 'image/*'
         * }
         * ```
         */
        accept: null/*{
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }*/
    });

    return Uploader.register({
        name: 'picker',

        init: function( opts ) {
            this.pickers = [];
            return opts.pick && this.addBtn( opts.pick );
        },

        refresh: function() {
            $.each( this.pickers, function() {
                this.refresh();
            });
        },

        /**
         * @method addButton
         * @for Uploader
         * @grammar addButton( pick ) => Promise
         * @description
         * 添加文件选择按钮，如果一个按钮不够，需要调用此方法来添加。参数跟[options.pick](#WebUploader:Uploader:options)一致。
         * @example
         * uploader.addButton({
         *     id: '#btnContainer',
         *     innerHTML: '选择文件'
         * });
         */
        addBtn: function( pick ) {
            var me = this,
                opts = me.options,
                accept = opts.accept,
                promises = [];

            if ( !pick ) {
                return;
            }

            $.isPlainObject( pick ) || (pick = {
                id: pick
            });

            $( pick.id ).each(function() {
                var options, picker, deferred;

                deferred = Base.Deferred();

                options = $.extend({}, pick, {
                    accept: $.isPlainObject( accept ) ? [ accept ] : accept,
                    swf: opts.swf,
                    runtimeOrder: opts.runtimeOrder,
                    id: this
                });

                picker = new FilePicker( options );

                picker.once( 'ready', deferred.resolve );
                picker.on( 'select', function( files ) {
                    me.owner.request( 'add-file', [ files ]);
                });
                picker.init();

                me.pickers.push( picker );

                promises.push( deferred.promise() );
            });

            return Base.when.apply( Base, promises );
        },

        disable: function() {
            $.each( this.pickers, function() {
                this.disable();
            });
        },

        enable: function() {
            $.each( this.pickers, function() {
                this.enable();
            });
        },

        destroy: function() {
            $.each( this.pickers, function() {
                this.destroy();
            });
            this.pickers = null;
        }
    });
});