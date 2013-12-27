/**
 * @fileOverview 错误信息
 */
define([
    '../base',
    '../runtime/client',
    './file'
], function( Base, RuntimeClent, File ) {

    var $ = Base.$;

    function FilePicker( opts ) {

        opts = this.options = $.extend({}, FilePicker.options, opts );
        opts.container = $( opts.id );

        if ( !opts.container.length ) {
            throw new Error('按钮指定错误');
        }

        opts.label = opts.label || opts.container.text() || '选择文件';
        opts.button = $( opts.button || document.createElement('div') );
        opts.button.text( opts.label );
        opts.container.html( opts.button );

        RuntimeClent.call( this, 'FilePicker', true );
    }

    FilePicker.options = {
        button: null,
        container: null,
        label: null,
        multiple: true,
        accept: null
    };

    Base.inherits( RuntimeClent, {
        constructor: FilePicker,

        init: function() {
            var me = this,
                opts = me.options,
                button = opts.button;

            button.addClass('webuploader-pick');

            me.on( 'all', function( type ) {
                var files;

                switch ( type ) {
                    case 'mouseenter':
                        button.addClass('webuploader-pick-hover');
                        break;

                    case 'mouseleave':
                        button.removeClass('webuploader-pick-hover');
                        break;

                    case 'change':
                        files = me.exec('getFiles');
                        me.trigger( 'select', $.map( files, function( file ) {
                            return new File( me.getRuid(), file );
                        }) );
                        break;
                }
            });

            me.connectRuntime( opts, function() {
                me.refresh();
                me.exec( 'init', opts );
            });

            $( window ).on( 'resize', function() {
                me.refresh();
            });
        },

        refresh: function() {
            var shimContainer = this.getRuntime().getContainer(),
                button = this.options.button,
                width = button.outerWidth(),
                height = button.outerHeight(),
                pos = button.offset();

            width && shimContainer.css({
                width: width + 'px',
                height: height + 'px'
            }).offset( pos );
        },

        destroy: function() {
            if ( this.runtime ) {
                this.exec('destroy');
                this.disconnectRuntime();
            }
        }
    });

    return FilePicker;
});