define( 'webuploader/core/file/blob', [ 'webuploader/base',
        'webuploader/core/runtime/client' ], function( Base, RuntimeClient ) {
    var $ = Base.$,
        uid = 0;

    function File( ruid, file ) {
        this.name = file.name || ('untitled' + uid++);
        this.type = file.type || '';

        this.lastModifiedDate = file.lastModifiedDate || (new Date()).toLocaleString();
        Blob.apply( this, arguments );
    }

    Base.inherits( Blob, File );

    return File;
} );