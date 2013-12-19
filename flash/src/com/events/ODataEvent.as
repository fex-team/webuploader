package com.events
{
	import flash.events.Event;
	
	public class ODataEvent extends Event
	{
		public static const DATA:String = 'webuploaderdata';
		
		public var data:*;
		
		public function ODataEvent(type:String, data:* = null)
		{
			this.data = data;
			super(type, bubbles, cancelable);
		}
		
		public override function clone() : Event {
			return new ODataEvent(type, data);
		}
	}
}