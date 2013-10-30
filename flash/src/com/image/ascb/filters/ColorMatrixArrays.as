package com.image.ascb.filters {

	public class ColorMatrixArrays {

		public static const DIGITAL_NEGATIVE:Array = [-1, 0, 0, 0, 255, 0, -1, 0, 0, 255, 0, 0, -1, 0, 255, 0, 0, 0, 1, 0];
		public static const GRAYSCALE:Array = [0.3086, 0.6094, 0.0820, 0, 0, 0.3086, 0.6094, 0.0820, 0, 0, 0.3086, 0.6094, 0.0820, 0, 0, 0, 0, 0, 1, 0];
		public static const SEPIA:Array = [0.3930000066757202, 0.7689999938011169, 0.1889999955892563, 0, 0, 0.3490000069141388, 0.6859999895095825, 0.1679999977350235, 0, 0, 0.2720000147819519, 0.5339999794960022, 0.1309999972581863, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];

	  	public static function getSaturationArray(nValue:Number):Array {
			var nRed:Number = 0.3086,
		  		nGreen:Number = 0.6094,
				nBlue:Number = 0.0820,
				nA:Number = (1 - nValue) * nRed + nValue,
				nB:Number = (1 - nValue) * nGreen,
				nC:Number = (1 - nValue) * nBlue,
				nD:Number = (1 - nValue) * nRed,
				nE:Number = (1 - nValue) * nGreen + nValue,
				nF:Number = (1 - nValue) * nBlue,
				nG:Number = (1 - nValue) * nRed,
				nH:Number = (1 - nValue) * nGreen,
				nI:Number = (1 - nValue) * nBlue + nValue;

	      return [nA, nB, nC, 0, 0, nD, nE, nF, 0, 0, nG, nH, nI, 0, 0, 0, 0, 0, 1, 0];
	 	}

	  	public static function getContrastArray(nValue:Number) : Array
		{
	  	  var nScale:Number = nValue * 11,
			  nOffset:Number = 63.6 - (nValue * 698.5);

	  	  return [nScale, 0, 0, 0, nOffset, 0, nScale, 0, 0, nOffset, 0, 0, nScale, 0, nOffset, 0, 0, 0, 1, 0];
	  	}

		public static function getBrightnessArray(nValue:Number) : Array
		{
			return [1, 0, 0, 0, nValue, 0, 1, 0, 0, nValue, 0, 0, 1, 0, nValue, 0, 0, 0, 1, 0];
		}

	}
}