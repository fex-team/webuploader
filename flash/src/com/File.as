package com
{
	import com.utils.Utils;

	public class File extends Blob
	{
		private var _name:String = '';
		public function get name() : String {
			if (_name !== '') {
				return _name;
			}
			// if source is not a FileReference return default name
			if (!isFileRef()) {
				return uid;
			}
			// otherwise return original name
			return _sources[0].buffer.fileRef.name;
		}
				
		
		private var _lastModifiedDate:Date;
		public function get lastModifiedDate() : Date {
			if (!isFileRef()) {
				return new Date();
			}
			return _sources[0].buffer.fileRef.modificationDate;
		}
				
		
		public function File(sources:Array, properties:* = null)
		{
			if (properties is Object && properties.hasOwnProperty('name')) {
				_name = properties.name;
			}

            super(sources, properties);
		}
		
		
		public override function isFileRef() : Boolean 
		{
			return !!(_sources.length === 1 && _sources[0].buffer.fileRef);
		}
		
		
		public override function toObject() : Object 
		{
			return Utils.extend(super.toObject(), {
				name: name,
				lastModifiedDate: lastModifiedDate
			});
		}
		
	}
}