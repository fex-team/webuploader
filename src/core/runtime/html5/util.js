/**
 * Terms:
 *
 * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
 * @fileOverview Image控件
 */
define( 'webuploader/core/runtime/html5/util', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
        ], function( Base, Html5Runtime ) {

    var $ = Base.$,
        urlAPI = window.createObjectURL && window ||
            window.URL && URL.revokeObjectURL && URL ||
            webkitURL

    return {
        createObjectURL: urlAPI.createObjectURL,
        revokeObjectURL: urlAPI.revokeObjectURL,

        dataURL2Blob: function( dataURI ) {
            var byteStr, intArray, i, mimetype, bb, parts;

            parts = dataURI.split( ',' );
            if ( ~parts[ 0 ].indexOf( 'base64' ) ) {
                byteStr = atob( parts[ 1 ] );
            } else {
                byteStr = decodeURIComponent( parts[ 1 ] );
            }

            intArray = new Uint8Array( byteStr.length );

            for ( i = 0; i < byteStr.length; i++ ) {
                intArray[ i ] = byteStr.charCodeAt( i );
            }

            mimetype = parts[ 0 ].split( ':' )[ 1 ].split( ';' )[ 0 ];

            return new Blob( [ intArray ], { type: mimetype } );
        },

        dataURL2ArrayBuffer: function( dataURI ) {
            var byteStr, intArray, i, bb, parts;

            parts = dataURI.split( ',' );
            if ( ~parts[ 0 ].indexOf( 'base64' ) ) {
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
            var intArray = new Uint8Array( buffer );
            return new Blob( [ intArray ], type ? { type: type } : {} );
        },

        binaryString2DataURL: function( bin ) {
            // todo.
        }
    }
} );