/**
 * @fileOverview 文件队列
 */
define( 'webuploader/core/queue', [
        'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/error',
        'webuploader/core/file'
	], function( Base, Mediator, Error, WUFile ) {

        var $ = Base.$,
            STATUS = WUFile.Status;

        /**
         * 文件队列
         *
         * @class  Queue
         * @constructor
         */
        function Queue() {

            this.stats = {
                numOfQueue: 0,
                numOfQueueFailed: 0,
                numOfSuccess: 0,
                numOfCancel: 0,
                numOfProgress: 0,
                numOfUploadFailed: 0,
                numOfInvalid: 0
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
             * @param  {Mixed} [source] 文件内容源，例如DOM File/Blob/Base64 String
             *                          文件首次加入队列时必须携带该参数
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
             * @param  {Mixed} [source] 文件内容源，例如DOM File/Blob/Base64 String
             *                          文件首次加入队列时必须携带该参数
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
             */
            fetch: function( status ) {
                var len = this._queue.length,
                    i, file;

                status = STATUS.QUEUED;

                for( i = 0; i < len; i++ ) {
                    file = this._queue[ i ];

                    if ( status === file.getStatus() ) {
                        return file;
                    }
                }

                return null;
            },

            // 获取指定类型的文件列表
            getFiles: function(/*status1, status2...*/) {
                var sts = [].slice.call( arguments, 0 ),
                    ret = [],
                    i = 0,
                    len = this._queue.length,
                    file;

                for( ; i < len; i++ ) {
                    file = this._queue[ i ];

                    if ( sts.length && !~sts.indexOf( file.getStatus() ) ) {
                        continue;
                    }

                    ret.push( file );
                }

                return ret;
            },

            _fileAdded: function( file ) {
                var me = this,
                    existing = this._map[ file.id ];

                if ( !existing ) {
                    this._map[ file.id ] = file;

                    file.on( 'statuschange', function( cur, pre ) {
                        me._onFileStatusChange( cur, pre );
                    } );
                }

                file.setStatus( STATUS.QUEUED );
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
                        status.numOfInvalid++;
                        break;
                }
            }

        } );

        Mediator.installTo( Queue.prototype );

        return Queue;
    }
);