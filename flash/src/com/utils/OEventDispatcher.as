package com.utils
{
	import flash.events.EventDispatcher;
	
	public class OEventDispatcher extends EventDispatcher
	{
		private var _events:Object = [];
		
		public override function addEventListener(type:String, callback:Function, useCapture:Boolean = false, priority:int = 0, useWeak:Boolean = false) : void
		{
			if (hasListener(type, callback, useCapture)) {
				return;
			}
			
			_events.push({
				type: type,
				callback: callback,
				useCapture: useCapture
			});
			
			super.addEventListener(type, callback, useCapture, priority, useWeak); 
		}
		
		public override function removeEventListener(type:String, callback:Function, useCapture:Boolean=false):void
		{			
			var index:uint, e:Object;
			
			index = hasListener(type, callback, useCapture);
			if (index === false) {
				return;
			}
			
			e = _events.splice(index, 1);
			super.removeEventListener(e.type, e.callback, e.useCapture);
		}
		
		
		public function hasListener(type:String, callback:Function = null, useCapture:Boolean = false): *
		{
			for (var i:uint = 0, length:uint = _events.length; i < length; i++) {
				if (type == _events[i].type && callback == _events[i].callback && _events[i].useCapture == useCapture) {
					return i;
				}
			} 
			return false;
		}
		
		/* anyone any idea why Flash doesn't have a call like this?.. */
		public function removeAllEventsListeners() : void
		{
			for (var i:uint = 0, length:uint = _events.length; i < length; i++) { 
				super.removeEventListener(_events[i].type, _events[i].callback, _events[i].useCapture); // call super method directly
			}
			_events = [];
		}
	}
}