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
            'pause-all': 'pauseAll'
        },

        {
            init: function() {
                this.queue = new Queue();
                this.stats = this.queue.stats;
            },

            addFile: function( file ) {
                var me = this;

                if ( !(file instanceof WUFile) ) {
                    file = new WUFile( file );
                }

                if ( !me.owner.trigger( 'beforeFileQueued', file ) ) {
                    return false;
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
                // setTimeout( _tick, 1 );
            },

            getFiles: function( status ) {
                return this.queue.getFiles.apply( this.queue, arguments );
            },

            fetchFile: function( status ) {
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
            },

            pauseAll: function() {
                var files = me.queue.getFiles();

                $.each( files, function( idx, file ) {
                    file.setStatus( Status.INTERRUPT );
                } );
            }
    });

} );