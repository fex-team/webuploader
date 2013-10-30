package com.errors
{
	public class DOMError extends Error
	{
		public static const NOT_FOUND_ERR:uint = 1;
		public static const SECURITY_ERR:uint = 2;
		public static const ABORT_ERR:uint = 3;
		public static const NOT_READABLE_ERR:uint = 4;
		public static const ENCODING_ERR:uint = 5;
		
		public function DOMError(id:int = 0) {
			super("", id);
		}
	}
}