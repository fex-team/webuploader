package com.events
{	
	import flash.events.Event;

	public class URLStreamProgressEvent extends Event
	{
		public static const PROBE_COMPLETE:String = 'probecomplete';
		
		public function URLStreamProgressEvent(type:String)
		{
			super(type, false, false);
		}
		
		public override function clone() : Event {
			return new URLStreamProgressEvent(type);
		}
	}
}