/**
 * @fileOverview 错误信息
 * @import base.js, runtime/client.js, lib/file.js
 */
define( 'webuploader/lib/filepicker', [ 'webuploader/base',
        'webuploader/runtime/client',
        'webuploader/lib/file'
        ], function( Base, RuntimeClent, File ) {

    var $ = Base.$;

    function FilePicker( opts ) {
        opts = this.options = $.extend( {}, FilePicker.options, opts );

        opts.button = $( opts.id );

        if ( !opts.button.length ) {
            throw new Error( '按钮指定错误' );
        }

        opts.container = opts.container || opts.button.parent();
        opts.container.css( 'position', 'relative' );

        opts.label = opts.label || opts.container.text();
        opts.button.text( opts.label );

        RuntimeClent.call( this, 'FilePicker', true );
    }

    FilePicker.options = {
        button: null,
        container: null,
        label: '选择文件',
        multiple: true,
        accept: [{
            title: 'Images',
            extensions: 'gif,jpg,bmp,png',
            mimeTypes: 'image/*'
        }]
    }

    Base.inherits( RuntimeClent, {
        constructor: FilePicker,

        init: function() {
            var me = this,
                opts = me.options,
                button = opts.button;

            button.addClass( 'webuploader-pick' );

            me.on( 'all', function( type ) {
                var files;

                switch ( type ) {
                    case 'mouseenter':
                        button.addClass( 'webuploader-pick-hover');
                        break;

                    case 'mouseleave':
                        button.removeClass( 'webuploader-pick-hover' );
                        break;

                    case 'change':
                        files = me.exec( 'getFiles' );
                        me.trigger( 'select', $.map( files, function( file ) {
                            return new File( me.getRuid(), file );
                        } ));
                        break;
                }
            });

            me.connectRuntime( opts, function() {
                me.refresh();
                me.exec( 'init', opts );
            });
        },

        refresh: function() {
            var shimContainer = this.getRuntime().getContainer(),
                button = this.options.button,
                width = button.width(),
                height = button.height(),
                pos = button.position();

            shimContainer.css({
                position: 'absolute',
                width: width + 'px',
                height: height + 'px',
                left: pos.left + 'px',
                top: pos.top + 'px'
            });
        },

        destroy: function() {
            if ( this.runtime ) {
                this.exec( 'destroy' );
                this.disconnectRuntime();
            }
        }
    } );

    return FilePicker;
});