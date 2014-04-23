/**
 * Terms:
 *
 * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
 * @fileOverview Image控件
 */
define([
    '../../base'
], function( Base ) {

    var urlAPI = window.createObjectURL && window ||
            window.URL && URL.revokeObjectURL && URL ||
            window.webkitURL,
        createObjectURL = Base.noop,
        revokeObjectURL = createObjectURL;

    if ( urlAPI ) {

        // 更安全的方式调用，比如android里面就能把context改成其他的对象。
        createObjectURL = function() {
            return urlAPI.createObjectURL.apply( urlAPI, arguments );
        };

        revokeObjectURL = function() {
            return urlAPI.revokeObjectURL.apply( urlAPI, arguments );
        };
    }

    return {
        createObjectURL: createObjectURL,
        revokeObjectURL: revokeObjectURL,

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

            return this.arrayBufferToBlob( ab, mimetype );
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
            var builder = window.BlobBuilder || window.WebKitBlobBuilder,
                bb;

            // android不支持直接new Blob, 只能借助blobbuilder.
            if ( builder ) {
                bb = new builder();
                bb.append( buffer );
                return bb.getBlob( type );
            }

            return new Blob([ buffer ], type ? { type: type } : {} );
        },

        // 抽出来主要是为了解决android下面canvas.toDataUrl不支持jpeg.
        // 你得到的结果是png.
        canvasToDataUrl: function( canvas, type, quality ) {
            return canvas.toDataURL( type, quality / 100 );
        },

        // imagemeat会复写这个方法，如果用户选择加载那个文件了的话。
        parseMeta: function( blob, callback ) {
            callback( false, {});
        },

        // imagemeat会复写这个方法，如果用户选择加载那个文件了的话。
        updateImageHead: function( data ) {
            return data;
        }
    };
});