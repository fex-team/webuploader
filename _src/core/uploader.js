/**
 * @fileOverview Uploader上传类
 */
define( 'webuploader/core/uploader', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/uploadmgr',
        'webuploader/core/runtime'
        ], function( Base, Mediator, UploadMgr, Runtime ) {

    var $ = Base.$,
        defaultOpts = {
            threads: 3,
            compress: true,
            server: '../server/fileupload.php',
            pick: {
                multiple: true,
                id: 'uploaderBtn'
            },
            accept: [{
                title: 'image',
                extensions: 'gif,jpg,jpeg,bmp,png'
            }],
            dnd: '',
            paste: '',
            fileSizeLimit: 0,
            fileNumLimit: 0,
            duplicate: false,
            resize: {
                width: 1600,
                height: 1600,
                quality: 90
            }
        };

    function Uploader( opts ) {
        this.options = $.extend( true, {}, defaultOpts, opts || {} );
        this._connectRuntime( this.options, Base.bindFn( this._init, this ) );
        Mediator.trigger( 'uploaderInit', this );
    }

    Uploader.defaultOptions = defaultOpts;
    Mediator.installTo( Uploader.prototype );

    $.extend( Uploader.prototype, {
        state: 'pedding',

        _init: function() {
            var me = this,
                opts = this.options;

            opts.pick && me.addButton( opts.pick );
            opts.dnd && me._initDnd( opts );
            opts.paste && me._initFilePaste( opts );

            me._initNetWorkDetect();

            me._mgr = UploadMgr( opts, me._runtime );

            // 转发所有的事件出去。
            me._mgr.on( 'all', function() {
                return me.trigger.apply( me, arguments );
            });

            me.state = 'inited';
            me.trigger( 'ready' );
        },

        _initDnd: function( opts ) {
            var me = this,
                options = $.extend( {}, {
                    id: opts.dnd,
                    accept: opts.accept
                } ),
                Dnd = me._runtime.getComponent( 'Dnd' ),
                dnd;

            dnd = new Dnd( options );

            dnd.on( 'drop', function( files ) {
                me.addFiles( files );
            } );
            dnd.init();
        },

        _initFilePaste: function( opts ) {
            var runtime = Runtime.getInstance(),
                me = this,
                options = $.extend( {}, {
                    id: opts.paste,
                    accept: opts.accept
                } ),
                FilePaste = runtime.getComponent( 'FilePaste' ),
                paste;

            paste = new FilePaste( options );

            paste.on( 'paste', function( files ) {
                me.addFiles( files );
            } );
            paste.init();
        },

        _initNetWorkDetect: function() {
            var me = this,
                Network = me._runtime.getComponent( 'Network' );

            Network.getInstance().on( 'all', function() {
                return me.trigger.apply( me, arguments );
            } );
        },

        // todo 根据opts，告诉runtime需要具备哪些能力
        _connectRuntime: function( opts, cb ) {
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

        option: function( key, val ) {
            var opts = this.options;
            if ( arguments.length > 1 ) {    // setter
                if ( $.isPlainObject( val ) &&
                        $.isPlainObject( opts[ key ] ) ) {
                    $.extend( opts[ key ], val );
                } else {
                    opts[ key ] = val;
                }
            } else {    // getter
                return key ? opts[ key ] : opts;
            }
        },

        addButton: function( pick ) {
            if ( typeof pick === 'string' ) {
                pick = {
                    id: pick
                };
            }

            var me = this,
                opts = me.options,
                options = $.extend( {}, pick, {
                    accept: opts.accept
                } ),
                FilePicker = me._runtime.getComponent( 'FilePicker' ),
                picker;

            picker = new FilePicker( options );

            picker.on( 'select', function( files ) {
                me.addFiles( files );
            } );
            picker.init();
        },

        makeThumb: function( file, cb, width, height, type, quality ) {
            var runtime = this._runtime,
                Image = runtime.getComponent( 'Image' );

            file = this.getFile( file );

            // 只预览图片格式。
            if ( !file.type.match( /^image/ ) ) {
                cb( true );
                return;
            }

            Image.makeThumbnail( file.getSource(), cb, width, height,
                    true, type, quality );
        },

        formatSize: function( size, pointLength ) {
            var units = [ 'B', 'K', 'M', 'G', 'TB' ],
                unit = units.shift();

            while ( size > 1024 && units.length ) {
                unit = units.shift();
                size = size / 1024;
            }

            return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                    unit;
        },

        // ----------------------------------------------
        // 中转到uploadMgr中去。
        // ----------------------------------------------

        /**
         * 开始上传
         * @method upload
         */
        upload: function() {
            return this._mgr.start.apply( this._mgr, arguments );
        },

        stop: function() {
            return this._mgr.stop.apply( this._mgr, arguments );
        },

        getFile: function() {
            return this._mgr.getFile.apply( this._mgr, arguments );
        },

        addFile: function() {
            return this._mgr.addFile.apply( this._mgr, arguments );
        },

        addFiles: function() {
            return this._mgr.addFiles.apply( this._mgr, arguments );
        },

        removeFile: function() {
            return this._mgr.removeFile.apply( this._mgr, arguments );
        },

        getStats: function() {
            return this._mgr.getStats.apply( this._mgr, arguments );
        },

        retry: function() {
            return this._mgr.retry.apply( this._mgr, arguments );
        },

        getFiles: function() {
            return this._mgr.getFiles.apply( this._mgr, arguments );
        },

        isInProgress: function() {
            return this._mgr.isInProgress.apply( this._mgr, arguments );
        },

        // 需要重写此方法来来支持opts.onEvent和instance.onEvent的处理器
        trigger: function( type/*, args...*/ ) {
            var args = [].slice.call( arguments, 1 ),
                opts = this.options,
                name = 'on' + type.substring( 0, 1 ).toUpperCase() +
                    type.substring( 1 );

            if ( Mediator.trigger.apply( this, arguments ) === false ) {
                return false;
            }

            if ( $.isFunction( opts[ name ] ) &&
                    opts[ name ].apply( this, args ) === false ) {
                return false;
            }

            if ( $.isFunction( this[ name ] ) &&
                    this[ name ].apply( this, args ) === false ) {
                return false;
            }

            return true;
        },

        reset: function() {
            // todo
        }

    } );

    Base.create = function( opts ) {
        return new Uploader( opts );
    };

    return Uploader;
} );
