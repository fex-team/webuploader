/**
 * Terms:
 *
 * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
 * @fileOverview Image控件
 */
define( 'webuploader/core/runtime/html5/util', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
        ], function( Base ) {

    var $ = Base.$,
        urlAPI = window.createObjectURL && window ||
            window.URL && URL.revokeObjectURL && URL ||
            webkitURL

    return {
        createObjectURL: urlAPI.createObjectURL,
        revokeObjectURL: urlAPI.revokeObjectURL,

        // 限制fileReader, 因为不能回收，所以只能共用。
        getFileReader: (function(){
            var throttle = 3,
                pool = [],
                wating = [];

            function _tick() {
                var avaibles = [],
                    i, fr, cb;

                for ( i = 0; i < throttle; i++ ) {
                    fr = pool[ i ];
                    fr && fr.readyState === 2 && avaibles.push( fr );
                }

                while ( avaibles.length && wating.length ) {
                    fr = avaibles.shift();
                    cb = wating.shift();
                    fr.onload = fr.onerror = null;
                    cb( fr );
                    fr.onloadend = _tick;
                }
            }

            return function( cb ) {
                var fr;

                if ( pool.length < throttle ) {
                    fr = new FileReader();
                    pool.push( fr );
                    cb( fr );
                    fr.onloadend = _tick;
                    return;
                }

                wating.push( cb );
                _tick();
            }
        })(),

        dataURL2Blob: function( dataURI ) {
            var byteStr, intArray, ab, i, mimetype, parts;

            parts = dataURI.split( ',' );
            if ( ~parts[ 0 ].indexOf( 'base64' ) ) {
                byteStr = atob( parts[ 1 ] );
            } else {
                byteStr = decodeURIComponent( parts[ 1 ] );
            }

            ab = new ArrayBuffer( byteStr.length );
            intArray = new Uint8Array( ab );

            for ( i = 0; i < byteStr.length; i++ ) {
                intArray[ i ] = byteStr.charCodeAt( i );
            }

            mimetype = parts[ 0 ].split( ':' )[ 1 ].split( ';' )[ 0 ];

            return new Blob( [ ab ], { type: mimetype } );
        },

        dataURL2ArrayBuffer: function( dataURI ) {
            var byteStr, intArray, i, parts;

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
            return new Blob( [ buffer ], type ? { type: type } : {} );
        },

        binaryString2DataURL: function( bin ) {
            // todo.
        }
    }
} );