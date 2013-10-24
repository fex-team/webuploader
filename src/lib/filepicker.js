/**
 * @fileOverview 错误信息
 * @import base.js, core/mediator.js, runtime/client.js
 */
define( 'webuploader/lib/filepicker', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/runtime/client'
        ], function( Base, Mediator, RuntimeClent ) {

    var $ = Base.$,
        defaultOpts = {
            container: null,
            label: '选择文件',
            multiple: true,

            accept: [{
                title: 'image',
                extensions: 'gif,jpg,bmp'
            }]
        };

    function FilePicker( opts ) {
        var container;

        opts = opts || {};

        opts.container = $( opts.container );

        if ( !opts.container.length ) {
            throw new Error( '容器没有找到' );
        }

        opts.label = opts.label || opts.container.text();

        opts = this.options = $.extend( {}, defaultOpts, opts );
        RuntimeClent.call( this, opts );
    }

    Base.inherits( RuntimeClent, {
        constructor: FilePicker,

        init: function() {
            var me = this,
                args = Base.slice( arguments );

            me.connectRuntime( this.options, function() {
                me.exec( 'FilePicker', 'init', args );
            });
        },

        destroy: function() {
            if ( this.runtime ) {
                this.exec( 'FilePicker', 'destroy' );
                this.disconnectRuntime();
            }
        }
    } );

    Mediator.installTo( FilePicker.prototype );

    return FilePicker;
});