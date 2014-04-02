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
        'sort-files': 'sortFiles',
        'add-file': 'addFiles',
        'get-file': 'getFile',
        'fetch-file': 'fetchFile',
        'get-stats': 'getStats',
        'get-files': 'getFiles',
        'remove-file': 'removeFile',
        'retry': 'retry',
        'reset': 'reset'
    }, {

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
            if ( this.request('predict-runtime-type') !== 'html5' ) {
                return;
            }

            deferred = Base.Deferred();
            runtime = new RuntimeClient('Placeholder');
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

            if ( !file || file.size < 6 || me.accept &&

                    // 如果名字中有后缀，才做后缀白名单处理。
                    rExt.exec( file.name ) && !me.accept.test( file.name ) ) {
                return;
            }

            file = me._wrapFile( file );

            if ( !me.owner.trigger( 'beforeFileQueued', file ) ) {
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
        addFiles: function( files ) {
            var me = this;

            if ( !files.length ) {
                files = [ files ];
            }

            files = $.map( files, function( file ) {
                return me._addFile( file );
            });

            me.owner.trigger( 'filesQueued', files );

            if ( me.options.auto ) {
                me.request('start-upload');
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
         * @param {File|id} file File对象或这File对象的id
         * @description 移除某一文件。
         * @for  Uploader
         * @example
         *
         * $li.on('click', '.remove-this', function() {
         *     uploader.removeFile( file );
         * })
         */
        removeFile: function( file ) {
            var me = this;

            file = file.id ? file : me.queue.getFile( file );

            file.setStatus( Status.CANCELLED );
            me.owner.trigger( 'fileDequeued', file );
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
         * @method reset
         * @grammar reset() => undefined
         * @description 重置uploader。目前只重置了队列。
         * @for  Uploader
         * @example
         * uploader.reset();
         */
        reset: function() {
            this.queue = new Queue();
            this.stats = this.queue.stats;
        }
    });

});