/**
 * @fileOverview File
 */
define([
    '../base',
    './blob'
], function( Base, Blob ) {

    var uid = 0,
        rExt = /\.([^.]+)$/;

    function File( ruid, file ) {
        var ext;

        Blob.apply( this, arguments );
        this.name = file.name || ('untitled' + uid++);

        if ( !this.type ) {
            ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';
            if ( ~'jpg,jpeg,png,gif,bmp'.indexOf( ext ) ) {
                this.type = 'image/' + ext;
            }
        }

        this.lastModifiedDate = file.lastModifiedDate ||
                (new Date()).toLocaleString();
    }

    return Base.inherits( Blob, File );
});