package com
{
	import com.errors.DOMError;
	import com.events.OErrorEvent;
	import com.events.OProgressEvent;
	import com.utils.Base64;
	import com.utils.Buffer;
	import com.utils.OEventDispatcher;
	
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	
	public class FileReader extends OEventDispatcher
	{
		// events dispatched by this class
		public static var dispatches:Object = { 
			"LoadStart": Event.OPEN,
			"Progress": OProgressEvent.PROGRESS,
			"Load": Event.COMPLETE,
			"Error": OErrorEvent.ERROR
		};
		
		public static const EMPTY:int = 0;
		public static const LOADING:int = 1;
		public static const DONE:int = 2;
		
		public var readyState:int = FileReader.EMPTY;
		public var result:*;
		
		private var _blob:*;
		private var _index:int = 0;
		private var _position:int = 0;
		private var _src:Object;
		
		private var _sizeRatio:Number = 1;
		private var _notCachedSize:uint = 0;
		
		private var _op:String;
		
		private var _ba:ByteArray = new ByteArray;
		private var _str:String;
		
		
		public function readAsByteArray(blob:*) : void {
			_op = "asByteArray";
			_read(blob); 
		}
		
		public function readAsBase64(blob:*) : void {
			_str = '';
			_op = "asBase64";
			_read(blob); 
		}
		
		public function abort() : void {	
			if (this.readyState !== FileReader.LOADING) {
				return;
			}
						
			if (_src && _src.buffer.fileRef) {
				_src.buffer.fileRef.cancel();
				_removeAllEventListeners(_src.dataObject.fileRef);
			}
			
			clear();
			
			this.readyState = FileReader.DONE;
		}
		
		
		public function clear() : void {
			if (this.result is ByteArray) {
				this.result.clear();
			} else if (this.result is String) {
				this.result = '';
			}
			this.result = null;
		}
		
		
		private function _read(blob:*) : void {
						
			if (typeof blob === 'string') {
				blob = Uploader.compFactory.get(blob);
			}
									
			if (!blob || !(blob is Blob) || blob.isEmpty()) {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, DOMError.NOT_FOUND_ERR));
				return;
			}
						
			if (this.readyState === FileReader.LOADING) {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, DOMError.SECURITY_ERR)); // should be invalid state
				return;
			}
			
			_blob = blob;
						
			_sizeRatio = _blob.size / _blob.realSize;
			_notCachedSize = _blob.realSize - _blob.cachedSize;
						
			this.readyState = FileReader.LOADING;
			
			dispatchEvent(new Event(Event.OPEN));
			
			_ba.clear();
			_index = 0;
			_src = blob._sources[_index++];
			
			// this will run recursively until all DataSources are read and concatenated into _ba
			_loadSource(); 
		}
		
		private function _loadSource() : void {	
			var buffer:Buffer = _src.buffer;
			
			if (this.readyState != FileReader.LOADING) { // it might have been aborted by now
				return;
			}
			
			if (buffer.data && buffer.data.length) {	
				onComplete({ // mimic event object structure
					type: Event.COMPLETE,
					target: {
						data: buffer.data
					}
				});
			} else if (buffer.fileRef) {
                _blob.setLoading(true);
                buffer.fileRef.addEventListener(ProgressEvent.PROGRESS, onProgress);
				buffer.fileRef.addEventListener(Event.COMPLETE, onComplete);
				buffer.fileRef.addEventListener(IOErrorEvent.IO_ERROR, onIOError);
				buffer.fileRef.load();
			} else {
				onIOError({ 
					type: IOErrorEvent.IO_ERROR,
					target: {}
				});
			}
		}
		
		
		private function onProgress(e:ProgressEvent) : void {
			var bytesLoaded:*;
			
			e.stopPropagation();
			
			// hold the value within the size of the blob
			bytesLoaded = Math.floor((e.bytesLoaded + _position) * _sizeRatio);
			
			// Moxie.log([bytesLoaded, _blob.size]);
			
			dispatchEvent(new ProgressEvent(ProgressEvent.PROGRESS, false, false, bytesLoaded, _blob.size));
		}
		
		
		private function onIOError(e:*) : void {
			this.readyState = FileReader.DONE;
			clear();
			_removeAllEventListeners(e.target);
			dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, DOMError.NOT_READABLE_ERR));		
		}		
		
		
		private function onComplete(e:*) : void {
			var length:Number, data:ByteArray;
			
			this.readyState = FileReader.DONE;
						
			if (e.target is FileReference) { // this func might be called directly
				_removeAllEventListeners(e.target);
			}
									
			length = _src.end - _src.start;
			data = e.target.data;
			
			data.position = _src.start;
			data.readBytes(_ba, 0, length);
			
			_position += length;
									
			_index++;
			if (_blob._sources[_index]) {
				_src = _blob._sources[_index];
				_loadSource();
			} else if (_position === _blob.size) { 
				_finalize(); // we've reached the end, send the blob data out
			}
		}
		
		
		private function _removeAllEventListeners(target:*) : void {
            _blob.setLoading(false);
            target.removeEventListener(ProgressEvent.PROGRESS, onProgress);
			target.removeEventListener(Event.COMPLETE, onComplete);
			target.removeEventListener(IOErrorEvent.IO_ERROR, onIOError);
		}
		
		
		private function _finalize() : void {			
			switch (_op) {
				case 'asByteArray':
					this.result = _ba;
					_ba = null;
					break;
				
				case 'asBase64':
					_toBase64();
					this.result = _str;
					_ba.clear(); // we won't be needing this one in this case anymore
					_str = null;
					break;
			}
			
			dispatchEvent(new Event(Event.COMPLETE));
		}
		
		
		private function _toBase64() : void {
			var base64:String, chunk_size:uint, chunk:ByteArray, length:uint, loaded:uint;
			
			// by this moment _ba should be populated with binary data
			if (!_ba.length) {
				return;
			}
			
			chunk_size = 204798; // bytes, should divide by three
			chunk = new ByteArray;
			length = _ba.length;
			loaded = 0;
			
			_ba.position = 0;
			
			while (_ba.bytesAvailable > 0) {
				
				if (chunk_size > _ba.bytesAvailable) {
					chunk_size = _ba.bytesAvailable; // last chunk might be small
				}
				
				_ba.readBytes(chunk, 0, chunk_size);
				
				loaded += chunk_size;
				
				base64 = Base64.encode(chunk);
				_str += base64;
				chunk.clear();
				
				dispatchEvent(new OProgressEvent(OProgressEvent.PROGRESS, (loaded < length ? loaded : length), length, base64));
			}
		}
		
		
	}
}