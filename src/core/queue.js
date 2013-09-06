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
                numOfUploadFailed: 0
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
             * 从队列中取出文件
             *
             * @method fetch
             * @param  {String|File} [fileId]   文件ID，如果为空则取队列首文件
             * @return {Object} 包括file和source字段
             */
            // 不能出列啊，如果文件失败了，那存在哪呢？只有文件删除了，才能出队列。
            // fetch: function( file ) {
            //     var idx = 0,
            //         id;

            //     if ( file ) {
            //         id = typeof file === 'string' ? file : file.id;

            //         $.each( this._queue, function( index, file ) {
            //             if ( file.id === id ) {
            //                 idx = index;
            //                 return false;
            //             }
            //         } );
            //     }

            //     file = this._queue.splice( idx, 1 )[ 0 ];
            //     id = file.id;

            //     this.stats.numOfQueue--;

            //     return this._all[ id ];
            // },
            //

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

            removeFile: function( file ) {
                // @todo
            },

            /**
             * 获取队列中的文件。可以指定文件状态，和最多获取的个数
             * @param  {[type]} status [description]
             * @param  {[type]} count  [description]
             * @return {[type]}        [description]
             */
            getFiles: function( status, count ) {
                var ret = [],
                    len = this._queue.length,
                    file, i;

                for( i = 0; i < len; i++ ) {
                    file = this._queue[ i ];

                    if ( file.getStatus() === status || !status ) {
                        ret.push( file );
                    }

                    if ( count && ret.length >= count ) {
                        return ret;
                    }
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

                this.trigger( 'queued', file );
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
                }
            }

        } );

        Mediator.installTo( Queue.prototype );

        return Queue;
    }
);