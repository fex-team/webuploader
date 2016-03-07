/**
 * @fileOverview 队列
 */
define([
    '../base',
    '../uploader',
    '../queue',
    '../file',
    '../lib/file',
    '../runtime/client',
    './widget'
], function( Base, Uploader, Queue, WUFile, File, RuntimeClient ) {

    var $ = Base.$,
        rExt = /\.\w+$/,
        Status = WUFile.Status;

    return Uploader.register({
        name: 'queue',

        init: function( opts ) {
            var me = this,
                deferred, len, i, item, arr, accept, runtime;

            if ( $.isPlainObject( opts.accept ) ) {
                opts.accept = [ opts.accept ];
            }

            // accept中的中生成匹配正则。
            if ( opts.accept ) {
                arr = [];

                for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                    item = opts.accept[ i ].extensions;
                    item && arr.push( item );
                }

                if ( arr.length ) {
                    accept = '\\.' + arr.join(',')
                            .replace( /,/g, '$|\\.' )
                            .replace( /\*/g, '.*' ) + '$';
                }

                me.accept = new RegExp( accept, 'i' );
            }

            me.queue = new Queue();
            me.stats = me.queue.stats;

            // 如果当前不是html5运行时，那就算了。
            // 不执行后续操作
            if ( this.request('predict-runtime-type') !== 'html5' ) {
                return;
            }

            // 创建一个 html5 运行时的 placeholder
            // 以至于外部添加原生 File 对象的时候能正确包裹一下供 webuploader 使用。
            deferred = Base.Deferred();
            this.placeholder = runtime = new RuntimeClient('Placeholder');
            runtime.connectRuntime({
                runtimeOrder: 'html5'
            }, function() {
                me._ruid = runtime.getRuid();
                deferred.resolve();
            });
            return deferred.promise();
        },


        // 为了支持外部直接添加一个原生File对象。
        _wrapFile: function( file ) {
            if ( !(file instanceof WUFile) ) {

                if ( !(file instanceof File) ) {
                    if ( !this._ruid ) {
                        throw new Error('Can\'t add external files.');
                    }
                    file = new File( this._ruid, file );
                }

                file = new WUFile( file );
            }

            return file;
        },

        // 判断文件是否可以被加入队列
        acceptFile: function( file ) {
            var invalid = !file || !file.size || this.accept &&

                    // 如果名字中有后缀，才做后缀白名单处理。
                    rExt.exec( file.name ) && !this.accept.test( file.name );

            return !invalid;
        },


        /**
         * @event beforeFileQueued
         * @param {File} file File对象
         * @description 当文件被加入队列之前触发，此事件的handler返回值为`false`，则此文件不会被添加进入队列。
         * @for  Uploader
         */

        /**
         * @event fileQueued
         * @param {File} file File对象
         * @description 当文件被加入队列以后触发。
         * @for  Uploader
         */

        _addFile: function( file ) {
            var me = this;

            file = me._wrapFile( file );

            // 不过类型判断允许不允许，先派送 `beforeFileQueued`
            if ( !me.owner.trigger( 'beforeFileQueued', file ) ) {
                return;
            }

            // 类型不匹配，则派送错误事件，并返回。
            if ( !me.acceptFile( file ) ) {
                me.owner.trigger( 'error', 'Q_TYPE_DENIED', file );
                return;
            }

            me.queue.append( file );
            me.owner.trigger( 'fileQueued', file );
            return file;
        },

        getFile: function( fileId ) {
            return this.queue.getFile( fileId );
        },

        /**
         * @event filesQueued
         * @param {File} files 数组，内容为原始File(lib/File）对象。
         * @description 当一批文件添加进队列以后触发。
         * @for  Uploader
         */
        
        /**
         * @property {Boolean} [auto=false]
         * @namespace options
         * @for Uploader
         * @description 设置为 true 后，不需要手动调用上传，有文件选择即开始上传。
         * 
         */

        /**
         * @method addFiles
         * @grammar addFiles( file ) => undefined
         * @grammar addFiles( [file1, file2 ...] ) => undefined
         * @param {Array of File or File} [files] Files 对象 数组
         * @description 添加文件到队列
         * @for  Uploader
         */
        addFile: function( files ) {
            var me = this;

            if ( !files.length ) {
                files = [ files ];
            }

            files = $.map( files, function( file ) {
                return me._addFile( file );
            });
			
			if ( files.length ) {

                me.owner.trigger( 'filesQueued', files );

				if ( me.options.auto ) {
					setTimeout(function() {
						me.request('start-upload');
					}, 20 );
				}
            }
        },

        getStats: function() {
            return this.stats;
        },

        /**
         * @event fileDequeued
         * @param {File} file File对象
         * @description 当文件被移除队列后触发。
         * @for  Uploader
         */

         /**
         * @method removeFile
         * @grammar removeFile( file ) => undefined
         * @grammar removeFile( id ) => undefined
         * @grammar removeFile( file, true ) => undefined
         * @grammar removeFile( id, true ) => undefined
         * @param {File|id} file File对象或这File对象的id
         * @description 移除某一文件, 默认只会标记文件状态为已取消，如果第二个参数为 `true` 则会从 queue 中移除。
         * @for  Uploader
         * @example
         *
         * $li.on('click', '.remove-this', function() {
         *     uploader.removeFile( file );
         * })
         */
        removeFile: function( file, remove ) {
            var me = this;

            file = file.id ? file : me.queue.getFile( file );

            this.request( 'cancel-file', file );

            if ( remove ) {
                this.queue.removeFile( file );
            }
        },

        /**
         * @method getFiles
         * @grammar getFiles() => Array
         * @grammar getFiles( status1, status2, status... ) => Array
         * @description 返回指定状态的文件集合，不传参数将返回所有状态的文件。
         * @for  Uploader
         * @example
         * console.log( uploader.getFiles() );    // => all files
         * console.log( uploader.getFiles('error') )    // => all error files.
         */
        getFiles: function() {
            return this.queue.getFiles.apply( this.queue, arguments );
        },

        fetchFile: function() {
            return this.queue.fetch.apply( this.queue, arguments );
        },

        /**
         * @method retry
         * @grammar retry() => undefined
         * @grammar retry( file ) => undefined
         * @description 重试上传，重试指定文件，或者从出错的文件开始重新上传。
         * @for  Uploader
         * @example
         * function retry() {
         *     uploader.retry();
         * }
         */
        retry: function( file, noForceStart ) {
            var me = this,
                files, i, len;

            if ( file ) {
                file = file.id ? file : me.queue.getFile( file );
                file.setStatus( Status.QUEUED );
                noForceStart || me.request('start-upload');
                return;
            }

            files = me.queue.getFiles( Status.ERROR );
            i = 0;
            len = files.length;

            for ( ; i < len; i++ ) {
                file = files[ i ];
                file.setStatus( Status.QUEUED );
            }

            me.request('start-upload');
        },

        /**
         * @method sort
         * @grammar sort( fn ) => undefined
         * @description 排序队列中的文件，在上传之前调整可以控制上传顺序。
         * @for  Uploader
         */
        sortFiles: function() {
            return this.queue.sort.apply( this.queue, arguments );
        },

        /**
         * @event reset
         * @description 当 uploader 被重置的时候触发。
         * @for  Uploader
         */

        /**
         * @method reset
         * @grammar reset() => undefined
         * @description 重置uploader。目前只重置了队列。
         * @for  Uploader
         * @example
         * uploader.reset();
         */
        reset: function() {
            this.owner.trigger('reset');
            this.queue = new Queue();
            this.stats = this.queue.stats;
        },

        destroy: function() {
            this.reset();
            this.placeholder && this.placeholder.destroy();
        }
    });

});