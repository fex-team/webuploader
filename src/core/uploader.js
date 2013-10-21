/**
 * @fileOverview Uploader上传类
 */
define( 'webuploader/core/uploader', [ 'webuploader/base',
        'webuploader/core/mediator',
        // 'webuploader/core/uploadmgr',
        'webuploader/core/runtime'
        ], function( Base, Mediator, Runtime ) {

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
            this.request( 'add-btn', arguments );
        },

        makeThumb: function( file, cb, width, height, type, quality ) {
            this.request( 'make-thumb', arguments );
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
            // return this._mgr.start.apply( this._mgr, arguments );
            return this.request( 'start-upload', arguments );
        },

        stop: function() {
            return this.request( 'stop-upload', arguments );
        },

        getFile: function() {
            // return this._mgr.getFile.apply( this._mgr, arguments );
            return this.request( 'get-file', arguments );
        },

        addFile: function() {
            return this.request( 'add-file', arguments );
        },

        addFiles: function() {
            return this.request( 'add-file', arguments );
        },

        removeFile: function() {
            return this.request( 'remove-file', arguments );
        },

        getStats: function() {
            // return this._mgr.getStats.apply( this._mgr, arguments );
            var stats = this.request( 'get-stats' );

            return {
                successNum: stats.numOfSuccess,
                queueFailNum: 0,
                cancelNum: stats.numOfCancel,
                invalidNum: stats.numOfInvalid,
                uploadFailNum: stats.numOfUploadFailed,
                queueNum: stats.numOfQueue
            };
        },

        retry: function() {
            return this.request( 'retry', arguments );
        },

        getFiles: function() {
            return this.request( 'get-files', arguments );
        },

        isInProgress: function() {
            return this.request( 'is-in-progress', arguments );;
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
