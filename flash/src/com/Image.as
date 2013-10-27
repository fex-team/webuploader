package com
{	
	import com.errors.ImageError;
	import com.errors.RuntimeError;
	import com.events.ImageEvent;
	import com.events.ODataEvent;
	import com.events.OErrorEvent;
	import com.events.OProgressEvent;
	import com.image.JPEG;
	import com.image.PNG;
	import com.image.formatlos.BitmapDataUnlimited;
	import com.image.formatlos.events.BitmapDataUnlimitedEvent;
	import com.utils.OEventDispatcher;
	
	import flash.display.BitmapData;
	import flash.display.IBitmapDrawable;
	import flash.display.JPEGEncoderOptions;
	import flash.display.Loader;
	import flash.display.PNGEncoderOptions;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.geom.Matrix;
	import flash.system.System;
	import flash.utils.ByteArray;
	
	
	public class Image extends OEventDispatcher
	{
		// events dispatched by this class
		public static var dispatches:Object = { 
			"Progress": OProgressEvent.PROGRESS,
			"Load": ODataEvent.DATA,
			"Error": OErrorEvent.ERROR,
			"Resize": ImageEvent.RESIZE
		};
		
		private var _img:*;
		
		private var _bd:BitmapData;
		
		public var size:uint = 0;
		
		public var name:String = '';
		
		public var width:uint = 0;
		
		public var height:uint = 0;
		
		public var type:String = '';
		
		public var meta:Object = {}; // misc meta info (for JPEG it will be for example Exif and Gps)
		
		private var _preserveHeaders:Boolean = true;
		
		
		public function loadFromImage(image:*, takeEncoded:Boolean = false) : void
		{			
			if (typeof image === 'string') {
				image = Uploader.compFactory.get(image);
			}
			
			if (!image) {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			if (takeEncoded) {
				var ba:ByteArray = image.getAsEncodedByteArray();
				if (!ba) {
					dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
					return;
				}					
				loadFromByteArray(ba);
			}
			else {
				var bd:BitmapData = image.getAsBitmapData();
				if (!bd) {
					dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
					return;
				}
				
				size = image.size;
				name = image.name;
				width = image.width;
				height = image.height;
				type = image.type;
				meta = image.meta;
				
				loadFromBitmapData(bd);
			}
		}
		
		
		public function loadFromBlob(blob:*) : void
		{
			var fr:FileReader; 
			
			if (typeof blob === 'string') {
				blob = Uploader.compFactory.get(blob);
			}
			
			if (!blob) {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			if (blob.hasOwnProperty('name')) {
				name = blob.name;
			}
			
			fr = new FileReader;
			
			fr.addEventListener(OProgressEvent.PROGRESS, function(e:OProgressEvent) : void {
				dispatchEvent(e);
			});
			
			fr.addEventListener(Event.COMPLETE, function(e:Event) : void {
				fr.removeAllEventsListeners();
				loadFromByteArray(fr.result);
				blob.purge();
			});
			
			fr.readAsByteArray(blob);
		}
		
		
		public function loadFromBitmapData(bd:BitmapData) : void
		{						
			_bd = bd;
			dispatchEvent(new ODataEvent(ODataEvent.DATA));
		}
		
		
		public function loadFromByteArray(ba:ByteArray) : void
		{
			var callback:Function, info:Object;
			
			if (JPEG.test(ba)) {
				_img = new JPEG(ba);		
				_img.extractHeaders(); // preserve headers for later
				meta = _img.metaInfo();
			} else if (PNG.test(ba)) {
				_img = new PNG(ba);
			} else {
				dispatchEvent(new OErrorEvent(OErrorEvent.ERROR, ImageError.WRONG_FORMAT));
				return;
			}
			
			Utils.extend(this, _img.info());
			size = ba.length;
			
			// Flash Players prior to version 11 didn't support high resolution images, this is a workaround
			_prepareBitmapData(width, height, function(bd:BitmapData) : void {	
				var loader:Loader = new Loader;
				loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event) : void {
					
					loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, arguments.callee);
					_img.purge(); // free some resources
					
					// draw preloaded data onto the prepared BitmapData
					bd.draw(e.target.content as IBitmapDrawable, null, null, null, null, true);
					loader.unload();
					loadFromBitmapData(bd);	
					ba.clear();
				});
				
				loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:*) : void {
					ba.clear();
					Uploader.log(e);
				});
				
				try {
					loader.loadBytes(ba);
				} catch (ex:*) {
					Uploader.log(ex);
					
				}
			});
		}
		
		
		public function getInfo() : Object
		{
			return { 
				size: size,
				width: width,
				height: height,
				type: type,
				name: name, 
				meta: meta 
			};
		}
		
		
		public function downsize(width:uint, height:uint, crop:Boolean = false, preserveHeaders:Boolean = true) : void
		{			
			var self:Image = this, scale:Number, orientation:uint = 1, selector:Function, output:BitmapData,
				
				// when scaled directly, Flash produces low quality result, so we do it here gradually
				downScale:Function = function(tmpWidth:Number, tmpHeight:Number) : void {				
					_prepareBitmapData(tmpWidth, tmpHeight, function(bd:BitmapData) : void { // modifies output internally
						var matrix:Matrix, imgWidth:Number, imgHeight:Number;
						
						scale = selector(tmpWidth / output.width, tmpHeight / output.height);
						if (scale > 1 && (!crop || preserveHeaders)) { // if we do not crop or strip off headers
							dispatchEvent(new ImageEvent(ImageEvent.RESIZE));
							return;
						}
						
						matrix = new Matrix;
						matrix.scale(scale, scale);
						
						// check if we need to center the image
						imgWidth = output.width * scale;
						imgHeight = output.height * scale;
						if (imgWidth > tmpWidth) {
							matrix.translate(-Math.round((imgWidth - tmpWidth) / 2), 0);
						}
						if (imgHeight > tmpHeight) {
							matrix.translate(0, -Math.round((imgHeight - tmpHeight) / 2));
						}
						
						bd.draw(output, matrix, null, null, null, true);
						output.dispose();			
						output = bd;
						
						if (output.width / 2 > width && output.height / 2 > height) {
							downScale(output.width / 2, output.height / 2); 
						} else if (width < output.width || height < output.height) {
							downScale(width, height);
						} else {			
							_bd.dispose();
							_bd = output;	
							
							if (self.type == 'image/jpeg') {
								if (!_preserveHeaders) {
									_rotateToOrientation(orientation);
								} else if (_img) {
									// insert new values into exif headers
									_img.updateDimensions(_bd.width, _bd.height);
									// update image info
									meta = _img.metaInfo();
								} 
							}		
							
							self.width = _bd.width;
							self.height = _bd.height;	
							
							dispatchEvent(new ImageEvent(ImageEvent.RESIZE));
						}
					});
				};
			
			_preserveHeaders = preserveHeaders; // memorize if we should preserve meta headers on JPEGs on save
			
			output = _bd.clone();
			
			// take into account Orientation tag
			if (self.type == 'image/jpeg' && meta.hasOwnProperty('tiff') && meta.tiff.hasOwnProperty('Orientation')) {
				orientation = parseInt(meta.tiff.Orientation, 10);
			}
			
			if ([5,6,7,8].indexOf(orientation) !== -1) { // values that have different orientation
				// swap dimensions
				var mem:uint = width;
				width = height;
				height = mem;
			}
			
			if (!crop) { 
				// retain proportions
				selector = Math.min;			
				scale = selector(width / output.width, height / output.height);
				width = Math.round(output.width * scale);
				height = Math.round(output.height * scale);
			} else {
				selector = Math.max;
			}
			
			if (output.width / 2 > width && output.height / 2 > height) {
				downScale(output.width / 2, output.height / 2); // modifies output internally
			} else {
				downScale(width, height);
			}	
		}
		
		
		
		public function getAsBitmapData() : BitmapData
		{
			if (!_bd) {
				return null;
			}
			return _bd.clone();
		}
		
		
		public function getAsEncodedByteArray(type:String = null, quality:uint = 90) : ByteArray 
		{
			var ba:ByteArray, bd:BitmapData;
			
			bd = getAsBitmapData();
			if (!bd) {
				return null;
			}
			
			if (!type) {
				type = this.type !== '' ? this.type : 'image/jpeg';
			} 
			
			if (type == 'image/jpeg') {	
				ba = bd.encode(bd.rect, new JPEGEncoderOptions(quality));
				
				if (_img) {
					// strip off any headers that might be left by encoder, etc
					_img.stripHeaders(ba);
					// restore the original headers if requested
					if (_preserveHeaders) {
						_img.insertHeaders(ba);
					}
				}
			} else if (type == 'image/png') {
				ba = bd.encode(bd.rect, new PNGEncoderOptions());
			}			
			return ba;
		}
		
		
		public function getAsByteArray() : ByteArray
		{
			var bd:BitmapData = getAsBitmapData();
			
			if (!bd) {
				return null;
			}
			
			return bd.getPixels(bd.rect);
		}
		
		
		public function getAsBlob(type:String = null, quality:uint = 90) : Object
		{
			var ba:ByteArray, blob:Blob;
			
			ba = getAsEncodedByteArray(type, quality);	
			if (!ba) {
				return null;
			}
			
			blob = new Blob([ba], { type: type });
			Uploader.compFactory.add(blob.uid, blob);
			return blob.toObject();
		}
		
		
		public function destroy() : void
		{
			if (_img) {
				_img.purge();					
			}
			
			if (_bd) {
				_bd.dispose();
				_bd = null;
			}
			
			// one call to mark any dereferenced objects and sweep away old marks, 			
			flash.system.System.gc();
			// ...and the second to now sweep away marks from the first call.
			flash.system.System.gc();
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
		
		
		private function _rotateToOrientation(orientation:uint) : void
		{
			var imageEditor:ImageEditor = new ImageEditor(_bd);
			
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
			
			_bd.dispose();
			_bd = imageEditor.bitmapData;
			imageEditor.purge();
		}
		
	}
}