package com.utils {
	import flash.display.BitmapData;
	import flash.errors.IOError;
	import flash.utils.ByteArray;
	import flash.utils.Endian;
	
	public class BMPDecoder {
		//___________________________________________________________ const
		
		private const BITMAP_HEADER_TYPE:String = "BM";
		
		private const BITMAP_FILE_HEADER_SIZE:int = 14;
		private const BITMAP_CORE_HEADER_SIZE:int = 12;
		private const BITMAP_INFO_HEADER_SIZE:int = 40;
		
		private const COMP_RGB      :int = 0;
		private const COMP_RLE8     :int = 1;
		private const COMP_RLE4     :int = 2;
		private const COMP_BITFIELDS:int = 3;
		
		private const BIT1 :int = 1;
		private const BIT4 :int = 4;
		private const BIT8 :int = 8;
		private const BIT16:int = 16;
		private const BIT24:int = 24;
		private const BIT32:int = 32;
		
		
		//___________________________________________________________ vars
		
		private var bytes:ByteArray;
		private var palette:Array;
		private var bd:BitmapData;
		
		private var nFileSize:uint;
		private var nReserved1:uint;
		private var nReserved2:uint;
		private var nOffbits:uint;
		
		private var nInfoSize:uint;
		private var nWidth:int;
		private var nHeight:int;
		private var nPlains:uint;
		private var nBitsPerPixel:uint;
		private var nCompression:uint;
		private var nSizeImage:uint;
		private var nXPixPerMeter:int;
		private var nYPixPerMeter:int;
		private var nColorUsed:uint;
		private var nColorImportant:uint;
		
		private var nRMask:uint;
		private var nGMask:uint;
		private var nBMask:uint;
		private var nRPos:uint;
		private var nGPos:uint;
		private var nBPos:uint;
		private var nRMax:uint;
		private var nGMax:uint;
		private var nBMax:uint;
		
		
		/**
		 * コンストラクタ
		 */
		public function BMPDecoder() {
			nRPos = 0;
			nGPos = 0;
			nBPos = 0;
		}
		
		
		/**
		 * デコード
		 * 
		 * @param デコードしたいBMPファイルのバイナリデータ
		 */
		public function decode( data:ByteArray ):BitmapData {
			bytes = data;
			bytes.endian = Endian.LITTLE_ENDIAN;
			bytes.position = 0;
			
			readFileHeader();
			
			nInfoSize = bytes.readUnsignedInt();
			
			switch ( nInfoSize ) {
				case BITMAP_CORE_HEADER_SIZE:
					readCoreHeader();
					break;
				case BITMAP_INFO_HEADER_SIZE:
					readInfoHeader();
					break;
				default:
					readExtendedInfoHeader();
					break;
			}
			
			bd = new BitmapData( nWidth, nHeight );
			
			switch ( nBitsPerPixel ){
				case BIT1:
					readColorPalette();
					decode1BitBMP();
					break;
				case BIT4:
					readColorPalette();
					if ( nCompression == COMP_RLE4 ){
						decode4bitRLE();
					} else {
						decode4BitBMP();
					}
					break;
				case BIT8:
					readColorPalette();
					if ( nCompression == COMP_RLE8 ){
						decode8BitRLE();
					} else {
						decode8BitBMP();
					}
					break;
				case BIT16:
					readBitFields();
					checkColorMask();
					decode16BitBMP();
					break;
				case BIT24:
					decode24BitBMP();
					break;
				case BIT32:
					readBitFields();
					checkColorMask();
					decode32BitBMP();
					break;
				default:
					throw new VerifyError("invalid bits per pixel : " + nBitsPerPixel );
			}
			
			return bd;
		}
		
		
		/**
		 * BITMAP FILE HEADER 読み込み
		 */
		private function readFileHeader():void {
			var fileHeader:ByteArray = new ByteArray();
			fileHeader.endian = Endian.LITTLE_ENDIAN;
			
			try {
				bytes.readBytes( fileHeader, 0, BITMAP_FILE_HEADER_SIZE );
				
				if ( fileHeader.readUTFBytes( 2 ) != BITMAP_HEADER_TYPE ){
					throw new VerifyError("invalid bitmap header type");
				}
				
				nFileSize  = fileHeader.readUnsignedInt();
				nReserved1 = fileHeader.readUnsignedShort();
				nReserved2 = fileHeader.readUnsignedShort();
				nOffbits   = fileHeader.readUnsignedInt();
			} catch ( e:IOError ) {
				throw new VerifyError("invalid file header");
			}
		}
		
		
		/**
		 * BITMAP CORE HEADER 読み込み 
		 */
		private function readCoreHeader():void {
			var coreHeader:ByteArray = new ByteArray();
			coreHeader.endian = Endian.LITTLE_ENDIAN;
			
			try {
				bytes.readBytes( coreHeader, 0, BITMAP_CORE_HEADER_SIZE - 4 );
				
				nWidth  = coreHeader.readShort();
				nHeight = coreHeader.readShort();
				nPlains = coreHeader.readUnsignedShort();
				nBitsPerPixel = coreHeader.readUnsignedShort();
			} catch ( e:IOError ) {
				throw new VerifyError("invalid core header");
			}
		}
		
		
		/**
		 * BITMAP INFO HEADER 読み込み
		 */
		private function readInfoHeader():void {
			var infoHeader:ByteArray = new ByteArray();
			infoHeader.endian = Endian.LITTLE_ENDIAN;
			
			try {
				bytes.readBytes( infoHeader, 0, BITMAP_INFO_HEADER_SIZE - 4 );
				
				nWidth  = infoHeader.readInt();
				nHeight = infoHeader.readInt();
				nPlains = infoHeader.readUnsignedShort();
				nBitsPerPixel = infoHeader.readUnsignedShort();
				
				nCompression = infoHeader.readUnsignedInt();
				nSizeImage = infoHeader.readUnsignedInt();
				nXPixPerMeter = infoHeader.readInt();
				nYPixPerMeter = infoHeader.readInt();
				nColorUsed = infoHeader.readUnsignedInt();
				nColorImportant = infoHeader.readUnsignedInt();
			} catch ( e:IOError ) {
				throw new VerifyError("invalid info header");
			}
		}
		
		/**
		 * 拡張 BITMAP INFO HEADER 読み込み
		 */
		private function readExtendedInfoHeader():void {
			var infoHeader:ByteArray = new ByteArray();
			infoHeader.endian = Endian.LITTLE_ENDIAN;
			
			try {
				bytes.readBytes( infoHeader, 0, nInfoSize - 4 );
				
				nWidth  = infoHeader.readInt();
				nHeight = infoHeader.readInt();
				nPlains = infoHeader.readUnsignedShort();
				nBitsPerPixel = infoHeader.readUnsignedShort();
				
				nCompression = infoHeader.readUnsignedInt();
				nSizeImage = infoHeader.readUnsignedInt();
				nXPixPerMeter = infoHeader.readInt();
				nYPixPerMeter = infoHeader.readInt();
				nColorUsed = infoHeader.readUnsignedInt();
				nColorImportant = infoHeader.readUnsignedInt();
				
				if ( infoHeader.bytesAvailable >= 4 ) nRMask = infoHeader.readUnsignedInt();
				if ( infoHeader.bytesAvailable >= 4 ) nGMask = infoHeader.readUnsignedInt();
				if ( infoHeader.bytesAvailable >= 4 ) nBMask = infoHeader.readUnsignedInt();
			} catch ( e:IOError ) {
				throw new VerifyError("invalid info header");
			}
		}
		
		
		/**
		 * ビットフィールド読み込み
		 */
		private function readBitFields():void {
			if ( nCompression == COMP_RGB ){
				if ( nBitsPerPixel == BIT16 ){
					// RGB555
					nRMask = 0x00007c00;
					nGMask = 0x000003e0;
					nBMask = 0x0000001f;
				} else {
					//RGB888;
					nRMask = 0x00ff0000;
					nGMask = 0x0000ff00;
					nBMask = 0x000000ff;
				}
			} else if ( ( nCompression == COMP_BITFIELDS ) && ( nInfoSize < 52 ) ){
				try {
					nRMask = bytes.readUnsignedInt();
					nGMask = bytes.readUnsignedInt();
					nBMask = bytes.readUnsignedInt();
				} catch ( e:IOError ) {
					throw new VerifyError("invalid bit fields");
				}
			}
		}
		
		
		/**
		 * カラーパレット読み込み
		 */
		private function readColorPalette():void {
			var i:int;
			var len:int = ( nColorUsed > 0 ) ? nColorUsed : Math.pow( 2, nBitsPerPixel );
			palette = new Array( len );
			
			for ( i = 0; i < len; ++i ){
				palette[ i ] = bytes.readUnsignedInt();
			}
		}
		
		
		/**
		 * 1bitのBMPデコード
		 */
		private function decode1BitBMP():void {
			var x:int;
			var y:int;
			var i:int;
			var col:int;
			var buf:ByteArray = new ByteArray();
			var line:int = nWidth / 8;
			
			if ( line % 4 > 0 ){
				line = ( ( line / 4 | 0 ) + 1 ) * 4;
			}
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					buf.length = 0;
					bytes.readBytes( buf, 0, line );
					
					for ( x = 0; x < nWidth; x += 8 ){
						col = buf.readUnsignedByte();
						
						for ( i = 0; i < 8; ++i ){
							bd.setPixel( x + i, y, palette[ col >> ( 7 - i ) & 0x01 ] );
						}
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		
		/**
		 * 4bitのRLE圧縮BMPデコード
		 */
		private function decode4bitRLE():void {
			var x:int;
			var y:int;
			var i:int;
			var n:int;
			var col:int;
			var data:uint;
			var buf:ByteArray = new ByteArray();
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					buf.length = 0;
					
					while ( bytes.bytesAvailable > 0 ){
						n = bytes.readUnsignedByte();
						
						if ( n > 0 ){
							// エンコードデータ
							data = bytes.readUnsignedByte();
							for ( i = 0; i < n/2; ++i ){
								buf.writeByte( data );
							}
						} else {
							n = bytes.readUnsignedByte();
							
							if ( n > 0 ){
								// 絶対モードデータ
								bytes.readBytes( buf, buf.length, n/2 );
								buf.position += n/2;
								
								if ( n/2 + 1 >> 1 << 1 != n/2 ){
									bytes.readUnsignedByte();
								}
							} else {
								// EOL
								break;
							}
						}
					}
					
					buf.position = 0;
					
					for ( x = 0; x < nWidth; x += 2 ){
						col = buf.readUnsignedByte();
						
						bd.setPixel( x, y, palette[ col >> 4 ] );
						bd.setPixel( x + 1, y, palette[ col & 0x0f ] );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		
		/**
		 * 4bitの非圧縮BMPデコード
		 */
		private function decode4BitBMP():void {
			var x:int;
			var y:int;
			var i:int;
			var col:int;
			var buf:ByteArray = new ByteArray();
			var line:int = nWidth / 2;
			
			if ( line % 4 > 0 ){
				line = ( ( line / 4 | 0 ) + 1 ) * 4;
			}
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					buf.length = 0;
					bytes.readBytes( buf, 0, line );
					
					for ( x = 0; x < nWidth; x += 2 ){
						col = buf.readUnsignedByte();
						
						bd.setPixel( x, y, palette[ col >> 4 ] );
						bd.setPixel( x + 1, y, palette[ col & 0x0f ] );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		
		/**
		 * 8bitのRLE圧縮BMPデコード
		 */
		private function decode8BitRLE():void {
			var x:int;
			var y:int;
			var i:int;
			var n:int;
			var col:int;
			var data:uint;
			var buf:ByteArray = new ByteArray();
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					buf.length = 0;
					
					while ( bytes.bytesAvailable > 0 ){
						n = bytes.readUnsignedByte();
						
						if ( n > 0 ){
							// エンコードデータ
							data = bytes.readUnsignedByte();
							for ( i = 0; i < n; ++i ){
								buf.writeByte( data );
							}
						} else {
							n = bytes.readUnsignedByte();
							
							if ( n > 0 ){
								// 絶対モードデータ
								bytes.readBytes( buf, buf.length, n );
								buf.position += n;
								if ( n + 1 >> 1 << 1 != n ){
									bytes.readUnsignedByte();
								}
							} else {
								// EOL
								break;
							}
						}
					}
					
					buf.position = 0;
					
					for ( x = 0; x < nWidth; ++x ){
						bd.setPixel( x, y, palette[ buf.readUnsignedByte() ] );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		/**
		 * 8bitの非圧縮BMPデコード
		 */
		private function decode8BitBMP():void {
			var x:int;
			var y:int;
			var i:int;
			var col:int;
			var buf:ByteArray = new ByteArray();
			var line:int = nWidth;
			
			if ( line % 4 > 0 ){
				line = ( ( line / 4 | 0 ) + 1 ) * 4;
			}
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					buf.length = 0;
					bytes.readBytes( buf, 0, line );
					
					for ( x = 0; x < nWidth; ++x ){
						bd.setPixel( x, y, palette[ buf.readUnsignedByte() ] );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		/**
		 * 16bitのBMPデコード
		 */
		private function decode16BitBMP():void {
			var x:int;
			var y:int;
			var col:int;
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					for ( x = 0; x < nWidth; ++x ){
						col = bytes.readUnsignedShort();
						bd.setPixel( x, y, ( ( ( col & nRMask ) >> nRPos )*0xff/nRMax << 16 ) + ( ( ( col & nGMask ) >> nGPos )*0xff/nGMax << 8 ) + ( ( ( col & nBMask ) >> nBPos )*0xff/nBMax << 0 ) );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		/**
		 * 24bitのBMPデコード
		 */
		private function decode24BitBMP():void {
			var x:int;
			var y:int;
			var col:int;
			var buf:ByteArray = new ByteArray();
			var line:int = nWidth * 3;
			
			if ( line % 4 > 0 ){
				line = ( ( line / 4 | 0 ) + 1 ) * 4;
			}
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					buf.length = 0;
					bytes.readBytes( buf, 0, line );
					
					for ( x = 0; x < nWidth; ++x ){
						bd.setPixel( x, y, buf.readUnsignedByte() + ( buf.readUnsignedByte() << 8 ) + ( buf.readUnsignedByte() << 16 ) );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		/**
		 * 32bitのBMPデコード
		 */
		private function decode32BitBMP():void {
			var x:int;
			var y:int;
			var col:int;
			
			try {
				for ( y = nHeight - 1; y >= 0; --y ){
					for ( x = 0; x < nWidth; ++x ){
						col = bytes.readUnsignedInt();
						bd.setPixel( x, y, ( ( ( col & nRMask ) >> nRPos )*0xff/nRMax << 16 ) + ( ( ( col & nGMask ) >> nGPos )*0xff/nGMax << 8 ) + ( ( ( col & nBMask ) >> nBPos )*0xff/nBMax << 0 ) );
					}
				}
			} catch ( e:IOError ) {
				throw new VerifyError("invalid image data");
			}
		}
		
		
		/**
		 * カラーマスクチェック
		 */
		private function checkColorMask():void {
			if ( ( nRMask & nGMask ) | ( nGMask & nBMask ) | ( nBMask & nRMask ) ){
				throw new VerifyError("invalid bit fields");
			}
			
			while ( ( ( nRMask >> nRPos ) & 0x00000001 ) == 0 ){
				nRPos++;
			}
			while ( ( ( nGMask >> nGPos ) & 0x00000001 ) == 0 ){
				nGPos++;
			}
			while ( ( ( nBMask >> nBPos ) & 0x00000001 ) == 0 ){
				nBPos++;
			}
			
			nRMax = nRMask >> nRPos;
			nGMax = nGMask >> nGPos;
			nBMax = nBMask >> nBPos;
		}
		
		
		/**
		 * 情報出力
		 */
		public function traceInfo():void {
			trace("---- FILE HEADER ----");
			trace("nFileSize: " + nFileSize );
			trace("nReserved1: " + nReserved1 );
			trace("nReserved2: " + nReserved2 );
			trace("nOffbits: " + nOffbits );
			
			trace("---- INFO HEADER ----");
			trace("nWidth: " + nWidth );
			trace("nHeight: " + nHeight );
			trace("nPlains: " + nPlains );
			trace("nBitsPerPixel: " + nBitsPerPixel );
			
			if ( nInfoSize >= 40 ){
				trace("nCompression: " + nCompression );
				trace("nSizeImage: " + nSizeImage );
				trace("nXPixPerMeter: " + nXPixPerMeter );
				trace("nYPixPerMeter: " + nYPixPerMeter );
				trace("nColorUsed: " + nColorUsed );
				trace("nColorUsed: " + nColorImportant );
			}
			
			if ( nInfoSize >= 52 ){
				trace("nRMask: " + nRMask.toString( 2 ) );
				trace("nGMask: " + nGMask.toString( 2 ) );
				trace("nBMask: " + nBMask.toString( 2 ) );
			}
		}
	}
}