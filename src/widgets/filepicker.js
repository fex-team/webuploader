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
         * * `id` {Seletor} 指定选择文件的按钮容器，不指定则不创建按钮。
         * * `label` {String} 指定按钮文字。不指定时优先从指定的容器中看是否自带文字。
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
        'add-btn': 'addButton',
        refresh: 'refresh',
        disable: 'disable',
        enable: 'enable'
    }, {

        init: function( opts ) {
            this.pickers = [];
            return opts.pick && this.addButton( opts.pick );
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
         *     label: '选择文件'
         * });
         */
        addButton: function( pick ) {
            var me = this,
                opts = me.options,
                accept = opts.accept,
                options, picker, deferred;

            if ( !pick ) {
                return;
            }

            deferred = Base.Deferred();
            $.isPlainObject( pick ) || (pick = {
                id: pick
            });

            options = $.extend({}, pick, {
                accept: $.isPlainObject( accept ) ? [ accept ] : accept,
                swf: opts.swf,
                runtimeOrder: opts.runtimeOrder
            });

            picker = new FilePicker( options );

            picker.once( 'ready', deferred.resolve );
            picker.on( 'select', function( files ) {
                me.owner.request( 'add-file', [ files ]);
            });
            picker.init();

            this.pickers.push( picker );

            return deferred.promise();
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
        }
    });
});