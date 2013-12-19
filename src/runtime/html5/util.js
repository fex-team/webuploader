/**
 * Terms:
 *
 * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
 * @fileOverview Image控件
 */
define(function() {

    var urlAPI = window.createObjectURL && window ||
            window.URL && URL.revokeObjectURL && URL ||
            window.webkitURL;

    return {
        createObjectURL: urlAPI && urlAPI.createObjectURL,
        revokeObjectURL: urlAPI && urlAPI.revokeObjectURL,

        dataURL2Blob: function( dataURI ) {
            var byteStr, intArray, ab, i, mimetype, parts;

            parts = dataURI.split(',');

            if ( ~parts[ 0 ].indexOf('base64') ) {
                byteStr = atob( parts[ 1 ] );
            } else {
                byteStr = decodeURIComponent( parts[ 1 ] );
            }

            ab = new ArrayBuffer( byteStr.length );
            intArray = new Uint8Array( ab );

            for ( i = 0; i < byteStr.length; i++ ) {
                intArray[ i ] = byteStr.charCodeAt( i );
            }

            mimetype = parts[ 0 ].split(':')[ 1 ].split(';')[ 0 ];

            return new Blob([ ab ], {
                type: mimetype
            });
        },

        dataURL2ArrayBuffer: function( dataURI ) {
            var byteStr, intArray, i, parts;

            parts = dataURI.split(',');

            if ( ~parts[ 0 ].indexOf('base64') ) {
                byteStr = atob( parts[ 1 ] );
            } else {
                byteStr = decodeURIComponent( parts[ 1 ] );
            }

            intArray = new Uint8Array( byteStr.length );

            for ( i = 0; i < byteStr.length; i++ ) {
                intArray[ i ] = byteStr.charCodeAt( i );
            }

            return intArray.buffer;
        },

        arrayBufferToBlob: function( buffer, type ) {
            return new Blob([ buffer ], type ? { type: type } : {} );
        }
    };
});