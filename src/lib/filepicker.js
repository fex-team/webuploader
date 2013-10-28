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

        opts.container = $( opts.id );

        if ( !opts.container.length ) {
            throw new Error( '按钮指定错误' );
        }

        opts.label = opts.label || opts.container.text();
        opts.button = $( document.createElement('div') );
        opts.button.text( opts.label );
        opts.container.append( opts.button );

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
                this.exec( 'destroy' );
                this.disconnectRuntime();
            }
        }
    } );

    return FilePicker;
});