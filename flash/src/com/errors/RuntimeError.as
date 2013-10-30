package com.errors
{
	public class RuntimeError extends Error
	{
		public static const NOT_INIT_ERR:uint = 1;
		public static const NOT_SUPPORTED_ERR:uint = 9;
		public static const JS_ERR:uint = 4;
		public static const OUT_OF_MEMORY:uint = 5;
		public static const INVALID_STATE_ERR:uint = 11;
		public static const SYNTAX_ERR:uint = 12;
		public static const COMP_CONFLICT:uint = 23;
		
		public function RuntimeError(id:* = 0) {
			super("", id);
		}
	}
}