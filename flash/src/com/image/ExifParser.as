/**
 * Copyright 2011, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

package com.image {
	import flash.events.EventDispatcher;
	import flash.external.ExternalInterface;
	import flash.utils.ByteArray;

	import com.utils.BinaryReader;

	public class ExifParser extends EventDispatcher {

		private var data:BinaryReader = new BinaryReader();

		private var Tiff:Object;

		private var offsets:Object = {
			tiffHeader : 10
		};

		private var tags:Object = {

			tiff: {
				0x0112: 'Orientation',
				0x010E: 'ImageDescription',
				0x010F: 'Make',
				0x0110: 'Model',
				0x0131: 'Software',
				0x8769: 'ExifIFDPointer',
				0x8825:	'GPSInfoIFDPointer'
			},

			exif: {
				0x9000: 'ExifVersion',
				0xA001: 'ColorSpace',
				0xA002: 'PixelXDimension',
				0xA003: 'PixelYDimension',
				0x9003: 'DateTimeOriginal',
				0x829A: 'ExposureTime',
				0x829D: 'FNumber',
				0x8827: 'ISOSpeedRatings',
				0x9201: 'ShutterSpeedValue',
				0x9202: 'ApertureValue'	,
				0x9207: 'MeteringMode',
				0x9208: 'LightSource',
				0x9209: 'Flash',
				0x920A: 'FocalLength',
				0xA402: 'ExposureMode',
				0xA403: 'WhiteBalance',
				0xA406: 'SceneCaptureType',
				0xA404: 'DigitalZoomRatio',
				0xA408: 'Contrast',
				0xA409: 'Saturation',
				0xA40A: 'Sharpness'
			},

			gps: {
				0x0000: 'GPSVersionID',
				0x0001: 'GPSLatitudeRef',
				0x0002: 'GPSLatitude',
				0x0003: 'GPSLongitudeRef',
				0x0004: 'GPSLongitude'
			}
		},

			tagDescs:Object = {
				'ColorSpace': {
					1: 'sRGB',
					0: 'Uncalibrated'
				},
				'MeteringMode': {
					0: 'Unknown',
					1: 'Average',
					2: 'CenterWeightedAverage',
					3: 'Spot',
					4: 'MultiSpot',
					5: 'Pattern',
					6: 'Partial',
					255: 'Other'
				},
				'LightSource': {
					1: 'Daylight',
					2: 'Fliorescent',
					3: 'Tungsten',
					4: 'Flash',
					9: 'Fine weather',
					10: 'Cloudy weather',
					11: 'Shade',
					12: 'Daylight fluorescent (D 5700 - 7100K)',
					13: 'Day white fluorescent (N 4600 -5400K)',
					14: 'Cool white fluorescent (W 3900 - 4500K)',
					15: 'White fluorescent (WW 3200 - 3700K)',
					17: 'Standard light A',
					18: 'Standard light B',
					19: 'Standard light C',
					20: 'D55',
					21: 'D65',
					22: 'D75',
					23: 'D50',
					24: 'ISO studio tungsten',
					255: 'Other'
				},
				'Flash': {
					0x0000: 'Flash did not fire.',
					0x0001: 'Flash fired.',
					0x0005: 'Strobe return light not detected.',
					0x0007: 'Strobe return light detected.',
					0x0009: 'Flash fired, compulsory flash mode',
					0x000D: 'Flash fired, compulsory flash mode, return light not detected',
					0x000F: 'Flash fired, compulsory flash mode, return light detected',
					0x0010: 'Flash did not fire, compulsory flash mode',
					0x0018: 'Flash did not fire, auto mode',
					0x0019: 'Flash fired, auto mode',
					0x001D: 'Flash fired, auto mode, return light not detected',
					0x001F: 'Flash fired, auto mode, return light detected',
					0x0020: 'No flash function',
					0x0041: 'Flash fired, red-eye reduction mode',
					0x0045: 'Flash fired, red-eye reduction mode, return light not detected',
					0x0047: 'Flash fired, red-eye reduction mode, return light detected',
					0x0049: 'Flash fired, compulsory flash mode, red-eye reduction mode',
					0x004D: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected',
					0x004F: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light detected',
					0x0059: 'Flash fired, auto mode, red-eye reduction mode',
					0x005D: 'Flash fired, auto mode, return light not detected, red-eye reduction mode',
					0x005F: 'Flash fired, auto mode, return light detected, red-eye reduction mode'
				},
				'ExposureMode': {
					0: 'Auto exposure',
					1: 'Manual exposure',
					2: 'Auto bracket'
				},
				'WhiteBalance': {
					0: 'Auto white balance',
					1: 'Manual white balance'
				},
				'SceneCaptureType': {
					0: 'Standard',
					1: 'Landscape',
					2: 'Portrait',
					3: 'Night scene'
				},
				'Contrast': {
					0: 'Normal',
					1: 'Soft',
					2: 'Hard'
				},
				'Saturation': {
					0: 'Normal',
					1: 'Low saturation',
					2: 'High saturation'
				},
				'Sharpness': {
					0: 'Normal',
					1: 'Soft',
					2: 'Hard'
				},

				// GPS related
				'GPSLatitudeRef': {
					N: 'North latitude',
					S: 'South latitude'
				},
				'GPSLongitudeRef': {
					E: 'East longitude',
					W: 'West longitude'
				}
			};

		public function init(segment:ByteArray):Boolean {
			// Reset internal data
			offsets = {
				tiffHeader: 10
			};

			if (!segment || !segment.length) {
				return false;
			}

			data.init(segment);

			// Check if that's APP1 and that it has EXIF
			if (data.SHORT(0) === 0xFFE1 && data.STRING(4, 4).toUpperCase() === "EXIF") {
				return getIFDOffsets();
			}
			return false;
		}

		public function TIFF():Object {
			return Tiff;
		}


		public function EXIF():Object {
			var Exif:Object;

			if (!offsets.hasOwnProperty('exifIFD')) {
				return null;
			}

			try { // survive invalid offsets
				Exif = extractTags(offsets['exifIFD'], tags.exif);
			} catch (ex:Error) {
				return null;
			}

			// fix formatting of some tags
			if (Exif.hasOwnProperty('ExifVersion') && Exif.ExifVersion is Array) {
				for (var i:uint = 0, exifVersion:String = ''; i < Exif.ExifVersion.length; i++) {
					exifVersion += String.fromCharCode(Exif.ExifVersion[i]);
				}
				Exif.ExifVersion = exifVersion;
			}

			return Exif;
		}

		public function GPS():Object {
			var Gps:Object;

			if (!offsets.hasOwnProperty('gpsIFD')) {
				return null;
			}

			try { // survive invalid offsets
				Gps = extractTags(offsets['gpsIFD'], tags.gps);
			} catch (ex:Error) {
				return null;
			}

			if (Gps.hasOwnProperty('GPSVersionID') && Gps.GPSVersionID is Array) {
				Gps.GPSVersionID = Gps.GPSVersionID.join('.');
			}

			return Gps;
		}


		public function setExif(tag:String, value:*) : Boolean {
			// Right now only setting of width/height is possible
			if (tag !== 'PixelXDimension' && tag !== 'PixelYDimension') return false;

			return setTag('exif', tag, value);
		}


		public function getBinary():ByteArray {
			return data.SEGMENT();
		}


		private function isJPEG():Boolean {
			return data.SHORT(0) == 0xFFD8;
		}


		private function getIFDOffsets():Boolean {
			var idx:uint = offsets.tiffHeader;

			// Set read order of multi-byte data
			data.II(data.SHORT(idx) == 0x4949);

			// Check if always present bytes are indeed present
			if (data.SHORT(idx+=2) !== 0x002A) {
				return false;
			}

			offsets['IFD0'] = offsets.tiffHeader + data.LONG(idx += 2);
			Tiff = extractTags(offsets['IFD0'], tags.tiff);

			if (Tiff.hasOwnProperty('ExifIFDPointer')) {
				offsets['exifIFD'] = offsets.tiffHeader + Tiff.ExifIFDPointer;
				delete Tiff.ExifIFDPointer;
			}

			if (Tiff.hasOwnProperty('GPSInfoIFDPointer')) {
				offsets['gpsIFD'] = offsets.tiffHeader + Tiff.GPSInfoIFDPointer;
				delete Tiff.GPSInfoIFDPointer;
			}
			return true;
		}


		private function extractTags(IFD_offset:int, tags2extract:Object):Object {
			var length:uint, i:uint, ii:uint,
				tag:String, type:uint, count:uint, tagOffset:uint, offset:uint, value:*,
				values:Array = [], hash:Object = {};

			length = data.SHORT(IFD_offset);

			for (i = 0; i < length; i++) {
				// Set binary reader pointer to beginning of the next tag
				offset = tagOffset = IFD_offset + 12 * i + 2;

				tag = tags2extract[data.SHORT(offset)];

				if (!tag) {
					continue; // Not the tag we requested
				}

				type = data.SHORT(offset+=2);
				count = data.LONG(offset+=2);

				offset += 4;
				values = [];

				switch (type) {
					case 1: // BYTE
					case 7: // UNDEFINED
						if (count > 4) {
							offset = data.LONG(offset) + offsets.tiffHeader;
						}

						for (ii = 0; ii < count; ii++) {
							values[ii] = data.BYTE(offset + ii);
						}

						break;

					case 2: // STRING
						if (count > 4) {
							offset = data.LONG(offset) + offsets.tiffHeader;
						}

						hash[tag] = data.STRING(offset, count - 1);

						continue;

					case 3: // SHORT
						if (count > 2) {
							offset = data.LONG(offset) + offsets.tiffHeader;
						}

						for (ii = 0; ii < count; ii++) {
							values[ii] = data.SHORT(offset + ii*2);
						}

						break;

					case 4: // LONG
						if (count > 1) {
							offset = data.LONG(offset) + offsets.tiffHeader;
						}

						for (ii = 0; ii < count; ii++) {
							values[ii] = data.LONG(offset + ii*4);
						}

						break;

					case 5: // RATIONAL
						offset = data.LONG(offset) + offsets.tiffHeader;

						for (ii = 0; ii < count; ii++) {
							values[ii] = data.LONG(offset + ii*4) / data.LONG(offset + ii*4 + 4);
						}

						break;

					case 9: // SLONG
						offset = data.LONG(offset) + offsets.tiffHeader;

						for (ii = 0; ii < count; ii++) {
							values[ii] = data.SLONG(offset + ii*4);
						}

						break;

					case 10: // SRATIONAL
						offset = data.LONG(offset) + offsets.tiffHeader;

						for (ii = 0; ii < count; ii++) {
							values[ii] = data.SLONG(offset + ii*4) / data.SLONG(offset + ii*4 + 4);
						}

						break;

					default:
						continue;
				}

				value = (count == 1 ? values[0] : values);

				if (tagDescs.hasOwnProperty(tag) && typeof value != 'object') {
					hash[tag] = tagDescs[tag][value];
				} else {
					hash[tag] = value;
				}
			}

			return hash;
		}


		// At the moment only setting of simple (LONG) values, that do not require offset recalculation, is supported
		private function setTag(ifd:String, tag:*, value:*) : Boolean {
			var offset:*, length:uint, tagOffset:uint, valueOffset:uint = 0, hex:*;

			// If tag name passed translate into hex key
			if (tag is String) {
				var tmpTags:Object = tags[ifd.toLowerCase()];
				for (hex in tmpTags) {
					if (tmpTags[hex] === tag) {
						tag = hex;
						break;
					}
				}
			}
			offset = offsets[ifd.toLowerCase() + 'IFD'];
			if (offset === null) {
				return false;
			}

			length = data.SHORT(offset);

			for (var i:uint = 0; i < length; i++) {
				tagOffset = offset + 12 * i + 2;

				if (data.SHORT(tagOffset) == tag) {
					valueOffset = tagOffset + 8;
					break;
				}
			}

			if (!valueOffset) return false;

			data.LONG(valueOffset, value);
			return true;
		}


		public function purge() : void {
			data.clear();
		}

	}

}
