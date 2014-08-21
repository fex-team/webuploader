/**
 * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
 */
define([
    '../base',
    '../uploader',
    '../lib/md5',
    '../lib/blob',
    './widget'
], function( Base, Uploader, Md5, Blob ) {

    return Uploader.register({
        name: 'md5',


        /**
         * 计算文件 md5 值，返回一个 promise 对象，可以监听 progress 进度。
         *
         *
         * @method md5File
         * @grammar md5File( file[, start[, end]] ) => promise
         * @for Uploader
         * @example
         *
         * uploader.on( 'fileQueued', function( file ) {
         *     var $li = ...;
         *
         *     uploader.md5File( file )
         *
         *         // 及时显示进度
         *         .progress(function(percentage) {
         *             console.log('Percentage:', percentage);
         *         })
         *
         *         // 完成
         *         .then(function(val) {
         *             console.log('md5 result:', val);
         *         });
         *
         * });
         */
        md5File: function( file, start, end ) {
            var md5 = new Md5(),
                deferred = Base.Deferred(),
                blob = (file instanceof Blob) ? file :
                    this.request( 'get-file', file ).source;

            md5.on( 'progress load', function( e ) {
                e = e || {};
                deferred.notify( e.total ? e.loaded / e.total : 1 );
            });

            md5.on( 'complete', function() {
                deferred.resolve( md5.getResult() );
            });

            md5.on( 'error', function( reason ) {
                deferred.reject( reason );
            });

            if ( arguments.length > 1 ) {
                start = start || 0;
                end = end || 0;
                start < 0 && (start = blob.size + start);
                end < 0 && (end = blob.size + end);
                end = Math.min( end, blob.size );
                blob = blob.slice( start, end );
            }

            md5.loadFromBlob( blob );

            return deferred.promise();
        }
    });
});