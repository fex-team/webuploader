/**
 * Copyright 2011, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

package com.image 
{	
	import flash.utils.ByteArray;
	
	import com.utils.BinaryReader;
	import com.image.ExifParser;

	public class JPEG 
	{		
		public static const MIME:String = 'image/jpeg';
		
		protected var _headers:Array = [];
		protected var _br:BinaryReader;
		
		public function JPEG(binData:ByteArray) 
		{
			_br = new BinaryReader;
			_br.init(binData);
		}
		
		static public function test(binData:ByteArray) : Boolean
		{
			var sign:Array = [ 255, 216 ];
						
			for (var i:int = sign.length - 1; i >= 0 ; i--) {
				if (binData[i] != sign[i]) {
					return false;
				}
			}
			return true;
		}
		
		public function info() : Object 
		{
			var idx:uint = 0, marker:uint, length:uint;
			
			// examine all through the end, since some images might have very large APP segments
			while (idx <= _br.length) {
				marker = _br.SHORT(idx += 2);
				
				if (marker >= 0xFFC0 && marker <= 0xFFC3) { // SOFn
					idx += 5; // marker (2 bytes) + length (2 bytes) + Sample precision (1 byte)
					return {
						height: _br.SHORT(idx),
						width: _br.SHORT(idx += 2),
						type: JPEG.MIME
					};
				}
				length = _br.SHORT(idx += 2);
				idx += length - 2;			
			}
			
			return null;
		}	
		
		
		public function metaInfo() : Object
		{
			var exifParser:ExifParser, headers:Array, 
				meta:Object = {}, exif:Object, gps:Object, tiff:Object;
			
			headers = getHeaders('app1');
			
			if (headers.length) {
				exifParser = new ExifParser;
				if (exifParser.init(headers[0])) {	
					
					tiff = exifParser.TIFF();
					if (tiff) {
						meta['tiff'] = tiff;
					}
					
					exif = exifParser.EXIF();
					if (exif) {
						meta['exif'] = exif;
					}
					
					gps = exifParser.GPS();
					if (gps) {
						meta['gps'] = gps;
					}
	
					exifParser.purge();
				}
			}
			return meta;
		}

		
	
		public function extractHeaders() : Array
		{
			var idx:uint, marker:uint, length:uint;
			
			idx = 2;
				
			while (idx <= _br.length) {
				marker = _br.SHORT(idx);
				
				// omit RST (restart) markers
				if (marker >= 0xFFD0 && marker <= 0xFFD7) {
					idx += 2;
					continue;
				}
				
				// no headers allowed after SOS marker
				if (marker === 0xFFDA || marker === 0xFFD9) {
					break;	
				}	
				
				length = _br.SHORT(idx + 2) + 2;	
								
				// APPn marker detected
				if (marker >= 0xFFE1 && marker <= 0xFFEF) {
					_headers.push({
						hex: marker,
						name: 'APP' + (marker & 0x000F),
						start: idx,
						length: length,
						segment: _br.SEGMENT(idx, length)
					});
				}
				
				idx += length;			
			}
			
			return _headers;
		}
		
		
		public function stripHeaders(binData:ByteArray) : void 
		{
			var img:JPEG = new JPEG(binData), headers:Array, br:BinaryReader = new BinaryReader();
			
			img.extractHeaders();
			headers = img.getHeaders();
			img.purge();
						
			if (headers.length) {
				br.init(binData);
				for (var i:int = headers.length - 1; i >= 0; i--) {
					br.SEGMENT(headers[i].start, headers[i].length, null);
				}
				binData.clear();
				binData.writeBytes(br.SEGMENT());
				br.clear();
			}
		}
		
		
		
		public function getHeaders(name:String = null) : Array
		{
			var headers:Array, array:Array = [];
			
			headers = _headers.length ? _headers : extractHeaders();
			
			if (!name) {
				return headers;
			}
			
			for (var i:uint = 0, max:uint = headers.length; i < max; i++) {
				if (headers[i].name === name.toUpperCase()) {
					array.push(headers[i].segment);
				}
			}
			return array;
		}
		
		public function setHeaders(name:String, segment:*) : void
		{
			var array:Array = [];
					
			if (segment is ByteArray) {
				array.push(segment);	
			} else {
				array = segment;	
			}
						
			for (var i:uint = 0, ii:uint = 0, max:uint = _headers.length; i < max; i++) {
				if (_headers[i].name === name.toUpperCase()) {
					_headers[i].segment = array[ii];
					_headers[i].length = array[ii].length;
					ii++;
				}
				if (ii >= array.length) break;
			}
		}
		
		
		public function updateDimensions(width:uint, height:uint) : void
		{
			var exifParser:ExifParser, headers:Array;
			
			headers = getHeaders('app1');
			
			if (headers.length) {
				exifParser = new ExifParser;
				if (exifParser.init(headers[0])) {						
					
					exifParser.setExif('PixelXDimension', width);
					exifParser.setExif('PixelYDimension', height);
					
					setHeaders('app1', exifParser.getBinary());						
				}
				exifParser.purge();
			}
		}
		
		
		public function insertHeaders(binData:ByteArray, headers:Array = null) : void
		{
			var idx:uint, br:BinaryReader = new BinaryReader;
			
			if (!headers || !headers.length) {
				headers = _headers;
			}
			
			br.init(binData);
					
			// Check if data is jpeg
			if (br.SHORT(0) !== 0xFFD8) {
				throw new Error("Invalid JPEG");
			}	
			
			if (headers.length) {
				idx = br.SHORT(2) == 0xFFE0 ? 4 + br.SHORT(4) : 2;
				
				for (var i:uint = 0, max:uint = headers.length; i < max; i++) {
					br.SEGMENT(idx, 0, headers[i].segment);	
					idx += headers[i].length;
				}
			}
			binData.clear();
			binData.writeBytes(br.SEGMENT());
			br.clear();
		}
		
		public function purge() : void
		{
			_br.clear();
		}
	}
}