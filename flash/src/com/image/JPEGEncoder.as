package com.image
{
	/*
	*
	* MUCH (4x) faster version of jpeg encoder. Use instead of com.adobe.images.JPGEncoder
	*
	* taken from bytearray.org/?p=775, created by Thibault Imbert
	**/
	
	
	import flash.display.BitmapData;
	import flash.utils.ByteArray;
	
	public final class JPEGEncoder
	{
		// Static table initialization
		private const ZigZag:Vector.<int> = Vector.<int>([
			0, 1, 5, 6,14,15,27,28,
			2, 4, 7,13,16,26,29,42,
			3, 8,12,17,25,30,41,43,
			9,11,18,24,31,40,44,53,
			10,19,23,32,39,45,52,54,
			20,22,33,38,46,51,55,60,
			21,34,37,47,50,56,59,61,
			35,36,48,49,57,58,62,63
		]);
		private var YTable:Vector.<int> = new Vector.<int>(64, true);
		private var UVTable:Vector.<int> = new Vector.<int>(64, true);
		private var outputfDCTQuant:Vector.<int> = new Vector.<int>(64, true);
		private var fdtbl_Y:Vector.<Number> = new Vector.<Number>(64, true);
		private var fdtbl_UV:Vector.<Number> = new Vector.<Number>(64, true);
		private var sf:int;
		
		private const aasf:Vector.<Number> = Vector.<Number>([
			1.0, 1.387039845, 1.306562965, 1.175875602,
			1.0, 0.785694958, 0.541196100, 0.275899379
		]);
		
		private var YQT:Vector.<int> = Vector.<int>([
			16, 11, 10, 16, 24, 40, 51, 61,
			12, 12, 14, 19, 26, 58, 60, 55,
			14, 13, 16, 24, 40, 57, 69, 56,
			14, 17, 22, 29, 51, 87, 80, 62,
			18, 22, 37, 56, 68,109,103, 77,
			24, 35, 55, 64, 81,104,113, 92,
			49, 64, 78, 87,103,121,120,101,
			72, 92, 95, 98,112,100,103, 99
		]);
		
		private const UVQT:Vector.<int> = Vector.<int>([
			17, 18, 24, 47, 99, 99, 99, 99,
			18, 21, 26, 66, 99, 99, 99, 99,
			24, 26, 56, 99, 99, 99, 99, 99,
			47, 66, 99, 99, 99, 99, 99, 99,
			99, 99, 99, 99, 99, 99, 99, 99,
			99, 99, 99, 99, 99, 99, 99, 99,
			99, 99, 99, 99, 99, 99, 99, 99,
			99, 99, 99, 99, 99, 99, 99, 99
		]);
		
		private function initQuantTables(sf:int):void
		{
			var i:int;
			const I64:int = 64;
			const I8:int = 8;
			for (i = 0; i < I64; ++i)
			{
				var t:int = int((YQT[i]*sf+50)*0.01);
				if (t < 1) {
					t = 1;
				} else if (t > 255) {
					t = 255;
				}
				YTable[ZigZag[i]] = t;
			}
			
			for (i = 0; i < I64; i++)
			{
				var u:int = int((UVQT[i]*sf+50)*0.01);
				if (u < 1) {
					u = 1;
				} else if (u > 255) {
					u = 255;
				}
				UVTable[ZigZag[i]] = u;
			}
			i = 0;
			for (var row:int = 0; row < I8; ++row)
			{
				for (var col:int = 0; col < I8; ++col)
				{
					fdtbl_Y[i]  = (1 / (YTable [ZigZag[i]] * aasf[row] * aasf[col] * I8));
					fdtbl_UV[i] = (1 / (UVTable[ZigZag[i]] * aasf[row] * aasf[col] * I8));
					i++;
				}
			}
		}
		
		private var YDC_HT:Vector.<BitString>;
		private var UVDC_HT:Vector.<BitString>;
		private var YAC_HT:Vector.<BitString>;
		private var UVAC_HT:Vector.<BitString>;
		
		private function computeHuffmanTbl(nrcodes:Vector.<int>, std_table:Vector.<int>):Vector.<BitString>
		{
			var codevalue:int = 0;
			var pos_in_table:int = 0;
			var HT:Vector.<BitString> = new Vector.<BitString>(251, true);
			var bitString:BitString;
			for (var k:int=1; k<=16; ++k)
			{
				for (var j:int=1; j<=nrcodes[k]; ++j)
				{
					HT[std_table[pos_in_table]] = bitString = new BitString();
					bitString.val = codevalue;
					bitString.len = k;
					pos_in_table++;
					codevalue++;
				}
				codevalue<<=1;
			}
			return HT;
		}
		
		private var std_dc_luminance_nrcodes:Vector.<int> = Vector.<int>([0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0]);
		private var std_dc_luminance_values:Vector.<int> = Vector.<int>([0,1,2,3,4,5,6,7,8,9,10,11]);
		private var std_ac_luminance_nrcodes:Vector.<int> = Vector.<int>([0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d]);
		private var std_ac_luminance_values:Vector.<int> = Vector.<int>([0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
			0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
			0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
			0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
			0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
			0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
			0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
			0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
			0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
			0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
			0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
			0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
			0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
			0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
			0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
			0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
			0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
			0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
			0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
			0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
			0xf9,0xfa]);
		
		private var std_dc_chrominance_nrcodes:Vector.<int> = Vector.<int>([0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0]);
		private var std_dc_chrominance_values:Vector.<int> = Vector.<int>([0,1,2,3,4,5,6,7,8,9,10,11]);
		private var std_ac_chrominance_nrcodes:Vector.<int> = Vector.<int>([0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77]);
		private var std_ac_chrominance_values:Vector.<int> = Vector.<int>([0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
			0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
			0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
			0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
			0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
			0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
			0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
			0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
			0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
			0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
			0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
			0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
			0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
			0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
			0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
			0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
			0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
			0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
			0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
			0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
			0xf9,0xfa
		]);
		
		private function initHuffmanTbl():void
		{
			YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
			UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
			YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
			UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
		}
		
		private var bitcode:Vector.<BitString> = new Vector.<BitString>(65535, true);
		private var category:Vector.<int> = new Vector.<int>(65535, true);
		
		private function initCategoryNumber():void
		{
			var nrlower:int = 1;
			var nrupper:int = 2;
			var bitString:BitString;
			const I15:int = 15;
			var pos:int;
			for (var cat:int=1; cat<=I15; ++cat)
			{
				//Positive numbers
				for (var nr:int=nrlower; nr<nrupper; ++nr)
				{
					pos = int(32767+nr);
					category[pos] = cat;
					bitcode[pos] = bitString = new BitString();
					bitString.len = cat;
					bitString.val = nr;
				}
				//Negative numbers
				for (var nrneg:int=-(nrupper-1); nrneg<=-nrlower; ++nrneg)
				{
					pos = int(32767+nrneg);
					category[pos] = cat;
					bitcode[pos] = bitString = new BitString();
					bitString.len = cat;
					bitString.val = nrupper-1+nrneg;
				}
				nrlower <<= 1;
				nrupper <<= 1;
			}
		}
		
		// IO functions
		
		private var byteout:ByteArray;
		private var bytenew:int = 0;
		private var bytepos:int = 7;
		
		private function writeBits(bs:BitString):void
		{
			var value:int = bs.val;
			var posval:int = bs.len-1;
			while ( posval >= 0 )
			{
				if (value & uint(1 << posval) )
					bytenew |= uint(1 << bytepos);
				posval--;
				bytepos--;
				if (bytepos < 0)
				{
					if (bytenew == 0xFF)
					{
						byteout.writeByte(0xFF);
						byteout.writeByte(0);
					}
					else byteout.writeByte(bytenew);
					bytepos=7;
					bytenew=0;
				}
			}
		}
		
		// DCT & quantization core
		
		private function fDCTQuant(data:Vector.<Number>, fdtbl:Vector.<Number>):Vector.<int>
		{
			/* Pass 1: process rows. */
			var dataOff:int=0;
			var d0:Number, d1:Number, d2:Number, d3:Number, d4:Number, d5:Number, d6:Number, d7:Number;
			var i:int;
			const I8:int = 8;
			const I64:int = 64;
			for (i=0; i<I8; ++i)
			{	
				d0 = data[int(dataOff)];
				d1 = data[int(dataOff+1)];
				d2 = data[int(dataOff+2)];
				d3 = data[int(dataOff+3)];
				d4 = data[int(dataOff+4)];
				d5 = data[int(dataOff+5)];
				d6 = data[int(dataOff+6)];
				d7 = data[int(dataOff+7)];
				
				var tmp0:Number = d0 + d7;
				var tmp7:Number = d0 - d7;
				var tmp1:Number = d1 + d6;
				var tmp6:Number = d1 - d6;
				var tmp2:Number = d2 + d5;
				var tmp5:Number = d2 - d5;
				var tmp3:Number = d3 + d4;
				var tmp4:Number = d3 - d4;
				
				/* Even part */
				var tmp10:Number = tmp0 + tmp3;	/* phase 2 */
				var tmp13:Number = tmp0 - tmp3;
				var tmp11:Number = tmp1 + tmp2;
				var tmp12:Number = tmp1 - tmp2;
				
				data[int(dataOff)] = tmp10 + tmp11; /* phase 3 */
				data[int(dataOff+4)] = tmp10 - tmp11;
				
				var z1:Number = (tmp12 + tmp13) * 0.707106781; /* c4 */
				data[int(dataOff+2)] = tmp13 + z1; /* phase 5 */
				data[int(dataOff+6)] = tmp13 - z1;
				
				/* Odd part */
				tmp10 = tmp4 + tmp5; /* phase 2 */
				tmp11 = tmp5 + tmp6;
				tmp12 = tmp6 + tmp7;
				
				/* The rotator is modified from fig 4-8 to avoid extra negations. */
				var z5:Number = (tmp10 - tmp12) * 0.382683433; /* c6 */
				var z2:Number = 0.541196100 * tmp10 + z5; /* c2-c6 */
				var z4:Number = 1.306562965 * tmp12 + z5; /* c2+c6 */
				var z3:Number = tmp11 * 0.707106781; /* c4 */
				
				var z11:Number = tmp7 + z3;	/* phase 5 */
				var z13:Number = tmp7 - z3;
				
				data[int(dataOff+5)] = z13 + z2;	/* phase 6 */
				data[int(dataOff+3)] = z13 - z2;
				data[int(dataOff+1)] = z11 + z4;
				data[int(dataOff+7)] = z11 - z4;
				
				dataOff += 8; /* advance pointer to next row */
			}
			
			/* Pass 2: process columns. */
			dataOff = 0;
			for (i=0; i<I8; ++i)
			{
				d0 = data[int(dataOff)];
				d1 = data[int(dataOff + 8)];
				d2 = data[int(dataOff + 16)];
				d3 = data[int(dataOff + 24)];
				d4 = data[int(dataOff + 32)];
				d5 = data[int(dataOff + 40)];
				d6 = data[int(dataOff + 48)];
				d7 = data[int(dataOff + 56)];
				
				var tmp0p2:Number = d0 + d7;
				var tmp7p2:Number = d0 - d7;
				var tmp1p2:Number = d1 + d6;
				var tmp6p2:Number = d1 - d6;
				var tmp2p2:Number = d2 + d5;
				var tmp5p2:Number = d2 - d5;
				var tmp3p2:Number = d3 + d4;
				var tmp4p2:Number = d3 - d4;
				
				/* Even part */
				var tmp10p2:Number = tmp0p2 + tmp3p2;	/* phase 2 */
				var tmp13p2:Number = tmp0p2 - tmp3p2;
				var tmp11p2:Number = tmp1p2 + tmp2p2;
				var tmp12p2:Number = tmp1p2 - tmp2p2;
				
				data[int(dataOff)] = tmp10p2 + tmp11p2; /* phase 3 */
				data[int(dataOff+32)] = tmp10p2 - tmp11p2;
				
				var z1p2:Number = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
				data[int(dataOff+16)] = tmp13p2 + z1p2; /* phase 5 */
				data[int(dataOff+48)] = tmp13p2 - z1p2;
				
				/* Odd part */
				tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
				tmp11p2 = tmp5p2 + tmp6p2;
				tmp12p2 = tmp6p2 + tmp7p2;
				
				/* The rotator is modified from fig 4-8 to avoid extra negations. */
				var z5p2:Number = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
				var z2p2:Number = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
				var z4p2:Number = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
				var z3p2:Number= tmp11p2 * 0.707106781; /* c4 */
				
				var z11p2:Number = tmp7p2 + z3p2;	/* phase 5 */
				var z13p2:Number = tmp7p2 - z3p2;
				
				data[int(dataOff+40)] = z13p2 + z2p2; /* phase 6 */
				data[int(dataOff+24)] = z13p2 - z2p2;
				data[int(dataOff+ 8)] = z11p2 + z4p2;
				data[int(dataOff+56)] = z11p2 - z4p2;
				
				dataOff++; /* advance pointer to next column */
			}
			
			// Quantize/descale the coefficients
			var fDCTQuant:Number;
			for (i=0; i<I64; ++i)
			{
				// Apply the quantization and scaling factor & Round to nearest integer
				fDCTQuant = data[int(i)]*fdtbl[int(i)];
				outputfDCTQuant[int(i)] = (fDCTQuant > 0.0) ? int(fDCTQuant + 0.5) : int(fDCTQuant - 0.5);
			}
			return outputfDCTQuant;
		}
		
		// Chunk writing
		private function writeAPP0():void
		{
			byteout.writeShort(0xFFE0); // marker
			byteout.writeShort(16); // length
			byteout.writeByte(0x4A); // J
			byteout.writeByte(0x46); // F
			byteout.writeByte(0x49); // I
			byteout.writeByte(0x46); // F
			byteout.writeByte(0); // = "JFIF",'\0'
			byteout.writeByte(1); // versionhi
			byteout.writeByte(1); // versionlo
			byteout.writeByte(0); // xyunits
			byteout.writeShort(1); // xdensity
			byteout.writeShort(1); // ydensity
			byteout.writeByte(0); // thumbnwidth
			byteout.writeByte(0); // thumbnheight
		}
		
		private function writeSOF0(width:int, height:int):void
		{
			byteout.writeShort(0xFFC0); // marker
			byteout.writeShort(17);   // length, truecolor YUV JPG
			byteout.writeByte(8);    // precision
			byteout.writeShort(height);
			byteout.writeShort(width);
			byteout.writeByte(3);    // nrofcomponents
			byteout.writeByte(1);    // IdY
			byteout.writeByte(0x11); // HVY
			byteout.writeByte(0);    // QTY
			byteout.writeByte(2);    // IdU
			byteout.writeByte(0x11); // HVU
			byteout.writeByte(1);    // QTU
			byteout.writeByte(3);    // IdV
			byteout.writeByte(0x11); // HVV
			byteout.writeByte(1);    // QTV
		}
		
		private function writeDQT():void
		{
			byteout.writeShort(0xFFDB); // marker
			byteout.writeShort(132);	   // length
			byteout.writeByte(0);
			
			var i:int;
			const I64:int = 64;
			for (i=0; i<I64; ++i)
				byteout.writeByte(YTable[i]);
			
			byteout.writeByte(1);
			
			for (i=0; i<I64; ++i)
				byteout.writeByte(UVTable[i]);
		}
		
		private function writeDHT():void
		{
			byteout.writeShort(0xFFC4); // marker
			byteout.writeShort(0x01A2); // length
			
			byteout.writeByte(0); // HTYDCinfo
			var i:int;
			const I11:int = 11;
			const I16:int = 16;
			const I161:int = 161;
			for (i=0; i<I16; ++i)
				byteout.writeByte(std_dc_luminance_nrcodes[int(i+1)]);
			
			for (i=0; i<=I11; ++i)
				byteout.writeByte(std_dc_luminance_values[int(i)]);
			
			byteout.writeByte(0x10); // HTYACinfo
			
			for (i=0; i<I16; ++i)
				byteout.writeByte(std_ac_luminance_nrcodes[int(i+1)]);
			
			for (i=0; i<=I161; ++i)
				byteout.writeByte(std_ac_luminance_values[int(i)]);
			
			byteout.writeByte(1); // HTUDCinfo
			
			for (i=0; i<I16; ++i)
				byteout.writeByte(std_dc_chrominance_nrcodes[int(i+1)]);
			
			for (i=0; i<=I11; ++i)
				byteout.writeByte(std_dc_chrominance_values[int(i)]);
			
			byteout.writeByte(0x11); // HTUACinfo
			
			for (i=0; i<I16; ++i)
				byteout.writeByte(std_ac_chrominance_nrcodes[int(i+1)]);
			
			for (i=0; i<=I161; ++i)
				byteout.writeByte(std_ac_chrominance_values[int(i)]);
		}
		
		private function writeSOS():void
		{
			byteout.writeShort(0xFFDA); // marker
			byteout.writeShort(12); // length
			byteout.writeByte(3); // nrofcomponents
			byteout.writeByte(1); // IdY
			byteout.writeByte(0); // HTY
			byteout.writeByte(2); // IdU
			byteout.writeByte(0x11); // HTU
			byteout.writeByte(3); // IdV
			byteout.writeByte(0x11); // HTV
			byteout.writeByte(0); // Ss
			byteout.writeByte(0x3f); // Se
			byteout.writeByte(0); // Bf
		}
		
		// Core processing
		internal var DU:Vector.<int> = new Vector.<int>(64, true);
		
		private function processDU(CDU:Vector.<Number>, fdtbl:Vector.<Number>, DC:Number, HTDC:Vector.<BitString>, HTAC:Vector.<BitString>):Number
		{
			var EOB:BitString = HTAC[0x00];
			var M16zeroes:BitString = HTAC[0xF0];
			var pos:int;
			const I16:int = 16;
			const I63:int = 63;
			const I64:int = 64;
			var DU_DCT:Vector.<int> = fDCTQuant(CDU, fdtbl);
			//ZigZag reorder
			for (var j:int=0;j<I64;++j) {
				DU[ZigZag[j]]=DU_DCT[j];
			}
			var Diff:int = DU[0] - DC; DC = DU[0];
			//Encode DC
			if (Diff==0) {
				writeBits(HTDC[0]); // Diff might be 0
			} else {
				pos = int(32767+Diff);
				writeBits(HTDC[category[pos]]);
				writeBits(bitcode[pos]);
			}
			//Encode ACs
			var end0pos:int = 63;
			for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {};
			//end0pos = first element in reverse order !=0
			if ( end0pos == 0) {
				writeBits(EOB);
				return DC;
			}
			var i:int = 1;
			var lng:int;
			while ( i <= end0pos ) {
				var startpos:int = i;
				for (; (DU[i]==0) && (i<=end0pos); ++i) {}
				var nrzeroes:int = i-startpos;
				if ( nrzeroes >= I16 ) {
					lng = nrzeroes>>4;
					for (var nrmarker:int=1; nrmarker <= lng; ++nrmarker)
						writeBits(M16zeroes);
					nrzeroes = int(nrzeroes&0xF);
				}
				pos = int(32767+DU[i]);
				writeBits(HTAC[int((nrzeroes<<4)+category[pos])]);
				writeBits(bitcode[pos]);
				i++;
			}
			if ( end0pos != I63 ) {
				writeBits(EOB);
			}
			return DC;
		}
		
		private var YDU:Vector.<Number> = new Vector.<Number>(64, true);
		private var UDU:Vector.<Number> = new Vector.<Number>(64, true);
		private var VDU:Vector.<Number> = new Vector.<Number>(64, true);
		
		private function RGB2YUV(img:BitmapData, xpos:int, ypos:int):void
		{
			var pos:int=0;
			const I8:int = 8;
			for (var y:int=0; y<I8; ++y) {
				for (var x:int=0; x<I8; ++x) {
					var P:uint = img.getPixel32(xpos+x,ypos+y);
					var R:int = (P>>16)&0xFF;
					var G:int = (P>> 8)&0xFF;
					var B:int = (P    )&0xFF;
					YDU[int(pos)]=((( 0.29900)*R+( 0.58700)*G+( 0.11400)*B))-0x80;
					UDU[int(pos)]=(((-0.16874)*R+(-0.33126)*G+( 0.50000)*B));
					VDU[int(pos)]=((( 0.50000)*R+(-0.41869)*G+(-0.08131)*B));
					++pos;
				}
			}
		}
		
		public function JPEGEncoder(quality:int=50)
		{
			if (quality <= 0)
				quality = 1;
			
			if (quality > 100)
				quality = 100;
			
			sf = quality < 50 ? int(5000 / quality) : int(200 - (quality<<1));
			init();
		}
		
		private function init():void
		{
			ZigZag.fixed = true;
			aasf.fixed = true;
			YQT.fixed = true;
			UVQT.fixed = true;
			std_ac_chrominance_nrcodes.fixed = true;
			std_ac_chrominance_values.fixed = true;
			std_ac_luminance_nrcodes.fixed = true;
			std_ac_luminance_values.fixed = true;
			std_dc_chrominance_nrcodes.fixed = true;
			std_dc_chrominance_values.fixed = true;
			std_dc_luminance_nrcodes.fixed = true;
			std_dc_luminance_values.fixed = true;
			// Create tables
			initHuffmanTbl();
			initCategoryNumber();
			initQuantTables(sf);
		}
		
		public function encode(image:BitmapData):ByteArray
		{
			// Initialize bit writer
			byteout = new ByteArray();
			
			bytenew=0;
			bytepos=7;
			
			// Add JPEG headers
			byteout.writeShort(0xFFD8); // SOI
			writeAPP0();
			writeDQT();
			writeSOF0(image.width,image.height);
			writeDHT();
			writeSOS();
			
			// Encode 8x8 macroblocks
			var DCY:Number=0;
			var DCU:Number=0;
			var DCV:Number=0;
			bytenew=0;
			bytepos=7;
			
			var width:int = image.width;
			var height:int = image.height;
			
			for (var ypos:int=0; ypos<height; ypos+=8)
			{
				for (var xpos:int=0; xpos<width; xpos+=8)
				{
					RGB2YUV(image, xpos, ypos);
					DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
					DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
					DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
				}
			}
			
			// Do the bit alignment of the EOI marker
			if ( bytepos >= 0 )
			{
				var fillbits:BitString = new BitString();
				fillbits.len = bytepos+1;
				fillbits.val = (1<<(bytepos+1))-1;
				writeBits(fillbits);
			}
			byteout.writeShort(0xFFD9); //EOI
			return byteout;
		}
	}
}

final class BitString
{
	public var len:int = 0;
	public var val:int = 0;
}