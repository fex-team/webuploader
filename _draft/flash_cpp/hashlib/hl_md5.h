/* 
 * hashlib++ - a simple hash library for C++
 * 
 * Copyright (c) 2007-2010 Benjamin Grüdelbach
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 	1)     Redistributions of source code must retain the above copyright
 * 	       notice, this list of conditions and the following disclaimer.
 * 
 * 	2)     Redistributions in binary form must reproduce the above copyright
 * 	       notice, this list of conditions and the following disclaimer in
 * 	       the documentation and/or other materials provided with the
 * 	       distribution.
 * 	     
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

//----------------------------------------------------------------------	

/*
 * The hashlib++ MD5 implementation is derivative from the sourcecode
 * published in RFC 1321 
 * 
 * Copyright (C) 1991-2, RSA Data Security, Inc. Created 1991. All
 * rights reserved.
 * 
 * License to copy and use this software is granted provided that it
 * is identified as the "RSA Data Security, Inc. MD5 Message-Digest
 * Algorithm" in all material mentioning or referencing this software
 * or this function.
 * 
 * License is also granted to make and use derivative works provided
 * that such works are identified as "derived from the RSA Data
 * Security, Inc. MD5 Message-Digest Algorithm" in all material
 * mentioning or referencing the derived work.
 * 
 * RSA Data Security, Inc. makes no representations concerning either
 * the merchantability of this software or the suitability of this
 * software for any particular purpose. It is provided "as is"
 * without express or implied warranty of any kind.
 * 
 * These notices must be retained in any copies of any part of this
 * documentation and/or software.
 */

//----------------------------------------------------------------------	

/**
 *  @file 	hl_md5.h
 *  @brief	This file contains the declaration of the MD5 class
 *  @date 	Mo 17 Sep 2007
 */  

//---------------------------------------------------------------------- 
//include protection
#ifndef MD5_H
#define MD5_H

//---------------------------------------------------------------------- 
//STL includes
#include <string>

//---------------------------------------------------------------------- 
//hl includes
#include "hl_types.h"

//---------------------------------------------------------------------- 
//typedefs
typedef hl_uint8 *POINTER;

/**
 * @brief this struct represents a MD5-hash context.
 */
typedef struct 
{
	/** state (ABCD) */
	unsigned long int state[4];   	      

	/** number of bits, modulo 2^64 (lsb first) */
	unsigned long int count[2];

	/** input buffer */
	unsigned char buffer[64];
} HL_MD5_CTX;

//---------------------------------------------------------------------- 

/**
 *  @brief 	This class represents the implementation of 
 *   		the md5 message digest algorithm.
 *
 *   		Basically the class provides three public member-functions
 *   		to create a hash:  MD5Init(), MD5Update() and MD5Final().
 *   		If you want to create a hash based on a string or file quickly
 *   		you should use the md5wrapper class instead of MD5.
 */  
class MD5
{

	private:

		/**
		 *  @brief 	Basic transformation. Transforms state based on block.
		 *  @param	state	state to transform
		 *  @param	block	block to transform
		 */  
		void MD5Transform (unsigned long int state[4], unsigned char block[64]);

		/**
		 *  @brief 	Encodes input data
		 *  @param	output Encoded data as OUT parameter
		 *  @param	input Input data
		 *  @param	len The length of the input assuming it is a
		 *  		multiple of 4
		 */  
		void Encode (unsigned char* output,
			     unsigned long int *input,
			     unsigned int len);

		/**
		 *  @brief 	Decodes input data into output
		 *  @param	output Decoded data as OUT parameter
		 *  @param	input Input data
		 *  @param	len The length of the input assuming it is a
		 *  		multiple of 4
		 */  
		void Decode (unsigned long int *output,
			     unsigned char *input,
			     unsigned int len);

		/**
		 *  @brief 	internal memory management
		 *  @param	output OUT parameter where POINTER is an unsigned
		 *  		char*
		 *  @param	input Data to copy where POINTER is a unsigned char*
		 *  @param	len The length of the data
		 */  
		void MD5_memcpy (POINTER output, POINTER input, unsigned int len);

		/**
		 *  @brief 	internal memory management
		 *  @param 	output OUT parameter where POINTER is an unsigned
		 *  		char*
		 *  @param	value Value to fill the memory with
		 *  @param	len The length of the data
		 *  
		 */  
		void MD5_memset (POINTER output, int value, unsigned int len);

	public:
	
		/**
		 *  @brief 	Initialization begins an operation,
		 *  		writing a new context
		 *  @param 	context	The HL_MD5_CTX context to initialize
		 */  
		void MD5Init (HL_MD5_CTX* context);

		/**
		 *  @brief 	Block update operation. Continues an md5
		 *  		message-digest operation, processing another
		 *  		message block, and updating the context.
		 *  @param	context The HL_MD5_CTX context to update
		 *  @param	input The data to write into the context
		 *  @param	inputLen The length of the input data
		 */  
		void MD5Update (HL_MD5_CTX* context,
			       	unsigned char *input,
			       	unsigned int inputLen);

		/**
		 *  @brief 	Finalization ends the md5 message-digest 
		 *  		operation, writing the the message digest and
		 *  		zeroizing the context.
		 *  @param	digest This is an OUT parameter which contains
		 *  		the created hash after the method returns
		 *  @param	context The context to finalize
		 */  
		void MD5Final (unsigned char digest[16], HL_MD5_CTX* context);

		/**
		 *  @brief 	default constructor
		 */  
		MD5(){};
};

//---------------------------------------------------------------------- 
//End of include protection
#endif

//---------------------------------------------------------------------- 
//EOF
