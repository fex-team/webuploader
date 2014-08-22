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
     * @constructor
     * @grammar new Uploader( opts ) => Uploader
     * @example
     * var uploader = WebUploader.Uploader({
     *     swf: 'path_of_swf/Uploader.swf',
     *
     *     // 开起分片上传。
     *     chunked: true
     * });
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
        addFile: 'add-file',
        addFiles: 'add-file',
        sort: 'sort-files',
        removeFile: 'remove-file',
        cancelFile: 'cancel-file',
        skipFile: 'skip-file',
        retry: 'retry',
        isInProgress: 'is-in-progress',
        makeThumb: 'make-thumb',
        md5File: 'md5-file',
        getDimension: 'get-dimension',
        addButton: 'add-btn',
        predictRuntimeType: 'predict-runtime-type',
        refresh: 'refresh',
        disable: 'disable',
        enable: 'enable',
        reset: 'reset'
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
         *     compress: null;
         * });
         *
         * // 修改后图片上传前，尝试将图片压缩到1600 * 1600
         * uploader.option( 'compress', {
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
         * * `progressNum` 上传中的文件数
         * * `cancelNum` 被删除的文件数
         * * `invalidNum` 无效的文件数
         * * `uploadFailNum` 上传失败的文件数
         * * `queueNum` 还在队列中的文件数
         * * `interruptNum` 被暂停的文件数
         * @method getStats
         * @grammar getStats() => Object
         */
        getStats: function() {
            // return this._mgr.getStats.apply( this._mgr, arguments );
            var stats = this.request('get-stats');

            return stats ? {
                successNum: stats.numOfSuccess,
                progressNum: stats.numOfProgress,

                // who care?
                // queueFailNum: 0,
                cancelNum: stats.numOfCancel,
                invalidNum: stats.numOfInvalid,
                uploadFailNum: stats.numOfUploadFailed,
                queueNum: stats.numOfQueue,
                interruptNum: stats.numofInterrupt
            } : {};
        },

        // 需要重写此方法来来支持opts.onEvent和instance.onEvent的处理器
        trigger: function( type/*, args...*/ ) {
            var args = [].slice.call( arguments, 1 ),
                opts = this.options,
                name = 'on' + type.substring( 0, 1 ).toUpperCase() +
                    type.substring( 1 );

            if (
                    // 调用通过on方法注册的handler.
                    Mediator.trigger.apply( this, arguments ) === false ||

                    // 调用opts.onEvent
                    $.isFunction( opts[ name ] ) &&
                    opts[ name ].apply( this, args ) === false ||

                    // 调用this.onEvent
                    $.isFunction( this[ name ] ) &&
                    this[ name ].apply( this, args ) === false ||

                    // 广播所有uploader的事件。
                    Mediator.trigger.apply( Mediator,
                    [ this, type ].concat( args ) ) === false ) {

                return false;
            }

            return true;
        },

        /**
         * 销毁 webuploader 实例
         * @method destroy
         * @grammar destroy() => undefined
         */
        destroy: function() {
            this.request( 'destroy', arguments );
            this.off();
        },

        // widgets/widget.js将补充此方法的详细文档。
        request: Base.noop
    });

    /**
     * 创建Uploader实例，等同于new Uploader( opts );
     * @method create
     * @class Base
     * @static
     * @grammar Base.create( opts ) => Uploader
     */
    Base.create = Uploader.create = function( opts ) {
        return new Uploader( opts );
    };

    // 暴露Uploader，可以通过它来扩展业务逻辑。
    Base.Uploader = Uploader;

    return Uploader;
});