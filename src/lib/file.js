/**
 * @fileOverview File
 * @import base.js, runtime/client.js, lib/blob.js
 */
define( 'webuploader/lib/file', [ 'webuploader/base',
        'webuploader/lib/blob' ], function( Base, Blob ) {
    var $ = Base.$,
        uid = 0;

    function File( ruid, file ) {
        this.name = file.name || ('untitled' + uid++);
        this.type = file.type || '';

        this.lastModifiedDate = file.lastModifiedDate || (new Date()).toLocaleString();
        Blob.apply( this, arguments );
    }

    return Base.inherits( Blob, File );
} );