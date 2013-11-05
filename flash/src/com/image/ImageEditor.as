package com.image
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.filters.BlurFilter;
	import flash.filters.ColorMatrixFilter;
	import flash.filters.ConvolutionFilter;
	import flash.geom.ColorTransform;
	import flash.geom.Matrix;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	
	import com.image.ascb.filters.ColorMatrixArrays;
	import com.image.ascb.filters.ConvolutionMatrixArrays;
	
	
	public class ImageEditor
	{	
		private var _history:Array = [];
		
		private var _historyIndex:int = -1;
		
		private var _lastReleaseIndex:int = 0;
		
		private var _bdOriginal:BitmapData;
		
		private var _bd:BitmapData;
		
		public function get bitmapData() : BitmapData {
			return (_bd ? _bd : _bdOriginal).clone();
		}
		
		private var _crop:Rectangle = null;		
		
		private var _matrix:Matrix = new Matrix();
				
		private var _commitAfterEveryModify:Boolean = false;
		
		
		public function ImageEditor(bd:BitmapData)
		{
			_bdOriginal = bd.clone();
		}
		
		
		public function modify(op:String, ... args) : void
		{	
			if (canRedo()) {
				_history.length = _historyIndex + 1; // discard extra redoable ops
			}
			
			_history.push({
				'op': op,
				'args': args
			});

			if (_commitAfterEveryModify) {
				commit();
			}
			
			_historyIndex++;
		}
		
		
		public function commit() : void
		{
			_doModifications(_lastReleaseIndex, _historyIndex); // do only incremental modifications if possible
			_lastReleaseIndex = _historyIndex;
			_matrix = new Matrix();
		}
		
		
		public function canUndo() : Boolean
		{
			return !!_history.length;
		}
		
		
		public function canRedo() : Boolean
		{
			return _historyIndex < _history.length;
		}
		
		
		public function undo() : void
		{
			if (canUndo()) {	
				_historyIndex--;
				
				if (_historyIndex < _lastReleaseIndex) {
					_lastReleaseIndex = 0;
					if (_bd) {
						_bd.dispose();
						_bd = null;
					}
					_matrix = new Matrix();
				}
			}
		}
		
		public function redo() : void
		{
			if (canRedo()) {
				_historyIndex++;
			}	
		}
		
		
		public function purge() : void 
		{
			if (_bd) {
				_bd.dispose();
			}
			_bdOriginal.dispose();
		}
		
		
		protected function _doModifications(start:int, end:int) : void
		{		
			if (!_bd) {
				_bd = _bdOriginal.clone();
			}
			
			var mod:Object;
			for (var i:int = start; i <= end; i++) {
				mod = _history[i];
				if (typeof(this[mod.op]) == 'function') {
					this[mod.op].apply(null, mod.args);
				} 
			}
			
			_draw();
		}
		
		
		protected function rotate(angle:Number) : void
		{		
			_matrix.translate(-_bd.width/2,-_bd.height/2);
			_matrix.rotate(angle / 180 * Math.PI);
			_matrix.translate(_bd.width/2,_bd.height/2);
		}
		
		protected function flipH() : void
		{
			_matrix.scale(-1, 1);
			_matrix.translate(_bd.width, 0);
		}
		
		
		protected function flipV() : void
		{
			_matrix.scale(1, -1);
			_matrix.translate(0, _bd.height);
		}
		
		protected function resize(w:Number, h:Number) : void
		{
			_matrix.scale(w / _bd.width, h / _bd.height);
		}
		
		
		protected function crop(rect:Rectangle) : void
		{
			
		}
		
		
		protected function sharpen() : void
		{
			applyConvolution(ConvolutionMatrixArrays.SHARPEN);
		}
		
		protected function emboss() : void
		{
			applyConvolution(ConvolutionMatrixArrays.EMBOSS);
		}
		
		protected function grayscale() : void
		{
			applyColorMatrix(ColorMatrixArrays.GRAYSCALE);
		}
		
		protected function sepia() : void
		{
			applyColorMatrix(ColorMatrixArrays.SEPIA);
		}
		
		
		protected function invert() : void
		{
			applyColorMatrix(ColorMatrixArrays.DIGITAL_NEGATIVE);
		}
		
		
		protected function brightness(value:int) : void
		{			
			applyColorMatrix(ColorMatrixArrays.getBrightnessArray(Math.floor(255 * value)));
		}
		
		
		protected function contrast(value:Number) : void
		{	
			applyColorMatrix(ColorMatrixArrays.getContrastArray(value));
		}
		
		protected function saturate(value:Number) : void
		{	
			applyColorMatrix(ColorMatrixArrays.getSaturationArray(value));
		}
		
		
		protected function blur(value:Number = 0.02, quality:int = 1) : void
		{
			if (!_bd) {
				_bd = _bdOriginal.clone();
			}
			
			value = Math.floor(255 * value);
			
			if (value & 1) {
				value--; // even values are processed faster
			}
			
			_bd.applyFilter(_bd, _bd.rect, new Point(0, 0), new BlurFilter(value, value, quality));
		}
		
		
		protected function applyConvolution(matrix:Array, devisor:Number = 1.0) : void
		{
			if (!_bd) {
				_bd = _bdOriginal.clone();
			}
			_bd.applyFilter(_bd, _bd.rect, new Point(0, 0), new ConvolutionFilter(3, 3, matrix, devisor));
		}
		
		
		protected function applyColorMatrix(matrix:Array) : void
		{
			if (!_bd) {
				_bd = _bdOriginal.clone();
			}
			_bd.applyFilter(_bd, _bd.rect, new Point(0, 0), new ColorMatrixFilter(matrix));
		}
		
		
		private function _draw() : void
		{	
			// Finding the four corners of the bounfing box after transformation
			var tl:Point = _matrix.transformPoint(new Point(0, 0));
			var tr:Point = _matrix.transformPoint(new Point(_bd.width, 0));
			var bl:Point = _matrix.transformPoint(new Point(0, _bd.height));
			var br:Point = _matrix.transformPoint(new Point(_bd.width, _bd.height));
			
			// Calculating "who" is "where"
			var top:Number = Math.min(tl.y, tr.y, bl.y, br.y);
			var bottom:Number = Math.max(tl.y, tr.y, bl.y, br.y);
			var left:Number = Math.min(tl.x, tr.x, bl.x, br.x);
			var right:Number = Math.max(tl.x, tr.x, bl.x, br.x);
			
			// Ajusting final position
			_matrix.translate(-left, -top);
			
			// Calculating the size of the new BitmapData
			var width:Number = right - left;
			var height:Number = bottom - top;
			
			// Creating and drawing (with transformation)
			var result:BitmapData = new BitmapData(width, height);
			result.draw(_bd, _matrix);	
			_bd.dispose();
			_bd = result;
		}
		
		
	}
}