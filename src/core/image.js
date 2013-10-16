define( 'webuploader/core/image', [ 'webuploader/base',
        'webuploader/core/runtime/client' ], function( Base, RuntimeClient ) {
    var $ = Base.$;

    function Image() {
        RuntimeClient.apply( this )
    }

    Base.inherits( RuntimeClient, {
        constructor: Image,

        load: function() {

        },

        resize: function() {

        },

        makeThumbnail: function() {

        },

        getOrientation: function() {

        },

        getAsBlob
    } );

    return Image;
} );