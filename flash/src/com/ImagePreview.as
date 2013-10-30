package com
{
	import com.errors.ImageError;
	import com.events.ImageEvent;
	import com.events.ODataEvent;
	import com.events.OErrorEvent;
	import com.events.OProgressEvent;
	import com.image.GIF;
	import com.image.JPEG;
	import com.image.JPEGEncoder;
	import com.image.PNG;
	import com.utils.Base64;
	import com.utils.OEventDispatcher;
	
	import flash.display.BitmapData;
	import flash.display.IBitmapDrawable;
	import flash.display.Loader;
	import flash.display.PNGEncoderOptions;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.external.ExternalInterface;
	import flash.geom.Matrix;
	import flash.system.System;
	import flash.utils.ByteArray;

	public class ImagePreview extends OEventDispatcher
	{
		// events dispatched by this class
		public static var dispatches:Object = { 
			"Progress": OProgressEvent.PROGRESS,
			"Complete": ODataEvent.DATA,
			"Error": OErrorEvent.ERROR
		};
		
		private var _w:uint;
		private var _h:uint;
		private var _orientation:uint = 1;
		private var _ba:ByteArray;
		private var _meta:Object;
		
		public var type:String = 'image/jpeg';
		public var quality:uint = 70;
		public var crop:Boolean = true;
		public var allowMagnify:Boolean = true;
		
		public function init( options:Object = null ):void {
			Utils.extend(this, options);
		}
		
		public function preview( blob:* = null, width:uint = 110, height:uint = 110 ):void {
			var fr:FileReader; 
			
			if (typeof blob === 'string') {
				blob = Uploader.compFactory.get(blob);
			}
			
			if (!blob) {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			_w = width;
			_h = height;
			
			fr = new FileReader;
			
			fr.addEventListener(OProgressEvent.PROGRESS, function(e:OProgressEvent) : void {
				dispatchEvent(e);
			});
			
			fr.addEventListener(Event.COMPLETE, function(e:Event) : void {
				fr.removeAllEventsListeners();
				_loadFromByteArray(fr.result);
				blob.purge();
			});
			
			fr.readAsByteArray(blob);
		}
		
		private function _loadFromByteArray(ba:ByteArray) : void
		{
			var img:*, info:Object, scale:Number, output:BitmapData, selector:Function;
			
			
			if (JPEG.test(ba)) {
				img = new JPEG(ba);		
				img.extractHeaders(); // preserve headers for later
				_meta = img.metaInfo();
			} else if (PNG.test(ba)) {
				img = new PNG(ba);
			} else if ( GIF.test(ba) ) {
				img = new GIF( ba );
			} else {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			var width:uint = _w, height:uint = _h;
			var naturalWidth:uint, naturalHeight:uint;
			info = img.info();
			type = info.type;
			naturalWidth = info.width;
			naturalHeight = info.height;
			
			
			// take into account Orientation tag
			if (type == 'image/jpeg' && _meta.hasOwnProperty('tiff') && _meta.tiff.hasOwnProperty('Orientation')) {
				_orientation = parseInt(_meta.tiff.Orientation, 10);
			}
			
			if ([5,6,7,8].indexOf(_orientation) !== -1) { // values that have different orientation
				// 交互宽度和高度值
				width ^= height;
				height ^= width;
				width ^= height;
			}
			
			selector = crop ? Math.max : Math.min;
			scale = selector(  width / naturalWidth, height / naturalHeight );
			
			if ( !allowMagnify && scale > 1 ) {
				scale = 1;
			} 
			
			var destWidth:uint, destHeight:uint;
			destWidth = naturalWidth * scale;
			destHeight = naturalHeight * scale;
			
			
			var bd:BitmapData = new BitmapData( width, height );
			var matrix:Matrix = new Matrix;
			
			matrix.scale( scale, scale );
			if ( destWidth > width ) {
				matrix.translate(-Math.round((destWidth - width) / 2), 0);
			}
			
			if ( destHeight > height ) {
				matrix.translate( 0, -Math.round(( destHeight - height) / 2));
			}
			
			
			var loader:Loader = new Loader;
			loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event) : void {
				
				loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, arguments.callee);
				img.purge(); // free some resources
				
				// draw preloaded data onto the prepared BitmapData
				bd.draw(e.target.content as IBitmapDrawable, matrix, null, null, null, true);
				
				
				
				loader.unload();
				ba.clear();
				
				var encoder:JPEGEncoder;
				if ( type === 'image/png' ) {
					ba = bd.encode(bd.rect, new PNGEncoderOptions());
				} else {
					if (type == 'image/jpeg') {
						bd = _rotateToOrientation(_orientation, bd);
					}
					
					encoder = new JPEGEncoder( quality );
					ba = encoder.encode(bd);
					type = 'image/jpeg';
				}
				
				_ba =  ba;
				
				dispatchEvent(new ODataEvent(ODataEvent.DATA));
			});
			
			loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:*) : void {
				ba.clear();
				bd.dispose();
				img.purge();
				Uploader.log(e);
			});
			
			try {
				loader.loadBytes(ba);
			} catch (ex:*) {
				Uploader.log(ex);
			}
		}
		
		private function _rotateToOrientation(orientation:uint, bd:BitmapData) : BitmapData
		{
			var imageEditor:ImageEditor = new ImageEditor(bd);
			
			switch (orientation) {
				case 2:
					// horizontal flip
					imageEditor.modify("flipH");
					break;
				case 3:
					// 180 rotate left
					imageEditor.modify("rotate", 180);
					break;
				case 4:
					// vertical flip
					imageEditor.modify("flipV");
					break;
				case 5:
					// vertical flip + 90 rotate right
					imageEditor.modify("flipV");
					imageEditor.modify("rotate", 90);
					break;
				case 6:
					// 90 rotate right
					imageEditor.modify("rotate", 90);
					break;
				case 7:
					// horizontal flip + 90 rotate right
					imageEditor.modify("flipH");
					imageEditor.modify("rotate", 90);
					break;
				case 8:
					// 90 rotate left
					imageEditor.modify("rotate", -90);
					break;
			}
			
			imageEditor.commit();
			
			bd.dispose();
			bd = imageEditor.bitmapData;
			imageEditor.purge();
			return bd;
		}
		
		public function getOrientation():uint {
			return _orientation;
		}
		
		public function getAsDataURL():String {
			return 'data:' + type + ';base64,' + Base64.encode( _ba );
		}
		
		public function destroy():void {
			_ba.clear();
			
			// one call to mark any dereferenced objects and sweep away old marks, 			
			flash.system.System.gc();
			// ...and the second to now sweep away marks from the first call.
			flash.system.System.gc();
		}
	}
}