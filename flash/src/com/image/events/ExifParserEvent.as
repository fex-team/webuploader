/**
 * Copyright 2011, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

package com.image.events {
	import flash.events.Event;

	public class ExifParserEvent extends Event {

		public var data:Object;

		public static const EXIF_DATA:String = 'exifdata';
		public static const GPS_DATA:String = 'gpsdata';

		function ExifParserEvent(type:String, data:Object) {
			this.data = data;
			super(type);
		}

		override public function clone() : Event
		{
			return new ExifParserEvent(type, data);
		}
	}
}