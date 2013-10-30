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
	import flash.utils.ByteArray;

	/**
	 * The Gif Class creates an empty gif image
	 *
	 * @author Martin Raedlinger
	 */
	public class Gif
	{
		private var _width : int;
		private var _height : int;
		private var _colorTable : ByteArray;
		private var _colorTableSize : int = 7;
		private var _transparent : Boolean;
		private var _transparentIndex : int = 0;
		private var _fillColor : uint;

		// binary gif data
		private var _binaryGif : ByteArray;

		/**
		 * Returns the created binary gif data
		 *
		 * @return binary gif data
		 */
		public function get bytes() : ByteArray
		{
			return _binaryGif;
		}


		public function Gif(width_ : int, height_ : int, transparent_ : Boolean = false, fillColor_ : uint = 4.294967295E9)
		{
			_width = width_;
			_height = height_;
			_transparent = transparent_;
			_fillColor = fillColor_;

			initialize();
		}

		private function initialize() : void
		{
			_binaryGif = new ByteArray();

			writeHeader();
			writeLogicalScreenDescriptor();
			writeColorTable();
			writeGraphicControlExtensionBlock();
			writeImageBlock();
			writeTrailer();
		}

		private function writeHeader() : void
		{
			_binaryGif.writeUTFBytes("GIF89a");
		}

		private function writeLogicalScreenDescriptor() : void
		{
			// size
			writeShort(_width);
			writeShort(_height);

			// Packed Fields
			// bit 0:    Global Color Table Flag (GCTF)
			// bit 1..3: Color Resolution
			// bit 4:    Sort Flag to Global Color Table
			// bit 5..7: Size of Global Color Table: 2^(1+n)
			_binaryGif.writeByte((0x80 | 0x70 | 0x00 | _colorTableSize));
			// Background Color Index
			_binaryGif.writeByte(0);
			// Pixel Aspect Ratio
			_binaryGif.writeByte(0); //
		}


		private function writeColorTable() : void
		{
			_colorTable = new ByteArray();
			//_colorTable[0] = 0xFF0000 >> 16;
			//_colorTable[1] = 0x00FF00 >> 8;
			//_colorTable[2] = 0x0000FF;
			_colorTable[0] = _fillColor >> 16 & 0xFF;
			_colorTable[1] = _fillColor >> 8 & 0xFF;
			_colorTable[2] = _fillColor & 0xFF;

			_binaryGif.writeBytes(_colorTable, 0, _colorTable.length);

			var i : int = 0;
			var n : int = (3 * 256) - _colorTable.length;

			while(i < n)
			{
				_binaryGif.writeByte(0);
				++i;
			}
		}

		private function writeGraphicControlExtensionBlock() : void
		{
			// Extension Introducer
			_binaryGif.writeByte(0x21);
			// Graphic Control Label
			_binaryGif.writeByte(0xf9);
			// Block Size
			_binaryGif.writeByte(4);


			var transparent : int;
			var dispose : int;

			if (_transparent)
			{
				transparent = 1;
				dispose = 2;
			}
		    else
			{
				transparent = 0;
				dispose = 0;
			}

			dispose <<= 2;

			// Packed Fields
			// bit 0..2: Reserved
			// bit 3..5: Disposal Method
			// bit 6:    User Input Flag
			// bit 7:    Transparent Color Flag
			_binaryGif.writeByte(0 | dispose | 0 | transparent);

			// Delay Time
			writeShort(0);
			// Transparent Color Index
			_binaryGif.writeByte(_transparentIndex);
			// Block Terminator
			_binaryGif.writeByte(0);
		}

		private function writeImageBlock() : void
		{
			//Image Separator
			_binaryGif.writeByte(0x2c);
			// Image Left Position
			writeShort(0);
			// image position x,y = 0,0
			// Image Top Position
			writeShort(0);
			// Image Width
			writeShort(_width);
			// Image Height
			writeShort(_height);
			// Packed Fields
			_binaryGif.writeByte(0);
		}


		private function writeTrailer() : void
		{
			_binaryGif.writeByte(0x3b);
		}

		private function writeShort(pValue : int) : void
		{
			_binaryGif.writeByte(pValue & 0xFF);
			_binaryGif.writeByte((pValue >> 8) & 0xFF);
		}



	}
}