/**
 * 为了统一化Flash的File和HTML5的File而存在。
 * 以至于要调用Flash里面的File，也可以像调用HTML5版本的File一下。
 * @fileOverview File
 */
define([
    '../base',
    './blob'
], function( Base, Blob ) {

    var uid = 1,
        rExt = /\.([^.]+)$/;

    function File( ruid, file ) {
        var ext;

        this.name = file.name || ('untitled' + uid++);
        ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';

        // todo 支持其他类型文件的转换。
        // 如果有 mimetype, 但是文件名里面没有找出后缀规律
        if ( !ext && file.type ) {
            ext = /\/(jpg|jpeg|png|gif|bmp)$/i.exec( file.type ) ?
                    RegExp.$1.toLowerCase() : '';
            this.name += '.' + ext;
        }

        this.ext = ext;
        this.lastModifiedDate = file.lastModifiedDate ||
                (new Date()).toLocaleString();

        Blob.apply( this, arguments );
    }

    return Base.inherits( Blob, File );
});
