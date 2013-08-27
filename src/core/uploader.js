/**
 * @fileOverview Uploader上传类
 */
define( 'webuploader/core/uploader', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/runtime' ], function( Base, Mediator, Runtime ) {
    /* jshint camelcase: false */

    var $ = Base.$,
        defaultOpts = {
            pick: {
                multiple: true,
                id: 'uploaderBtn'
            },

            accept: {
                title: 'All Files',
                extensions: '*'
            }
        };

    function Uploader( opts ) {
        opts = opts || {};

        if ( typeof opts.pick === 'string' ) {
            opts.pick = {
                id: opts.pick
            };
        }

        this.options = $.extend( true, {}, defaultOpts, opts );
    }

    Mediator.installTo( Uploader.prototype );

    $.extend( Uploader.prototype, {
        init: function() {
            var me = this,
                opts = me.options;

            me._initRuntime( opts, function() {


                opts.pick && me._initFilePicker( opts );
            } );
        },

        _initRuntime: function( opts, cb ) {
            var caps = {

                    resize_image: true
                },

                runtime;

            if ( opts.pick ) {
                caps.select_file = true;

                caps.select_multiple = opts.pick.multiple;
            }

            runtime = Runtime.getInstance( opts, caps  );
            runtime.once( 'ready', cb );
            runtime.init();
        },

        _initFilePicker: function( opts ) {
            var runtime = Runtime.getInstance(),
                options = $.extend( {}, opts.pick, {
                    accept: opts.accept
                } ),
                FilePicker = runtime.getComponent( 'FilePicker' ),
                picker;

            picker = new FilePicker( options );

            picker.on( 'select', function( files ) {
                var Transport = runtime.getComponent( 'Transport' );

                // 添加文件到队列
                console.log( files );
                Transport.sendAsBlob( files[ 0 ], {
                    url: '../server/fileupload.php'
                } );

            } );
            picker.init();
        },


        // 需要重写此方法来来支持opts.onEvent和instance.onEvent的处理器
        trigger: function( type/*, args...*/ ) {
            var args = [].slice.call( arguments, 1 ),
                opts = this.options,
                name = 'on' + type.substring( 0, 1 ).toUpperCase() +
                    type.substring( 1 );

            if ( $.isFunction( opts[ name ] ) &&
                    opts[ name ].apply( this, args ) === false ) {
                return false;
            }

            if ( $.isFunction( this[ name ] ) &&
                    this[ name ].apply( this, args ) === false ) {
                return false;
            }

            return Mediator.trigger.apply( this, arguments );
        }

    } );

    Base.create = function( opts ) {
        var uploader = new Uploader( opts );
        uploader.init();
        return uploader;
    };

    return Uploader;
} );