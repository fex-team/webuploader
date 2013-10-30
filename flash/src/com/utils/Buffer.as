package com.utils
{
	import flash.net.FileReference;
	import flash.utils.ByteArray;

	public class Buffer
	{		
		private var _data:ByteArray;
		public function get data() : ByteArray {
			if (_fileRef && _fileRef.data) {
				_data = _fileRef.data
			}
			return _data;
		}
				
		private var _fileRef:FileReference;
		public function get fileRef() : FileReference {
			return _fileRef;
		}
		
		public function get size() : uint {
			if (_fileRef) {
				return _fileRef.size;
			} else if (_data) {
				return _data.length;
			}
			return 0;
		}
		
		public var refs:uint = 1; // counting references to this object
		
		public function Buffer(source:*)
		{			
			if (source is FileReference) {
				_fileRef = source;
			} else if (source is ByteArray) {
				_data = source;
			} else {
				// throw wrong type exception
			}
		}
		
		public function isEmpty() : Boolean 
		{
			return !_data || !_data.length;
		}
		
		
		public function purge() : void {
			if (_fileRef && _fileRef.data.length) {
				_fileRef.data.clear();
			}
		}
		
		public function destroy() : void {
			if (_data && _data.length) {
				_data.clear();
			}
			purge();
		}
	}
}