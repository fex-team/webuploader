package com.events
{
	import flash.events.Event;
	import flash.events.ProgressEvent;

	public class OProgressEvent extends ProgressEvent
	{
		public static const PROGRESS:String = 'webuploaderprogress';
		
		public var data:*;
		
		public function OProgressEvent(type:String, bytesLoaded:uint = 0, bytesTotal:uint = 0, data:* = null)
		{
			this.data = data;
			super(type, true, false, bytesLoaded, bytesTotal);						
		}
		
		public override function clone() : Event {
			return new OProgressEvent(type, bytesLoaded, bytesTotal, data);
		}
	}
}