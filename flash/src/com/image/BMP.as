/**
 * Copyright 2011, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

package com.image
{
	import com.utils.BinaryReader;
	
	import flash.utils.ByteArray;
	
	public class BMP 
	{		
		public static const MIME:String = 'image/bmp';
		
		protected var _br:BinaryReader;
		
		public function BMP(binData:ByteArray)
		{
			_br = new BinaryReader;
			_br.init(binData);
		}
		
		static public function test(binData:ByteArray) : Boolean
		{
			var sign:Array = [ 66, 77 ];
			
			for (var i:int = sign.length - 1; i >= 0 ; i--) {
				if (binData[i] != sign[i]) {
					return false;
				}
			}
			return true;
		}
		
		
		public function info() : Object
		{
			var a:uint = _br.BYTE(18),
				b:uint = _br.BYTE(19),
				c:uint = _br.BYTE(22),
				d:uint = _br.BYTE(23);
			
			return {
				width: b * 256 + a,
				height: d * 256 + c,
				type: BMP.MIME
			}
		}
		
		
		public function metaInfo() : Object
		{
			return {};
		}
		
		public function purge() : void
		{
			_br.clear();
		}
		
	}
	
}

