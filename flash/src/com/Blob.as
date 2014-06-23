package com
{
	import com.utils.Buffer;
	
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	import com.utils.Utils;

	public class Blob
	{	
		private var _uid:String;
		public function get uid() : String {
			return _uid;
		}		
		
		private var _size:Number;		
		public function	get size() : Number {
			return _size;
		}
		
		private var _type:String = '';

        public function get type() : String {
            if (_type !== '') {
                return _type;
            }
            // if source is not a FileReference return default name
            if (!isFileRef()) {
                return _type;
            }

            // otherwise return original name
            return ''; //_sources[0].buffer.fileRef.type;
        }
		
		// cumulative size of all the sources this blob is part of
		public function get realSize() : uint {
			var src:Object, size:uint = 0;
			
			for each (src in _sources) {
				size += src.buffer.size;
			}
			return size;
		}
		
		// cumulative size of all preloaded sources this blob is part of
		public function get cachedSize() : uint {
			var src:Object, size:uint = 0; 
			
			for each (src in _sources) {
				if (!src.buffer.data) {
					continue;
				}
				size += src.buffer.data.length;
			}
			return size;
		}
		
		public var _sources:Array = [];
		
		protected var _pointer:Number = 0;
		
		
		public function Blob(sources:Array, properties:* = null) 
		{			
			for each (var source:* in sources) {
				if (source is FileReference) {
					_sources.push({
						buffer: new Buffer(source),
						start: 0,
						end: source.size
					});
					_pointer += source.size;
				} else if (source is ByteArray) {
					_sources.push({
						buffer: new Buffer(source),
						start: 0,
						end: source.length
					});
					_pointer += source.length;
				} else if (source is Blob) {
					// increment reference counters for associated buffers
					for (var i:uint = 0, max:uint = source._sources.length; i < max; i++) {
						source._sources[i].buffer.refs++;
					}
					// simply copy over the sources
					_sources.push.apply(source._sources);
					_pointer += source.size;
				} else if (source.hasOwnProperty('buffer') && source.buffer is Buffer) {
					_sources.push({
						buffer: source.buffer,
						start: source.start,
						end: source.end
					});
					_pointer += source.end - source.start;
				}
			}
			
			if (properties is String) {
				_type = properties;
			} else if (properties is Object && properties.hasOwnProperty('type')) {
				_type = properties.type;
			}
			
			_size = _pointer;
			_uid = Utils.guid('uid_');
		}
		
		public function slice(... args) : Object 
		{
			var blob:Blob = _slice.apply(null, args);
			Uploader.compFactory.add(blob.uid, blob);
			return blob.toObject(); 
		}
		
		
		private function _slice(... args) : Blob {
			var src:Object, 
				start:int = args[0] || 0, 
				end:int = args[1] || _size, 
				contentType:String = args[2] || '',
				size:uint, offset:uint = 0,
				sources:Array = [];
							
			if (start > end) {
				return new Blob([], contentType); 
			}
			
			for (var i:uint = 0, length:uint = _sources.length; i < length; i++) {
				src = _sources[i];
				size = src.end - src.start;
								
				if (start > offset + size) { // start is outside of the current source's boundaries 
					continue;
				}
				
				// Moxie.log([src.start, src.end, start, end, size]);
								
				sources.push({
					buffer: src.buffer,
					start: src.start + start - offset,
					end: Math.min(src.end, end)
				});
				offset += size;
				break;
			}
			
			if (i == length || offset > end) {
				return new Blob(sources, contentType);
			} 
			
			// loop for the end otherwise
			for (; i < length; src = _sources[i], i++) {
				offset += src.end - src.start;
				if (offset < end) {
					sources.push(src);
				} else {
					sources.push({
						buffer: src.buffer,
						start: src.start,
						end: src.end - (offset - end)
					});
					break; // we have found the end
				}
			}
			
			return new Blob(sources, contentType);
		}
		
		public function isEmpty() : Boolean {
			return !this._sources.length;
		}
		
		
		public function isFileRef() : Boolean 
		{
			return false; // Blob as a rule contains only part of the source
		}

        private var _isLoading:Boolean =false;
        public function isLoading() : Boolean {
            return _isLoading;
        }
        public function setLoading(val:Boolean):void {
            _isLoading = val;
        }
		
		
		public function getFileRef() : FileReference {
			if (isFileRef()) {
				return _sources[0].buffer.fileRef;
			}
			return null;
		}
		
		
		public function toObject() : Object 
		{
			return {
				uid: uid,
				ruid: Uploader.uid,
				size: size,
				type: type
			};
		}
		
		public function purge() : void
		{			
			for each (var src:Object in _sources) {
				src.buffer.purge();	
			}
		}
		
		
		public function destroy() : void
		{			
			for each (var src:Object in _sources) {
				if (--src.buffer.refs <= 0) {
					src.buffer.destroy();	
				}
			}
			Uploader.compFactory.remove(_uid);
		}
	}
}