package com.utils
{
	import com.events.URLStreamProgressEvent;
	
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IEventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TimerEvent;
	import flash.external.ExternalInterface;
	import flash.net.URLRequest;
	import flash.net.URLRequestHeader;
	import flash.net.URLRequestMethod;
	import flash.net.URLStream;
	import flash.utils.ByteArray;
	import flash.utils.Timer;
	
	
	public class URLStreamProgress extends OEventDispatcher
	{
		private var _options:Object = {};
		
		public static var speed:uint = 512000; // number of bytes per 500ms
		
		public static var rate:uint = 50;
		
		private var _progressTimer:Timer;
		
		private var _bytesLoaded:uint = 0;
		
		private var _bytesTotal:uint = 0;
		
		
		public function URLStreamProgress(options:Object = null) 
		{
			_options = Utils.extend({
				url: 'webuploader' + new Date().getTime(),
				size: 307200
			}, options);	
		}
		
		
		public static function calculateSpeed(size:uint, time:uint) : void
		{			
			URLStreamProgress.speed = Math.ceil(size * URLStreamProgress.rate / Math.max(time - 30, 3));			
		}
		
		
		public function start(bytesTotal:uint) : void
		{			
			var onProgress:Function;
			
			if (!URLStreamProgress.speed) {
				addEventListener(URLStreamProgressEvent.PROBE_COMPLETE, function() : void { 
					start(bytesTotal); 
				}, false, 0, true);
				probe();
				return;
			}
			
			dispatchEvent(new Event(Event.OPEN));
			
			_bytesTotal = bytesTotal;
			
			onProgress = function() : void {
				_bytesLoaded += URLStreamProgress.speed;
				if (_bytesLoaded < _bytesTotal) {
					dispatchEvent(new ProgressEvent(ProgressEvent.PROGRESS, false, false, _bytesLoaded, _bytesTotal));
				} else {
					dispatchEvent(new ProgressEvent(ProgressEvent.PROGRESS, false, false, _bytesTotal, _bytesTotal));
					stop();
					dispatchEvent(new Event(Event.COMPLETE));
				}
			};
			_progressTimer = new Timer(URLStreamProgress.rate);
			_progressTimer.addEventListener(TimerEvent.TIMER, onProgress, false, 0, true);
			_progressTimer.start();
		}
		
		
		public function stop() : void 
		{
			if (_progressTimer) {
				_progressTimer.stop();	
				_bytesLoaded = _bytesTotal = 0;
			}
		}
		
		
		public function probe() : void
		{
			var stream:URLStream, request:URLRequest,
				onComplete:Function,
				start:Date, end:Date;
																	
			request = new URLRequest(_options.url);
			request.method = URLRequestMethod.POST;
			request.data = _generateByteArray(_options.size);
			
			start = new Date;
			
			onComplete = function(e:* = null) : void {
				end = new Date;
				URLStreamProgress.calculateSpeed(_options.size, end.time - start.time);
				dispatchEvent(new URLStreamProgressEvent(URLStreamProgressEvent.PROBE_COMPLETE));
			};
			
			stream = new URLStream;
			stream.addEventListener(Event.COMPLETE, onComplete, false, 0, true);
			stream.addEventListener(IOErrorEvent.IO_ERROR, onComplete, false, 0, true);
			stream.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onComplete, false, 0, true);
			stream.load(request);
			
		}
		
		
		private function _generateByteArray(size:uint = 307200) : ByteArray
		{
			var ba:ByteArray, replicator:ByteArray;
			
			ba = new ByteArray;
			
			replicator = new ByteArray;
			replicator.writeByte(0xE0);
			replicator.writeByte(0xA5);
			replicator.writeByte(0x90);
			
			size = Math.ceil(size / replicator.length);
						
			for (var i:uint = 0; i < size; i++) {
				ba.writeBytes(replicator);
			}
			
			return ba;
		}
	}
}