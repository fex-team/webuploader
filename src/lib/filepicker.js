/**
 * @fileOverview 错误信息
 */
define([
    '../base',
    '../runtime/client',
    './file',
    './image'
], function( Base, RuntimeClent, File, Image ) {

    var $ = Base.$;

    function FilePicker( opts ) {
        opts = this.options = $.extend({}, FilePicker.options, opts );

        opts.container = $( opts.id );

        if ( !opts.container.length ) {
            throw new Error('按钮指定错误');
        }

        opts.innerHTML = opts.innerHTML || opts.label ||
                opts.container.html() || '';

        opts.button = $( opts.button || document.createElement('div') );
        opts.button.html( opts.innerHTML );
        opts.container.html( opts.button );

        RuntimeClent.call( this, 'FilePicker', true );
    }

    FilePicker.options = {
        button: null,
        container: null,
        label: null,
        innerHTML: null,
        multiple: true,
        accept: null,
        name: 'file'
    };

    Base.inherits( RuntimeClent, {
        constructor: FilePicker,

        init: function() {
            var me = this,
                opts = me.options,
                button = opts.button;

            button.addClass('webuploader-pick');

            me.on( 'all', function( type ) {
                var files, length;

                switch ( type ) {
                    case 'mouseenter':
                        button.addClass('webuploader-pick-hover');
                        break;

                    case 'mouseleave':
                        button.removeClass('webuploader-pick-hover');
                        break;

                    case 'change':
                        length = 0;
                        files = me.exec('getFiles');
                        files = $.map( files, function( file ) {
                            file = new File( me.getRuid(), file );

                            // 记录来源。
                            file._refer = opts.container;
                            
                            // 获取宽高
                            if (opts.imageSize 
                                && ~'image/jpeg,image/jpg,image/png,image/bmp,image/gif'.indexOf(file.type)) {
                                var image = new Image( opts.compress||opts.resize );
                                image.on('load', function(){
                                    var info = image.info();
                                    file.width  = info.width;
                                    file.height = info.height;
                                    length ++;
                                    (length == files.length) && me.trigger( 'select', files, opts.container );
                                });
                                image.on('error', function(){
                                    length ++;
                                    (length == files.length) && me.trigger( 'select', files, opts.container );
                                });
                                image.loadFromBlob( file );
                            } else {
                                length ++;
                            }
                            
                            return file;
                        });
                        (length == files.length) && me.trigger( 'select', files, opts.container );
                        break;
                }
            });

            me.connectRuntime( opts, function() {
                me.refresh();
                me.exec( 'init', opts );
                me.trigger('ready');
            });

            this._resizeHandler = Base.bindFn( this.refresh, this );
            $( window ).on( 'resize', this._resizeHandler );
        },

        refresh: function() {
            var shimContainer = this.getRuntime().getContainer(),
                button = this.options.button,
                width = button.outerWidth ?
                        button.outerWidth() : button.width(),

                height = button.outerHeight ?
                        button.outerHeight() : button.height(),

                pos = button.offset();

            width && height && shimContainer.css({
                bottom: 'auto',
                right: 'auto',
                width: width + 'px',
                height: height + 'px'
            }).offset( pos );
        },

        enable: function() {
            var btn = this.options.button;

            btn.removeClass('webuploader-pick-disable');
            this.refresh();
        },

        disable: function() {
            var btn = this.options.button;

            this.getRuntime().getContainer().css({
                top: '-99999px'
            });

            btn.addClass('webuploader-pick-disable');
        },

        destroy: function() {
            var btn = this.options.button;
            $( window ).off( 'resize', this._resizeHandler );
            btn.removeClass('webuploader-pick-disable webuploader-pick-hover ' +
                'webuploader-pick');
        }
    });

    return FilePicker;
});
