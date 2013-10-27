/**
 * @fileOverview Uploader上传类
 * @import base.js, core/mediator.js
 */
define( 'webuploader/core/uploader', [ 'webuploader/base',
        'webuploader/core/mediator'
        ], function( Base, Mediator, Runtime ) {

    var $ = Base.$;

    function Uploader( opts ) {
        this.options = $.extend( true, {}, Uploader.options, opts );
        this._init( this.options );
    }

    // default Options
    Uploader.options = {
        accept: [{
            title: 'Images',
            extensions: 'gif,jpg,bmp,png',
            mimeTypes: 'image/*'
        }]
    };
    Mediator.installTo( Uploader.prototype );

    $.extend( Uploader.prototype, {
        state: 'pending',

        _init: function( opts ) {
            var me = this;

            me.request( 'init', opts, function() {
                me.state = 'ready';
                me.trigger( 'ready' );
            });
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
            return this.request( 'add-btn', arguments );
        },

        makeThumb: function( file, cb, width, height ) {
            return this.request( 'make-thumb', arguments );
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

        request: Base.noop,

        reset: function() {
            // todo
        }

    } );

    Base.create = function( opts ) {
        return new Uploader( opts );
    };

    return Uploader;
} );
