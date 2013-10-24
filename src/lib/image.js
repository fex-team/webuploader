/**
 * @fileOverview Image帮助类，主要用来生成缩略图和压缩图片。
 * @import base.js, runtime/client.js
 */
define( 'webuploader/core/image', [ 'webuploader/base',
        'webuploader/runtime/client' ], function( Base, RuntimeClient ) {
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

        getAsBlob: function() {

        }
    } );

    return Image;
} );