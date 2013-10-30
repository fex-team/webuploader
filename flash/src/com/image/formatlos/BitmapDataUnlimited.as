/*
Copyright (c) 2008 Martin Raedlinger (mr@formatlos.de)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

package com.image.formatlos
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.DisplayObject;
	import flash.display.IBitmapDrawable;
	import flash.display.Loader;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.geom.ColorTransform;
	import flash.geom.Matrix;
	import flash.geom.Point;
	import flash.geom.Rectangle;

	import com.image.formatlos.events.BitmapDataUnlimitedEvent;

	/**
 	 * Dispatched when the BitmapData is ready
 	 *
 	 * @eventType com.formatlos.events.BitmapDataUnlimitedEvent
 	 */
	[Event(name='COMPLETE', type='com.image.formatlos.events.BitmapDataUnlimitedEvent')]

	/**
 	 * Dispatched when the BitmapData can't be created due to memory issues.
 	 * watch your system memory and/or System.totalMemory
 	 *
 	 * @eventType com.formatlos.events.BitmapDataUnlimitedEvent
 	 */
	[Event(name='ERROR', type='com.image.formatlos.events.BitmapDataUnlimitedEvent')]

	// ---------------------------------------------------------------------------

	/**
	 * The BitmapDataUnlimited Class creates an empty gif image
	 *
	 * @author Martin Raedlinger
	 *
	 * @example
	 * The example shows how to use the BitmapDataUnlimited
	 * <div class="listing">
	 * <pre>
	 *
	 * var bdu:BitmapDataUnlimited = new BitmapDataUnlimited();
	 * bdu.addEventListener(BitmapDataUnlimitedEvent.COMPLETE, onBmpReady);
	 * bdu.create(5000, 5000, true);
	 *
	 * var hugeBitmapData : BitmapData;
	 *
	 * function onBmpReady(event : BitmapDataUnlimitedEvent) : void
	 * {
	 * 	  hugeBitmapData = bdu.bitmapData;
	 *
	 * 	  var rect : Rectangle = new Rectangle(10, 10, 10, 10);
	 *
	 *    hugeBitmapData.fillRect(rect, 0xffff0000);
	 * 	  addChild(new Bitmap(hugeBitmapData));
	 *
	 * 	  trace("BitmapData: w=" + hugeBitmapData.width + " h=" + hugeBitmapData.height);
	 * }
	 *
	 * </pre>
	 * </div>
	 *
	 */
	public class BitmapDataUnlimited extends EventDispatcher
	{
		// basically this value is 4096, but take 4000 to have some buffer
		static private const DRAW_LIMIT : uint = 4000;

		private var _loader : Loader;
		private var _gif : Gif;
		private var _fillColor : uint;
		private var _transparent : Boolean;


		// created bitmapData
		private var _bitmapData : BitmapData;

		/**
		 * Returns the created BitmapData Object
		 *
		 * @return Huge BitmapData
		 */
		public function get bitmapData() : BitmapData
		{
			return _bitmapData;
		}


		/**
		 * Creates a huge BitmapData object.
		 *
		 * @param width The width of the huge BitmapData
		 * @param height The height of the huge BitmapData
		 * @param transparent transparent BitmapData or not
		 * @param fillColor Fill the BitmapData with color
		 */
		public function create(width_ : int, height_ : int, transparent_ : Boolean = true, fillColor_ : uint = 0xFFFFFF) : void
		{
			try
			{
				_bitmapData = new BitmapData(width_, height_, transparent_, fillColor_);
				dispatchComplete();
			}
			catch(error : ArgumentError)
			{
				if(width_ <= 0 || height_ <= 0)
				{
					throw error;
				}
				else
				{
					_transparent = transparent_;
					_fillColor = fillColor_;

					_gif = new Gif(width_, height_, transparent_, fillColor_);
					_loader = new Loader();
					_loader.contentLoaderInfo.addEventListener(Event.COMPLETE, onLoaderComplete);
					_loader.loadBytes(_gif.bytes);
				}
			}
		}

		/**
		 * Bypasses the 4096px limit in BitmapData.draw() and draws the source display object onto the bitmap image.
		 *
		 * @see http://blog.formatlos.de/2008/12/11/bitmapdatadraw-is-limited-to-4096px/
		 *
		 * @param source_ The display object or BitmapData object to draw to the BitmapData object. (The DisplayObject and BitmapData classes implement the IBitmapDrawable interface.)
		 * @param colorTransform_ A ColorTransform object that you use to adjust the color values of the bitmap. If no object is supplied, the bitmap image's colors are not transformed
		 * @param blendMode_ A string value, from the flash.display.BlendMode class, specifying the blend mode to be applied to the resulting bitmap.
		 * @param clipRect_ A Rectangle object that defines the area of the source object to draw. If you do not supply this value, no clipping occurs and the entire source object is drawn.
		 * @param smoothing_ A Boolean value that determines whether a BitmapData object is smoothed
		 */
		public function draw(source_ : IBitmapDrawable, matrix_ : Matrix = null, colorTransform_ : ColorTransform = null, blendMode_ : String = null, clipRect_:Rectangle = null, smoothing_ : Boolean = false) : void
		{
			var srcRect : Rectangle;

			if (source_ is BitmapData) srcRect = (source_ as BitmapData).rect.clone();
			else if (source_ is DisplayObject) srcRect = (source_ as DisplayObject).getBounds(source_ as DisplayObject);


			if(srcRect)
			{
				var x : int = (clipRect_) ? clipRect_.x : 0;
				var y : int = (clipRect_) ? clipRect_.y : 0;
				var clipWidth : int = (clipRect_) ? clipRect_.right : _bitmapData.width;
				var clipHeight : int = (clipRect_) ? clipRect_.bottom : _bitmapData.height;
				var xMax : int = Math.min(srcRect.right, clipWidth);
				var yMax : int = Math.min(srcRect.bottom, clipHeight);
				var matrix : Matrix;
				var chunk : BitmapData;
				var clip : Rectangle = new Rectangle();

				if(matrix_) {
					xMax *= matrix_.a;
					yMax *= matrix_.d;
				}

				while(x < xMax)
				{
					while(y < yMax)
					{
						matrix = new Matrix();
						if(matrix_) {
							matrix.a = matrix_.a;
							matrix.d = matrix_.d;
						}
						matrix.translate(-x, -y);
						clip.width = (xMax - x >= DRAW_LIMIT) ? DRAW_LIMIT : xMax - x;
						clip.height = (yMax - y >= DRAW_LIMIT) ? DRAW_LIMIT : yMax - y	;

						// use source
						if(x == 0 && y == 0)
						{
							_bitmapData.draw(source_, matrix, colorTransform_, blendMode_, clip, smoothing_);
						}
						// copy to chunk first
						else
						{
							if(!chunk) chunk = _bitmapData.clone();
							chunk.fillRect(chunk.rect, (!_transparent) ? _fillColor : 0x00000000 );
							chunk.draw(source_, matrix, colorTransform_, blendMode_, clip, smoothing_);
							_bitmapData.copyPixels(chunk, chunk.rect, new Point(x, y), null, null, true);

						}

						y += DRAW_LIMIT;
					}

					x += DRAW_LIMIT;
					y = 0;
				}

				if(chunk)
				{
					chunk.dispose();
					chunk = null;
				}
			}
		}


		private function onLoaderComplete(event : Event) : void
		{
			var ok:Boolean = true;

			try
			{
				_bitmapData = Bitmap(_loader.content).bitmapData.clone();
				if(!_transparent) _bitmapData.fillRect(_bitmapData.rect, _fillColor);
			}
			catch(error : ArgumentError)
			{
				ok = false;
				dispatchEvent(new BitmapDataUnlimitedEvent(BitmapDataUnlimitedEvent.ERROR));
			}

			_loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, onLoaderComplete);
			_loader = null;

			if(ok) dispatchComplete();
		}

		private function dispatchComplete() : void
		{
			dispatchEvent(new BitmapDataUnlimitedEvent(BitmapDataUnlimitedEvent.COMPLETE));
		}

	}
}