/**
 * @fileOverview 队列
 * @import base.js, widgets/widget.js, core/uploader.js, core/queue.js, core/file.js
 */
define( 'webuploader/widgets/queue', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/core/queue',
    'webuploader/core/file' ], function(
        Base, Uploader, Queue, WUFile ) {

    var $ = Base.$,
        Status = WUFile.Status;

    return Uploader.register(
        {
            'add-file': 'addFiles',
            'get-file': 'getFile',
            'fetch-file': 'fetchFile',
            'get-stats': 'getStats',
            'get-files': 'getFiles',
            'remove-file': 'removeFile',
            'retry': 'retry'
        },

        {
            init: function( opts ) {
                var len, i, item, arr, accept;

                // accept中的中生成匹配正则。
                if ( opts.accept ) {
                    arr = [];

                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        item = opts.accept[ i ].extensions;
                        item && arr.push( item );
                    }

                    if ( arr.length ) {
                        accept = arr.join( ',' );
                        accept = accept.replace(/,/g, '$|').replace(/\*/g, '.*');
                    }
                }
                this.accept = accept = new RegExp(accept, 'i');

                this.queue = new Queue();
                this.stats = this.queue.stats;
            },

            addFile: function( file ) {
                var me = this;

                if ( !file || file.size < 6 || !me.accept.test( file.type ) ) {
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
            },

            getFile: function( fileId ) {
                return this.queue.getFile( fileId );
            },

            addFiles: function( files ) {
                var me = this;

                if ( !files.length ) {
                    files = [ files ];
                }

                $.each( files, function() {
                    me.addFile( this );
                });
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

            retry: function( file ) {
                var me = this;

                if ( file ) {
                    file = file.id ? file : me.queue.getFile( file );
                    file.setStatus( Status.QUEUED );
                    me.request( 'start-upload' );
                    return;
                }

                var files = me.queue.getFiles( Status.ERROR ),
                    i = 0,
                    len = files.length;

                for( ; i < len; i++ ) {
                    file = files[ i ];
                    file.setStatus( Status.QUEUED );
                }

                me.request( 'start-upload' );
            }
    });

} );