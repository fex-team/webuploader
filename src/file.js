/**
 * @fileOverview 文件属性封装
 */
define([
    './base',
    './mediator'
], function( Base, Mediator ) {

    var $ = Base.$,
        idPrefix = 'WU_FILE_',
        idSuffix = 0,
        rExt = /\.([^.]+)$/,
        statusMap = {};

    function gid() {
        return idPrefix + idSuffix++;
    }

    /**
     * 文件类
     * @class File
     * @constructor 构造函数
     * @grammar new File( source ) => File
     * @param {Lib.File} source [lib.File](#Lib.File)实例, 此source对象是带有Runtime信息的。
     */
    function WUFile( source ) {

        /**
         * 文件名，包括扩展名（后缀）
         * @property name
         * @type {string}
         */
        this.name = source.name || 'Untitled';

        /**
         * 文件体积（字节）
         * @property size
         * @type {uint}
         * @default 0
         */
        this.size = source.size || 0;

        /**
         * 文件MIMETYPE类型，与文件类型的对应关系请参考[http://t.cn/z8ZnFny](http://t.cn/z8ZnFny)
         * @property type
         * @type {string}
         * @default 'application/octet-stream'
         */
        this.type = source.type || 'application/octet-stream';

        /**
         * 文件最后修改日期
         * @property lastModifiedDate
         * @type {int}
         * @default 当前时间戳
         */
        this.lastModifiedDate = source.lastModifiedDate || (new Date() * 1);

        /**
         * 文件ID，每个对象具有唯一ID，与文件名无关
         * @property id
         * @type {string}
         */
        this.id = gid();

        /**
         * 文件扩展名，通过文件名获取，例如test.png的扩展名为png
         * @property ext
         * @type {string}
         */
        this.ext = rExt.exec( this.name ) ? RegExp.$1 : '';


        /**
         * 状态文字说明。在不同的status语境下有不同的用途。
         * @property statusText
         * @type {string}
         */
        this.statusText = '';

        // 存储文件状态，防止通过属性直接修改
        statusMap[ this.id ] = WUFile.Status.INITED;

        this.source = source;
        this.loaded = 0;

        this.on( 'error', function( msg ) {
            this.setStatus( WUFile.Status.ERROR, msg );
        });
    }

    $.extend( WUFile.prototype, {

        /**
         * 设置状态，状态变化时会触发`change`事件。
         * @method setStatus
         * @grammar setStatus( status[, statusText] );
         * @param {File.Status|String} status [文件状态值](#WebUploader:File:File.Status)
         * @param {String} [statusText=''] 状态说明，常在error时使用，用http, abort,server等来标记是由于什么原因导致文件错误。
         */
        setStatus: function( status, text ) {

            var prevStatus = statusMap[ this.id ];

            typeof text !== 'undefined' && (this.statusText = text);

            if ( status !== prevStatus ) {
                statusMap[ this.id ] = status;
                /**
                 * 文件状态变化
                 * @event statuschange
                 */
                this.trigger( 'statuschange', status, prevStatus );
            }

        },

        /**
         * 获取文件状态
         * @return {File.Status}
         * @example
                 文件状态具体包括以下几种类型：
                 {
                     // 初始化
                    INITED:     0,
                    // 已入队列
                    QUEUED:     1,
                    // 正在上传
                    PROGRESS:     2,
                    // 上传出错
                    ERROR:         3,
                    // 上传成功
                    COMPLETE:     4,
                    // 上传取消
                    CANCELLED:     5
                }
         */
        getStatus: function() {
            return statusMap[ this.id ];
        },

        /**
         * 获取文件原始信息。
         * @return {*}
         */
        getSource: function() {
            return this.source;
        },

        destroy: function() {
            this.off();
            delete statusMap[ this.id ];
        }
    });

    Mediator.installTo( WUFile.prototype );

    /**
     * 文件状态值，具体包括以下几种类型：
     * * `inited` 初始状态
     * * `queued` 已经进入队列, 等待上传
     * * `progress` 上传中
     * * `complete` 上传完成。
     * * `error` 上传出错，可重试
     * * `interrupt` 上传中断，可续传。
     * * `invalid` 文件不合格，不能重试上传。会自动从队列中移除。
     * * `cancelled` 文件被移除。
     * @property {Object} Status
     * @namespace File
     * @class File
     * @static
     */
    WUFile.Status = {
        INITED:     'inited',    // 初始状态
        QUEUED:     'queued',    // 已经进入队列, 等待上传
        PROGRESS:   'progress',    // 上传中
        ERROR:      'error',    // 上传出错，可重试
        COMPLETE:   'complete',    // 上传完成。
        CANCELLED:  'cancelled',    // 上传取消。
        INTERRUPT:  'interrupt',    // 上传中断，可续传。
        INVALID:    'invalid'    // 文件不合格，不能重试上传。
    };

    return WUFile;
});
