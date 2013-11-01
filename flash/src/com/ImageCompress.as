package com
{
	import com.errors.ImageError;
	import com.errors.RuntimeError;
	import com.events.ODataEvent;
	import com.events.OErrorEvent;
	import com.events.OProgressEvent;
	import com.image.JPEG;
	import com.image.JPEGEncoder;
	import com.image.PNG;
	import com.image.formatlos.BitmapDataUnlimited;
	import com.image.formatlos.events.BitmapDataUnlimitedEvent;
	import com.utils.OEventDispatcher;
	
	import flash.display.BitmapData;
	import flash.display.IBitmapDrawable;
	import flash.display.Loader;
	import flash.display.PNGEncoderOptions;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.geom.Matrix;
	import flash.system.System;
	import flash.utils.ByteArray;
	import com.utils.Utils;
	
	public class ImageCompress extends OEventDispatcher
	{
		// events dispatched by this class
		public static var dispatches:Object = { 
			"Progress": OProgressEvent.PROGRESS,
			"Complete": ODataEvent.DATA,
			"Error": OErrorEvent.ERROR
		};
		
		private var _w:uint;
		private var _h:uint;
		private var _bd:BitmapData;
		private var _img:*;
		
		// todo 与imagePreivew公用代码
		private var _meta:Object;
		private var _orientation:uint;
		
		public var type:String = 'image/jpeg';
		public var quality:uint = 90;
		public var crop:Boolean = false;
		public var preserveHeaders:Boolean = true; // @todo
		
		public function init( options:Object = null ):void {
			Utils.extend(this, options);
		}
		
		public function compress( blob:* = null, width:uint = 1600, height:uint = 1600 ):void {
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
			var info:Object, scale:Number, output:BitmapData, selector:Function;
			
			if (JPEG.test(ba)) {
				_img = new JPEG(ba);		
				_img.extractHeaders(); // preserve headers for later
				_meta = _img.metaInfo();
			} else if (PNG.test(ba)) {
				_img = new PNG(ba);
			} else {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			var width:uint = _w, height:uint = _h;
			var naturalWidth:uint, naturalHeight:uint;
			info = _img.info();
			type = info.type;
			naturalWidth = info.width;
			naturalHeight = info.height;
			
			selector = crop ? Math.max : Math.min;
			scale = selector(  width / naturalWidth, height / naturalHeight );
			
			// 不允许放大
			if ( scale > 1 ) {
				scale = 1;
			}
			
			var destWidth:uint, destHeight:uint;
			destWidth = naturalWidth * scale;
			destHeight = naturalHeight * scale;
			
			width = Math.min( destWidth, width );
			height = Math.min( destHeight, width );
			
			
			_prepareBitmapData(width, height, function(bd:BitmapData) : void {	
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
					_img.purge(); // free some resources
					
					// draw preloaded data onto the prepared BitmapData
					bd.draw(e.target.content as IBitmapDrawable, matrix, null, null, null, true);
					_bd = bd;
					
					loader.unload();
					ba.clear();
					
					
					dispatchEvent(new ODataEvent(ODataEvent.DATA));
				});
				
				loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:*) : void {
					ba.clear();
					bd.dispose();
					Uploader.log(e);
				});
				
				try {
					loader.loadBytes(ba);
				} catch (ex:*) {
					Uploader.log(ex);
				}	
			});
		}
		
		
		public function getAsBlob() : Object
		{
			var encoder:JPEGEncoder, ba:ByteArray;
			if (type == 'image/jpeg') {
				encoder = new JPEGEncoder( quality );
				ba = encoder.encode(_bd);
				
				if (_img) {
					// strip off any headers that might be left by encoder, etc
					_img.stripHeaders(ba);
					// restore the original headers if requested
					if (preserveHeaders) {
						_img.insertHeaders(ba);
					}
				}
				// ba = output.encode(output.rect, new JPEGEncoderOptions(70));
			} else if (type == 'image/png') {
				ba = _bd.encode(_bd.rect, new PNGEncoderOptions());
			}
			
			
			var blob:Blob = new Blob([ba], { type: type });
			Uploader.compFactory.add(blob.uid, blob);
			return blob.toObject();
		}
		
		
		/**
		 * Prior to FP11, there was a constraint on a resolution that Flash could handle for the BitmapData.
		 * This doesn't harm anyway (yet).
		 */  
		public function _prepareBitmapData(width:uint, height:uint, callback:Function) : void
		{
			var bc:BitmapDataUnlimited = new BitmapDataUnlimited;
			
			bc.addEventListener(BitmapDataUnlimitedEvent.COMPLETE, function(e:BitmapDataUnlimitedEvent) : void {
				callback(bc.bitmapData);
			});
			
			bc.addEventListener(BitmapDataUnlimitedEvent.ERROR, function(e:BitmapDataUnlimitedEvent) : void {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, RuntimeError.OUT_OF_MEMORY));
			});
			
			bc.create(width, height, true);
		}
		
		public function destroy():void {
			if ( _bd ) {
				_bd.dispose();
			}
			
			if ( _img ) {
				_img.purge();
			}
			
			// one call to mark any dereferenced objects and sweep away old marks, 			
			flash.system.System.gc();
			// ...and the second to now sweep away marks from the first call.
			flash.system.System.gc();
		}
	}
}