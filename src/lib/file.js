/**
 * @fileOverview File
 * @import base.js, runtime/client.js, lib/blob.js
 */
define( 'webuploader/lib/file', [ 'webuploader/base',
        'webuploader/lib/blob' ], function( Base, Blob ) {
    var $ = Base.$,
        uid = 0,
        rExt = /\.([^.]+)$/;

    function File( ruid, file ) {
        var ext;

        Blob.apply( this, arguments );
        this.name = file.name || ('untitled' + uid++);

        if ( !this.type ) {
            ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';
            if ( ~[ 'jpg', 'jpeg', 'png', 'gif', 'bmp' ] ) {
                this.type = 'image/'+ext;
            }
        }

        this.lastModifiedDate = file.lastModifiedDate || (new Date()).toLocaleString();

    }

    return Base.inherits( Blob, File );
} );