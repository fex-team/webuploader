/**
 * @fileOverview 组件基类。
 * @import base.js, widgets/widget.js, core/uploader.js, core/file.js, core/queue.js
 */
define( 'webuploader/widgets/uploadmgr', [
    'webuploader/base',
    'webuploader/core/uploader',
    'webuploader/core/file',
    'webuploader/core/queue' ], function(
        Base, Uploader, WUFile, Queue ) {

    var $ = Base.$,
        Status = WUFile.Status;

    $.extend( Uploader.options, {
        threads: 3
    } );

    return Uploader.register(
        {
            'start-upload': 'start',
            'stop-upload': 'stop',
            'is-in-progress': 'isInProgress'
        },

        {
            init: function( opts ) {
                var me = this;

                this.threads = opts.threads || 3;
                this.runing = false;

                this.owner.on( 'uploadDestroy', function() {
                    Base.nextTick( Base.bindFn( me._tick, me ) );
                });
            },

            _tick: function() {
                var me = this,
                    stats = me.getStats();

                while( me.runing && stats.numOfProgress < me.threads &&
                        stats.numOfQueue ) {

                    me.request( 'start-transport', me.request( 'fetch-file' ) );
                }

                if ( !stats.numOfQueue && !me.request('has-requests') ) {
                    me.runing = false;
                    me.owner.trigger( 'uploadFinished' );
                }
            },

            getStats: function( ) {
                if ( !this.stats ) {
                    this.stats = this.request( 'get-stats' );
                }

                return this.stats;
            },

            start: function() {
                var me = this;

                // 移出invalid的文件
                $.each( me.request( 'get-files', [ Status.INVALID ] ), function() {
                    me.request( 'remove-file', this );
                    me.request( 'cancel-transport', this.id );
                } );

                if ( me.runing || !me.getStats().numOfQueue && !me.request('has-requests') ) {
                    return;
                }

                me.runing = true;

                // 如果有暂停的，则续传
                me.request( 'resume-transports' );
                me.owner.trigger( 'startUpload' );
                Base.nextTick( Base.bindFn( me._tick, me ) );
            },

            stop: function( interrupt ) {
                var me = this;

                if ( me.runing === false ) {
                    return;
                }

                me.runing = false;

                if ( interrupt ) {
                    me.request( 'pause-all' );
                }

                me.owner.trigger( 'stopUpload' );
            },

            isInProgress: function() {
                return !!this.runing;
            }
    });

} );