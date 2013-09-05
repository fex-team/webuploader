/**
 * @fileOverview Uploader上传类
 */
define( 'webuploader/core/uploader', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/file',
        'webuploader/core/queue',
        'webuploader/core/uploadmgr',
        'webuploader/core/runtime'
        ], function( Base, Mediator, WUFile, Queue, UploadMgr, Runtime ) {

    var $ = Base.$,
        defaultOpts = {
            thread: 3,
            compress: true,
            server: '../server/fileupload.php',
            pick: {
                multiple: true,
                id: 'uploaderBtn'
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

        this._init();
    }

    Mediator.installTo( Uploader.prototype );

    $.extend( Uploader.prototype, {
        state: 'pedding',

        _init: function() {
            var me = this;

            me._queue = new Queue();
            me._queue.on( 'queued', function( file ) {
                me.trigger( 'fileQueued', file );
            } );

            me._initRuntime( me.options, function() {
                me._ready();
            } );
        },

        _ready: function() {
            var me = this,
                opts = this.options;

            opts.pick && me._initFilePicker( opts );

            me._initNetWorkDetect();

            me._mgr = UploadMgr( opts, me._queue, me._runtime );

            // 转发所有的事件出去。
            me._mgr.on( 'all', function() {
                return me.trigger.apply( me, arguments );
            });

            me.state = 'inited';
            me.trigger( 'ready' );
        },

        // todo 根据opts，告诉runtime需要具备哪些能力
        _initRuntime: function( opts, cb ) {
            var caps = {
                    resizeImage: true
                },

                runtime;

            if ( opts.pick ) {
                caps.selectFile = true;

                caps.selectMultiple = opts.pick.multiple;
            }

            $.extend( opts, { requiredCaps: caps } );
            this._runtime = runtime = Runtime.getInstance( opts );
            runtime.once( 'ready', cb );
            runtime.init();
        },

        _initFilePicker: function( opts ) {
            var runtime = Runtime.getInstance(),
                me = this,
                options = $.extend( {}, opts.pick, {
                    accept: opts.accept
                } ),
                FilePicker = runtime.getComponent( 'FilePicker' ),
                picker;

            picker = new FilePicker( options );

            picker.on( 'select', function( files ) {

                $.each( files, function( idx, domfile ) {
                    me._queue.append( new WUFile( domfile ) );
                } );

            } );
            picker.init();
        },

        _initNetWorkDetect: function() {
            var me = this,
                runtime = me._runtime,
                Network = runtime.getComponent( 'Network' ),
                detector = Network.getInstance(),
                offlineTime;

            detector.on( 'offline', function() {
                offlineTime = Date.now();
                me.trigger( 'offline' ) && me.pause( true );
            } );

            detector.on( 'online', function() {
                var now = Date.now();

                me.trigger( 'online' ) &&
                        (now - offlineTime < 2 * 60 * 1000) && me.upload();
            } );

        },

        upload: function() {
            this._mgr.start();
        },

        pause: function( interrupt ) {
            this._mgr.pause( interrupt );
        },

        getImageThumbnail: function( file, cb, width, height ) {
            var Q = this._queue,
                runtime = this._runtime,
                Image = runtime.getComponent( 'Image' );

            file = typeof file === 'string' ? Q.getFile( file ) : file;

            Image.makeThumbnail( file.getSource(), function( ret ) {
                var img = document.createElement( 'img' );
                img.src = ret;
                cb( img );
            }, width, height, true );
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
        return new Uploader( opts );
    };

    return Uploader;
} );
