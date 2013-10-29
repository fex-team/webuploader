package com.utils
{
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	
	public class Zhenpin
	{
		private static var sound:Sound;
		private static var st:SoundChannel;
		public static var hasStart:Boolean = false;
		public function Zhenpin()
		{
		}
		
		public static function start():void{
			sound = new BlankSound();
			sound.addEventListener(IOErrorEvent.IO_ERROR, onError);
			st = sound.play();
			st.addEventListener(Event.SOUND_COMPLETE, onComp);
			
			hasStart = true;
		}
		
		private static function onComp(e:Event):void{
			st.removeEventListener(Event.SOUND_COMPLETE, onComp);
			st = sound.play();
			st.addEventListener(Event.SOUND_COMPLETE, onComp);
		}
		
		private static function onError(e:Object):void{
		}
	}
}