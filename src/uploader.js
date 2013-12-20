/**
 * @fileOverview Uploader上传类
 */
define([
    './base',
    './mediator'
], function( Base, Mediator ) {

    var $ = Base.$;

    /**
     * 上传入口类。
     * @class Uploader
     * @constructor 构造器，用来初始化一个Uploader实例。
     * @grammar new Uploader( opts ) => Uploader
     */
    function Uploader( opts ) {
        this.options = $.extend( true, {}, Uploader.options, opts );
        this._init( this.options );
    }

    // default Options
    // widgets中有相应扩展
    Uploader.options = {};
    Mediator.installTo( Uploader.prototype );

    // 批量添加纯命令式方法。
    $.each({
        upload: 'start-upload',
        stop: 'stop-upload',
        getFile: 'get-file',
        getFiles: 'get-files',
        // addFile: 'add-file',
        // addFiles: 'add-file',
        removeFile: 'remove-file',
        skipFile: 'skip-file',
        retry: 'retry',
        isInProgress: 'is-in-progress',
        makeThumb: 'make-thumb',
        getDimension: 'get-dimension',
        addButton: 'add-btn',
        getRuntimeType: 'get-runtime-type',
        refresh: 'refresh',
        disable: 'disable',
        enable: 'enable'
    }, function( fn, command ) {
        Uploader.prototype[ fn ] = function() {
            return this.request( command, arguments );
        };
    });

    $.extend( Uploader.prototype, {
        state: 'pending',

        _init: function( opts ) {
            var me = this;

            me.request( 'init', opts, function() {
                me.state = 'ready';
                me.trigger('ready');
            });
        },

        /**
         * 获取或者设置Uploader配置项。
         * @method option
         * @grammar option( key ) => *
         * @grammar option( key, val ) => self
         * @example
         *
         * // 初始状态图片上传前不会压缩
         * var uploader = new WebUploader.Uploader({
         *     resize: null;
         * });
         *
         * // 修改后图片上传前，尝试将图片压缩到1600 * 1600
         * uploader.options( 'resize', {
         *     width: 1600,
         *     height: 1600
         * });
         */
        option: function( key, val ) {
            var opts = this.options;

            // setter
            if ( arguments.length > 1 ) {

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

        /**
         * 获取文件统计信息。返回一个包含一下信息的对象。
         * * `successNum` 上传成功的文件数
         * * `uploadFailNum` 上传失败的文件数
         * * `cancelNum` 被删除的文件数
         * * `invalidNum` 无效的文件数
         * * `queueNum` 还在队列中的文件数
         * @method getStats
         * @grammar getStats() => Object
         */
        getStats: function() {
            // return this._mgr.getStats.apply( this._mgr, arguments );
            var stats = this.request('get-stats');

            return {
                successNum: stats.numOfSuccess,

                // who care?
                // queueFailNum: 0,
                cancelNum: stats.numOfCancel,
                invalidNum: stats.numOfInvalid,
                uploadFailNum: stats.numOfUploadFailed,
                queueNum: stats.numOfQueue
            };
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

        /**
         * @method request
         * @grammar request( command, args ) => * | Promise
         * @grammar request( command, args, callback ) => Promise
         */
        request: Base.noop,

        reset: function() {
            // @todo
        }
    });

    Base.create = function( opts ) {
        return new Uploader( opts );
    };

    // 暴露Uploader，可以通过它来扩展业务逻辑。
    Base.Uploader = Uploader;

    return Uploader;
});