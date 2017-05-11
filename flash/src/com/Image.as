package com
{
	import com.errors.ImageError;
	import com.events.ODataEvent;
	import com.events.OErrorEvent;
	import com.events.OProgressEvent;
	import com.image.BMP;
	import com.image.GIF;
	import com.image.ImageEditor;
	import com.image.JPEG;
	import com.image.JPEGEncoder;
	import com.image.PNG;
	import com.utils.BMPDecoder;
	import com.utils.Base64;
	import com.utils.OEventDispatcher;
	import com.utils.Utils;
	
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.IBitmapDrawable;
	import flash.display.Loader;
	import flash.display.PNGEncoderOptions;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
import flash.events.ProgressEvent;
import flash.geom.Matrix;
	import flash.system.System;
	import flash.utils.ByteArray;
	import flash.geom.Rectangle;
	import flash.geom.Point;
	
	public class Image extends OEventDispatcher
	{
		// events dispatched by this class
		public static var dispatches:Object = { 
			"Progress": OProgressEvent.PROGRESS,
			"Complete": ODataEvent.DATA,
			"Load": Event.COMPLETE,
			"Error": OErrorEvent.ERROR
		};
		
		private var _orientation:uint = 1;
		private var _bd:BitmapData;
		private var _ba:ByteArray;
		private var _meta:Object;
		private var _info:Object;
		private var _img:*;
		
		public var type:String = 'image/jpeg';
		public var quality:uint = 70;
		public var _crop:Boolean = true;
		public var allowMagnify:Boolean = true;
		public var preserveHeaders:Boolean = false;
		
		public function init( options:Object = null ):void {
			Utils.extend(this, options, true);
			if (options.hasOwnProperty("crop")){				
				_crop = options["crop"];
			}
		}
		
		public function loadFromBlob( blob:* = null ):void {
			var fr:FileReader;

            

			if (typeof blob === 'string') {
				blob = Uploader.compFactory.get(blob);
			}
			
			if (!blob) {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			fr = new FileReader;

            fr.addEventListener(ProgressEvent.PROGRESS, function(e:ProgressEvent) : void {
                dispatchEvent(new OProgressEvent(OProgressEvent.PROGRESS, e.bytesLoaded, e.bytesTotal));
            });
			
			fr.addEventListener(Event.COMPLETE, function(e:Event) : void {
				fr.removeAllEventsListeners();
				_loadFromByteArray(fr.result);
				dispatchEvent( new Event(Event.COMPLETE) );
			});
			
			fr.readAsByteArray(blob);
		}
		
		public function info( val:Object = null):Object {
			if ( val ) {
				_info = val;
			}
			
			return _info;
		}
		
		public function meta( val:Object = null):Object {
			if ( val ) {
				_meta = val;
			}
			
			return _meta;
		}
		
		private function _loadFromByteArray( ba:ByteArray ):void {
			if ( !_info ) {
				if (JPEG.test(ba)) {
					_img = new JPEG(ba);		
					_meta = _img.metaInfo();
					_img.extractHeaders();
				} else if (PNG.test(ba)) {
					_img = new PNG(ba);
				} else if ( GIF.test(ba) ) {
					_img = new GIF( ba );
				} else if ( BMP.test(ba) ) {
					_img = new BMP( ba );
				} else {
					dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
					return;
				}
				
				_info = _img.info();
			} else if ( _info.type === 'image/jpeg' ) {
				_img = new JPEG( ba );
				_img.extractHeaders();
			}
			
			type = _info.type;
			_ba = ba;
		}
		
		public function resize( width:Number = 110, height:Number = 110 ):void {
			var naturalWidth:uint, naturalHeight:uint;
			
			type = _info.type;
			naturalWidth = _info.width;
			naturalHeight = _info.height;
			
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
			
			var selector:Function, scale:Number;
			selector = _crop ? Math.max : Math.min;
			scale = selector(  width / naturalWidth, height / naturalHeight );
			
			if ( !allowMagnify && scale > 1 ) {
				scale = 1;
			}
			
			var destWidth:uint, destHeight:uint;
			destWidth = naturalWidth * scale;
			destHeight = naturalHeight * scale;
			
			
			var matrix:Matrix = new Matrix;
			
			matrix.scale( scale, scale );
			if ( destWidth > width ) {
				matrix.translate(-Math.round((destWidth - width) / 2), 0);
			}
			
			if ( destHeight > height ) {
				matrix.translate( 0, -Math.round(( destHeight - height) / 2));
			}
			
			_bd = new BitmapData( Math.min( width, destWidth), Math.min( height, destHeight) );
			
			
			if ( type == 'image/bmp' ) {
				var decoder:BMPDecoder = new BMPDecoder();
				var bmp:Bitmap = new Bitmap( decoder.decode( _ba ) );
				
				// draw preloaded data onto the prepared BitmapData
				_bd.draw(bmp, matrix, null, null, null, true);
				
				dispatchEvent(new ODataEvent(ODataEvent.DATA));
				return;
			}
			
			
			var loader:Loader = new Loader;
			loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event) : void {
				
				loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, arguments.callee);
				
				// draw preloaded data onto the prepared BitmapData
				_bd.draw(e.target.content as IBitmapDrawable, matrix, null, null, null, true);
				
				loader.unload();
				_ba.clear();
				
				dispatchEvent(new ODataEvent(ODataEvent.DATA));
			});
			
			loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:*) : void {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, 2));
				
				_ba.clear();
				_bd.dispose();
				loader.unload();
			});
			
			try {
				loader.loadBytes(_ba);
			} catch (ex:*) {
				Uploader.log([ex]);
			}
		}
		
		public function crop( x:Number = 0, y:Number = 0, width:Number = 110, height:Number = 110, scale:Number = 1  ):void {
			var croppedBD:BitmapData = new BitmapData(width, height);
			croppedBD.copyPixels(_bd, new Rectangle(x, y, width, height), new Point(0, 0));
			_bd.dispose();
			_bd = croppedBD
		}
		
		public function getAsDataUrl( _type:String = null):String {
			_type = _type || type;
			
			var ba:ByteArray =  _encodeBitmapData( _bd, _type );
			
			return 'data:' + _type + ';base64,' + Base64.encode( ba );
		}
		
		public function getAsBlob( _type:String = null):Object {
			_type = _type || type;
			
			var blob:Blob = new Blob([_encodeBitmapData( _bd, _type )], { type: _type });
			Uploader.compFactory.add(blob.uid, blob);
			return blob.toObject();
		}
		
		
		public function destroy():void {
			if (_bd) {
				_bd.dispose();
				_bd = null;
			}
			
			// one call to mark any dereferenced objects and sweep away old marks, 			
			flash.system.System.gc();
			// ...and the second to now sweep away marks from the first call.
			flash.system.System.gc();
		}
		
		private function _encodeBitmapData( bd:BitmapData, type:String ):ByteArray {
			var encoder:JPEGEncoder, ba:ByteArray;
			
			// todo 支持其他格式。
			
			if ( type === 'image/png' ) {
				ba = bd.encode(bd.rect, new PNGEncoderOptions());
			} else {
				if (type == 'image/jpeg' && !preserveHeaders ) {
					bd = _rotateToOrientation(_orientation, bd);
				}
				
				encoder = new JPEGEncoder( quality );
				ba = encoder.encode(bd);
				
				if (_img && _img is JPEG) {
					// strip off any headers that might be left by encoder, etc
					_img.stripHeaders(ba);
					
					// restore the original headers if requested
					if (preserveHeaders) {
						_img.insertHeaders(ba);
						_img.updateDimensions(bd.width, bd.height);
					}
				}
			}
			
			return ba;
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
			_bd = imageEditor.bitmapData;
			imageEditor.purge();
			return _bd;
		}
	}
}