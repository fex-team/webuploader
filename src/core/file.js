/**
 * @fileOverview 文件属性封装
 */
define( 'webuploader/core/file', [
        'webuploader/base',
        'webuploader/core/mediator'
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
         * 构造函数
         * @class 文件
         * @constructor File
         * @param {DOMFile|Object} domfile     HTML5 File对象或者自定义对象
         */
        function WUFile( file ) {

            if ( !file || !('name' in file) ) {
                throw new Error( 'File构造函数参数错误!' );
            }

            /**
             * 文件名，包括扩展名
             * @property name
             * @type {string}
             */
            this.name = file.name;

            /**
             * 文件体积（字节）
             * @property size
             * @type {int}
             * @default 0
             */
            this.size = file.size || 0;

            /**
             * 文件MIMETYPE类型，与文件类型的对应关系请参考 http://t.cn/z8ZnFny
             * @property type
             * @type {string}
             * @default ''
             */
            this.type = file.type || '';

            /**
             * 文件最后修改日期
             * @property lastModifiedDate
             * @type {int}
             * @default 当前时间戳
             */
            this.lastModifiedDate = file.lastModifiedDate || (new Date() * 1);

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
            this.ext = rExt.exec( file.name ) ? RegExp.$1 : '';

            /**
             * 文件上传成功后对应的服务器端URL
             * @property url
             * @type {string}
             * @default ''
             */
            // this.url = '';

            // 存储文件状态，防止通过属性直接修改
            statusMap[ this.id ] = WUFile.Status.INITED;

            this.source = file;
        }

        $.extend( WUFile.prototype, {

            /**
             * 设置状态，状态变化时会触发`change`事件。
             *
             * @method setStatus
             * @param  {File.Status} status 状态
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
            setStatus: function( status ) {

                var prevStatus = statusMap[ this.id ];

                if ( status !== prevStatus ) {
                    statusMap[ this.id ] = status;
                    /**
                     * 文件状态变化
                     * @event statuschange
                     */
                    this.trigger( 'statuschange', this, status, prevStatus );
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

            destory: function() {
                delete statusMap[ this.id ];
            }
        } );

        Mediator.installTo( WUFile.prototype );

        WUFile.Status = {
            INITED:     0,
            QUEUED:     1,
            PROGRESS:   2,
            ERROR:      3,
            COMPLETE:   4,
            CANCELLED:  5
        };

        return WUFile;
    }
);