/**
 * 代码来自于：https://github.com/blueimp/JavaScript-Load-Image
 * 暂时项目中只用了orientation.
 *
 * 去除了 Exif Sub IFD Pointer, GPS Info IFD Pointer, Exif Thumbnail.
 * @fileOverview EXIF解析
 */

// Sample
// ====================================
// Make : Apple
// Model : iPhone 4S
// Orientation : 1
// XResolution : 72 [72/1]
// YResolution : 72 [72/1]
// ResolutionUnit : 2
// Software : QuickTime 7.7.1
// DateTime : 2013:09:01 22:53:55
// ExifIFDPointer : 190
// ExposureTime : 0.058823529411764705 [1/17]
// FNumber : 2.4 [12/5]
// ExposureProgram : Normal program
// ISOSpeedRatings : 800
// ExifVersion : 0220
// DateTimeOriginal : 2013:09:01 22:52:51
// DateTimeDigitized : 2013:09:01 22:52:51
// ComponentsConfiguration : YCbCr
// ShutterSpeedValue : 4.058893515764426
// ApertureValue : 2.5260688216892597 [4845/1918]
// BrightnessValue : -0.3126686601998395
// MeteringMode : Pattern
// Flash : Flash did not fire, compulsory flash mode
// FocalLength : 4.28 [107/25]
// SubjectArea : [4 values]
// FlashpixVersion : 0100
// ColorSpace : 1
// PixelXDimension : 2448
// PixelYDimension : 3264
// SensingMethod : One-chip color area sensor
// ExposureMode : 0
// WhiteBalance : Auto white balance
// FocalLengthIn35mmFilm : 35
// SceneCaptureType : Standard
define([
    '../../../base',
    '../imagemeta'
], function( Base, ImageMeta ) {

    var EXIF = {};

    EXIF.ExifMap = function() {
        return this;
    };

    EXIF.ExifMap.prototype.map = {
        'Orientation': 0x0112
    };

    EXIF.ExifMap.prototype.get = function( id ) {
        return this[ id ] || this[ this.map[ id ] ];
    };

    EXIF.exifTagTypes = {
        // byte, 8-bit unsigned int:
        1: {
            getValue: function( dataView, dataOffset ) {
                return dataView.getUint8( dataOffset );
            },
            size: 1
        },

        // ascii, 8-bit byte:
        2: {
            getValue: function( dataView, dataOffset ) {
                return String.fromCharCode( dataView.getUint8( dataOffset ) );
            },
            size: 1,
            ascii: true
        },

        // short, 16 bit int:
        3: {
            getValue: function( dataView, dataOffset, littleEndian ) {
                return dataView.getUint16( dataOffset, littleEndian );
            },
            size: 2
        },

        // long, 32 bit int:
        4: {
            getValue: function( dataView, dataOffset, littleEndian ) {
                return dataView.getUint32( dataOffset, littleEndian );
            },
            size: 4
        },

        // rational = two long values,
        // first is numerator, second is denominator:
        5: {
            getValue: function( dataView, dataOffset, littleEndian ) {
                return dataView.getUint32( dataOffset, littleEndian ) /
                    dataView.getUint32( dataOffset + 4, littleEndian );
            },
            size: 8
        },

        // slong, 32 bit signed int:
        9: {
            getValue: function( dataView, dataOffset, littleEndian ) {
                return dataView.getInt32( dataOffset, littleEndian );
            },
            size: 4
        },

        // srational, two slongs, first is numerator, second is denominator:
        10: {
            getValue: function( dataView, dataOffset, littleEndian ) {
                return dataView.getInt32( dataOffset, littleEndian ) /
                    dataView.getInt32( dataOffset + 4, littleEndian );
            },
            size: 8
        }
    };

    // undefined, 8-bit byte, value depending on field:
    EXIF.exifTagTypes[ 7 ] = EXIF.exifTagTypes[ 1 ];

    EXIF.getExifValue = function( dataView, tiffOffset, offset, type, length,
            littleEndian ) {

        var tagType = EXIF.exifTagTypes[ type ],
            tagSize, dataOffset, values, i, str, c;

        if ( !tagType ) {
            Base.log('Invalid Exif data: Invalid tag type.');
            return;
        }

        tagSize = tagType.size * length;

        // Determine if the value is contained in the dataOffset bytes,
        // or if the value at the dataOffset is a pointer to the actual data:
        dataOffset = tagSize > 4 ? tiffOffset + dataView.getUint32( offset + 8,
                littleEndian ) : (offset + 8);

        if ( dataOffset + tagSize > dataView.byteLength ) {
            Base.log('Invalid Exif data: Invalid data offset.');
            return;
        }

        if ( length === 1 ) {
            return tagType.getValue( dataView, dataOffset, littleEndian );
        }

        values = [];

        for ( i = 0; i < length; i += 1 ) {
            values[ i ] = tagType.getValue( dataView,
                    dataOffset + i * tagType.size, littleEndian );
        }

        if ( tagType.ascii ) {
            str = '';

            // Concatenate the chars:
            for ( i = 0; i < values.length; i += 1 ) {
                c = values[ i ];

                // Ignore the terminating NULL byte(s):
                if ( c === '\u0000' ) {
                    break;
                }
                str += c;
            }

            return str;
        }
        return values;
    };

    EXIF.parseExifTag = function( dataView, tiffOffset, offset, littleEndian,
            data ) {

        var tag = dataView.getUint16( offset, littleEndian );
        data.exif[ tag ] = EXIF.getExifValue( dataView, tiffOffset, offset,
                dataView.getUint16( offset + 2, littleEndian ),    // tag type
                dataView.getUint32( offset + 4, littleEndian ),    // tag length
                littleEndian );
    };

    EXIF.parseExifTags = function( dataView, tiffOffset, dirOffset,
            littleEndian, data ) {

        var tagsNumber, dirEndOffset, i;

        if ( dirOffset + 6 > dataView.byteLength ) {
            Base.log('Invalid Exif data: Invalid directory offset.');
            return;
        }

        tagsNumber = dataView.getUint16( dirOffset, littleEndian );
        dirEndOffset = dirOffset + 2 + 12 * tagsNumber;

        if ( dirEndOffset + 4 > dataView.byteLength ) {
            Base.log('Invalid Exif data: Invalid directory size.');
            return;
        }

        for ( i = 0; i < tagsNumber; i += 1 ) {
            this.parseExifTag( dataView, tiffOffset,
                    dirOffset + 2 + 12 * i,    // tag offset
                    littleEndian, data );
        }

        // Return the offset to the next directory:
        return dataView.getUint32( dirEndOffset, littleEndian );
    };

    // EXIF.getExifThumbnail = function(dataView, offset, length) {
    //     var hexData,
    //         i,
    //         b;
    //     if (!length || offset + length > dataView.byteLength) {
    //         Base.log('Invalid Exif data: Invalid thumbnail data.');
    //         return;
    //     }
    //     hexData = [];
    //     for (i = 0; i < length; i += 1) {
    //         b = dataView.getUint8(offset + i);
    //         hexData.push((b < 16 ? '0' : '') + b.toString(16));
    //     }
    //     return 'data:image/jpeg,%' + hexData.join('%');
    // };

    EXIF.parseExifData = function( dataView, offset, length, data ) {

        var tiffOffset = offset + 10,
            littleEndian, dirOffset;

        // Check for the ASCII code for "Exif" (0x45786966):
        if ( dataView.getUint32( offset + 4 ) !== 0x45786966 ) {
            // No Exif data, might be XMP data instead
            return;
        }
        if ( tiffOffset + 8 > dataView.byteLength ) {
            Base.log('Invalid Exif data: Invalid segment size.');
            return;
        }

        // Check for the two null bytes:
        if ( dataView.getUint16( offset + 8 ) !== 0x0000 ) {
            Base.log('Invalid Exif data: Missing byte alignment offset.');
            return;
        }

        // Check the byte alignment:
        switch ( dataView.getUint16( tiffOffset ) ) {
            case 0x4949:
                littleEndian = true;
                break;

            case 0x4D4D:
                littleEndian = false;
                break;

            default:
                Base.log('Invalid Exif data: Invalid byte alignment marker.');
                return;
        }

        // Check for the TIFF tag marker (0x002A):
        if ( dataView.getUint16( tiffOffset + 2, littleEndian ) !== 0x002A ) {
            Base.log('Invalid Exif data: Missing TIFF marker.');
            return;
        }

        // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
        dirOffset = dataView.getUint32( tiffOffset + 4, littleEndian );
        // Create the exif object to store the tags:
        data.exif = new EXIF.ExifMap();
        // Parse the tags of the main image directory and retrieve the
        // offset to the next directory, usually the thumbnail directory:
        dirOffset = EXIF.parseExifTags( dataView, tiffOffset,
                tiffOffset + dirOffset, littleEndian, data );

        // 尝试读取缩略图
        // if ( dirOffset ) {
        //     thumbnailData = {exif: {}};
        //     dirOffset = EXIF.parseExifTags(
        //         dataView,
        //         tiffOffset,
        //         tiffOffset + dirOffset,
        //         littleEndian,
        //         thumbnailData
        //     );

        //     // Check for JPEG Thumbnail offset:
        //     if (thumbnailData.exif[0x0201]) {
        //         data.exif.Thumbnail = EXIF.getExifThumbnail(
        //             dataView,
        //             tiffOffset + thumbnailData.exif[0x0201],
        //             thumbnailData.exif[0x0202] // Thumbnail data length
        //         );
        //     }
        // }
    };

    ImageMeta.parsers[ 0xffe1 ].push( EXIF.parseExifData );
    return EXIF;
});