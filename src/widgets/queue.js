/**
 * @fileOverview 队列
 */
define([
    'base',
    'uploader',
    'queue',
    'file',
    './widget'
], function( Base, Uploader, Queue, WUFile ) {

    var $ = Base.$,
        Status = WUFile.Status;

    /**
     * @event beforeFileQueued
     * @param {File} file File对象
     * @description 当文件被加入队列之前触发，此事件的handler返回值为`undefeined`，则此文件不会被添加进入队列。
     * @for  Uploader
     */

    return Uploader.register({
        'add-file': 'addFiles',
        'get-file': 'getFile',
        'fetch-file': 'fetchFile',
        'get-stats': 'getStats',
        'get-files': 'getFiles',
        'remove-file': 'removeFile',
        'retry': 'retry'
    }, {

        init: function( opts ) {
            var len, i, item, arr, accept;

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
                    accept = arr.join(',')
                            .replace( /,/g, '$|' )
                            .replace( /\*/g, '.*' );
                }

                this.accept = new RegExp( accept, 'i' );
            }

            this.queue = new Queue();
            this.stats = this.queue.stats;
        },

        _addFile: function( file ) {
            var me = this;

            if ( !file || file.size < 6 || me.accept &&
                    !me.accept.test( file.name ) ) {
                return;
            }

            if ( !(file instanceof WUFile) ) {
                file = new WUFile( file );
            }

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

        removeFile: function( file ) {
            var me = this;

            file = file.id ? file : me.queue.getFile( file );

            file.setStatus( Status.CANCELLED );
            me.owner.trigger( 'fileDequeued', file );
        },

        getFiles: function() {
            return this.queue.getFiles.apply( this.queue, arguments );
        },

        fetchFile: function() {
            return this.queue.fetch.apply( this.queue, arguments );
        },

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
        }
    });

});