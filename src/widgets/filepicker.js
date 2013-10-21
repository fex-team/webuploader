/**
 * @fileOverview 组件基类。
 * @import widget.js
 */
define( 'webuploader/widgets/filepicker', [ 
    'webuploader/base',
    'webuploader/core/uploader' ], function( 
        Base, Uploader ) {

    var $ = Base.$;

    return Uploader.register({
        init: function() {
            this.addButton( this.options.pick );
        },
        addButton: function( pick ) {
            var me = this,
                opts = me.options,
                FilePicker,
                options,
                picker;

            if ( !pick ) {
                return;
            }

            if ( typeof pick === 'string' ) {
                pick = {
                    id: pick
                };
            }

            options = $.extend( {}, pick, {
                accept: opts.accept
            } );
                
            FilePicker = me.runtime.getComponent( 'FilePicker' ),

            picker = new FilePicker( options );

            picker.on( 'select', function( files ) {
                me.owner.trigger( 'filesin', files );
            } );
            picker.init();
        }
    }, {
        'add-btn': 'addButton'
    });
    
} );