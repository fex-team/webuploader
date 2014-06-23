/**
 * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
 */
define([
    '../base',
    '../uploader',
    '../lib/md5',
    './widget'
], function( Base, Uploader, Md5 ) {

    return Uploader.register({
        'md5-file': 'md5Blob'
    }, {


        md5Blob: function( file ) {
            var md5 = new Md5(),
                deferred = Base.Deferred();

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

            md5.loadFromBlob( file.source );

            return deferred.promise();
        }
    });
});