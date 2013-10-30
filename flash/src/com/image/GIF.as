/**
 * Copyright 2011, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

package com.image
{
	import com.BinaryReader;
	
	import flash.utils.ByteArray;
	
	public class GIF 
	{		
		public static const MIME:String = 'image/gif';
		
		protected var _br:BinaryReader;
		
		public function GIF(binData:ByteArray)
		{
			_br = new BinaryReader;
			_br.init(binData);
		}
		
		static public function test(binData:ByteArray) : Boolean
		{
			var sign:Array = [ 71, 73, 70 ];
			
			for (var i:int = sign.length - 1; i >= 0 ; i--) {
				if (binData[i] != sign[i]) {
					return false;
				}
			}
			return true;
		}
		
		
		public function info() : Object
		{
			var a:uint = _br.BYTE(6),
				b:uint = _br.BYTE(7),
				c:uint = _br.BYTE(8),
				d:uint = _br.BYTE(9);
			
			return {
				width: b * 256 + a,
				height: d * 256 + c,
				type: GIF.MIME
			}
		}
		
		
		public function metaInfo() : Object
		{
			return {};
		}
		
		
		private function _getChunkAt(idx:uint) : Object
		{
			var length:uint, type:String, start:uint, CRC:uint;
			
			length = _br.LONG(idx);
			type = _br.STRING(idx += 4, 4);
			start = idx += 4;	
			CRC = _br.LONG(idx + length);
			
			return {
				length: length,
				type: type,
				start: start,
				CRC: CRC
			};
		}
		
		public function purge() : void
		{
			_br.clear();
		}
		
	}
	
}

