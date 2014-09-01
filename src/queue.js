/**
 * @fileOverview 文件队列
 */
define([
    './base',
    './mediator',
    './file'
], function( Base, Mediator, WUFile ) {

    var $ = Base.$,
        STATUS = WUFile.Status;

    /**
     * 文件队列, 用来存储各个状态中的文件。
     * @class Queue
     * @extends Mediator
     */
    function Queue() {

        /**
         * 统计文件数。
         * * `numOfQueue` 队列中的文件数。
         * * `numOfSuccess` 上传成功的文件数
         * * `numOfCancel` 被取消的文件数
         * * `numOfProgress` 正在上传中的文件数
         * * `numOfUploadFailed` 上传错误的文件数。
         * * `numOfInvalid` 无效的文件数。
         * * `numofDeleted` 被移除的文件数。
         * @property {Object} stats
         */
        this.stats = {
            numOfQueue: 0,
            numOfSuccess: 0,
            numOfCancel: 0,
            numOfProgress: 0,
            numOfUploadFailed: 0,
            numOfInvalid: 0,
            numofDeleted: 0,
            numofInterrupt: 0
        };

        // 上传队列，仅包括等待上传的文件
        this._queue = [];

        // 存储所有文件
        this._map = {};
    }

    $.extend( Queue.prototype, {

        /**
         * 将新文件加入对队列尾部
         *
         * @method append
         * @param  {File} file   文件对象
         */
        append: function( file ) {
            this._queue.push( file );
            this._fileAdded( file );
            return this;
        },

        /**
         * 将新文件加入对队列头部
         *
         * @method prepend
         * @param  {File} file   文件对象
         */
        prepend: function( file ) {
            this._queue.unshift( file );
            this._fileAdded( file );
            return this;
        },

        /**
         * 获取文件对象
         *
         * @method getFile
         * @param  {String} fileId   文件ID
         * @return {File}
         */
        getFile: function( fileId ) {
            if ( typeof fileId !== 'string' ) {
                return fileId;
            }
            return this._map[ fileId ];
        },

        /**
         * 从队列中取出一个指定状态的文件。
         * @grammar fetch( status ) => File
         * @method fetch
         * @param {String} status [文件状态值](#WebUploader:File:File.Status)
         * @return {File} [File](#WebUploader:File)
         */
        fetch: function( status ) {
            var len = this._queue.length,
                i, file;

            status = status || STATUS.QUEUED;

            for ( i = 0; i < len; i++ ) {
                file = this._queue[ i ];

                if ( status === file.getStatus() ) {
                    return file;
                }
            }

            return null;
        },

        /**
         * 对队列进行排序，能够控制文件上传顺序。
         * @grammar sort( fn ) => undefined
         * @method sort
         * @param {Function} fn 排序方法
         */
        sort: function( fn ) {
            if ( typeof fn === 'function' ) {
                this._queue.sort( fn );
            }
        },

        /**
         * 获取指定类型的文件列表, 列表中每一个成员为[File](#WebUploader:File)对象。
         * @grammar getFiles( [status1[, status2 ...]] ) => Array
         * @method getFiles
         * @param {String} [status] [文件状态值](#WebUploader:File:File.Status)
         */
        getFiles: function() {
            var sts = [].slice.call( arguments, 0 ),
                ret = [],
                i = 0,
                len = this._queue.length,
                file;

            for ( ; i < len; i++ ) {
                file = this._queue[ i ];

                if ( sts.length && !~$.inArray( file.getStatus(), sts ) ) {
                    continue;
                }

                ret.push( file );
            }

            return ret;
        },

        /**
         * 在队列中删除文件。
         * @grammar removeFile( file ) => Array
         * @method removeFile
         * @param {File} 文件对象。
         */
        removeFile: function( file ) {
            var me = this,
                existing = this._map[ file.id ];

            if ( existing ) {
                delete this._map[ file.id ];
                file.destroy();
                this.stats.numofDeleted++;
            }
        },

        _fileAdded: function( file ) {
            var me = this,
                existing = this._map[ file.id ];

            if ( !existing ) {
                this._map[ file.id ] = file;

                file.on( 'statuschange', function( cur, pre ) {
                    me._onFileStatusChange( cur, pre );
                });
            }
        },

        _onFileStatusChange: function( curStatus, preStatus ) {
            var stats = this.stats;

            switch ( preStatus ) {
                case STATUS.PROGRESS:
                    stats.numOfProgress--;
                    break;

                case STATUS.QUEUED:
                    stats.numOfQueue --;
                    break;

                case STATUS.ERROR:
                    stats.numOfUploadFailed--;
                    break;

                case STATUS.INVALID:
                    stats.numOfInvalid--;
                    break;

                case STATUS.INTERRUPT:
                    stats.numofInterrupt--;
                    break;
            }

            switch ( curStatus ) {
                case STATUS.QUEUED:
                    stats.numOfQueue++;
                    break;

                case STATUS.PROGRESS:
                    stats.numOfProgress++;
                    break;

                case STATUS.ERROR:
                    stats.numOfUploadFailed++;
                    break;

                case STATUS.COMPLETE:
                    stats.numOfSuccess++;
                    break;

                case STATUS.CANCELLED:
                    stats.numOfCancel++;
                    break;


                case STATUS.INVALID:
                    stats.numOfInvalid++;
                    break;

                case STATUS.INTERRUPT:
                    stats.numofInterrupt++;
                    break;
            }
        }

    });

    Mediator.installTo( Queue.prototype );

    return Queue;
});