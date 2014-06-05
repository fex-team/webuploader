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
 * The hashlib++ SHA384 and SHA512 implementations are derivative from the
 * sourcecode published by Aaron D. Gifford
 *
 * Copyright (c) 2000-2001, Aaron D. Gifford
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTOR(S) ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTOR(S) BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

//---------------------------------------------------------------------- 

/**
 *  @file 	hl_sha2ext.h
 *  @brief	This file contains the declaration of the SHA384 and 
 *  		SHA512 classes
 *  @date 	Mo 12 Nov 2007
 */  

//---------------------------------------------------------------------- 
//include protection
#ifndef SHA2ext_H
#define SHA2ext_H

//----------------------------------------------------------------------
//lenght defines
#define SHA384_BLOCK_LENGTH             128
#define SHA384_DIGEST_LENGTH            48
#define SHA384_DIGEST_STRING_LENGTH     (SHA384_DIGEST_LENGTH * 2 + 1)
#define SHA512_BLOCK_LENGTH             128
#define SHA512_DIGEST_LENGTH            64
#define SHA512_DIGEST_STRING_LENGTH     (SHA512_DIGEST_LENGTH * 2 + 1)
#define SHA512_SHORT_BLOCK_LENGTH	(SHA512_BLOCK_LENGTH - 16)

//---------------------------------------------------------------------- 
//hl includes
#include "hl_types.h"

//---------------------------------------------------------------------- 
//typedefs

/**
 * Exactly 1 byte 
 */ 
typedef hl_uint8  sha2_byte;	

/**
 * Exactly 4 bytes 
 */
typedef hl_uint32 sha2_word32;	

/**
 * Exactly 8 bytes 
 */ 
typedef hl_uint64 sha2_word64;	

/**
 * @brief This struct represents a SHA512-hash context
 */
typedef struct HL_SHA512_CTX 
{
	hl_uint64       state[8];
	hl_uint64       bitcount[2];
	hl_uint8        buffer[SHA512_BLOCK_LENGTH];
} HL_SHA512_CTX;


/**
 * @brief This struct represents a SHA384-hash context
 */
typedef HL_SHA512_CTX HL_SHA_384_CTX;

//----------------------------------------------------------------------

/**
 *  @brief 	This class represents the implementation of 
 *   		the SHA384 and SHA512 algorithm.
 *
 *   		Basically the class provides six public member-functions
 *   		to create a hash:  SHA384_Init(), SHA384_Update(), SHA384_End(),
 *		SHA512_Init(), SHA512_Update() and SHA512_End().
 *   		If you want to create a hash based on a string or file quickly
 *   		you should use the sha384wrapper or sha512wrapper classes.
 */  
class SHA2ext
{
	private:

		/**
		 *  @brief 	Finalize the sha384 operation
		 *  @param	digest The digest to finalize the operation with.
		 *  @param	context The context to finalize.
		 */  
		void SHA384_Final(hl_uint8 digest[SHA384_DIGEST_LENGTH],
			          HL_SHA_384_CTX* context);

		/**
		 *  @brief 	Finalize the sha512 operation
		 *  @param	digest The digest to finalize the operation with.
		 *  @param	context The context to finalize.
		 */  
		void SHA512_Final(hl_uint8 digest[SHA512_DIGEST_LENGTH],
			       	  HL_SHA512_CTX* context);

		/**
		 *  @brief 	Internal method
		 *
		 *  		used by SHA512 and SHA384
		 *  @author	Benjamin Grüdelbach
		 *  @param	context The context of the operation
		 */  
		void SHA512_Last(HL_SHA512_CTX* context);

		/**
		 *  @brief 	Internal data transformation
		 *  @param	context The context to use
		 *  @param	data The data to transform	
		 */  
		void SHA512_Transform(HL_SHA512_CTX* context,
			              const sha2_word64* data);


	public:

		/**
		 *  @brief 	Initialize the SHA384 context
		 *  @param	context The context to init.
		 */  
		void SHA384_Init(HL_SHA_384_CTX* context);

		/**
		 *  @brief 	Initialize the SHA512 context
		 *  @param	context The context to init.
		 */  
		void SHA512_Init(HL_SHA512_CTX* context);

		/**
		 *  @brief	Updates the SHA512 context 
		 *  @param	context The context to update.
		 *  @param	data The data for updating the context.
		 *  @param	len The length of the given data.
		 */  
		void SHA384_Update(HL_SHA_384_CTX* context,
			           const hl_uint8* data,
				   unsigned int len);

		/**
		 *  @brief	Updates the SHA284 context 
		 *  @param	context The context to update.
		 *  @param	data The data for updating the context.
		 *  @param	len The length of the given data.
		 */  
		void SHA512_Update(HL_SHA512_CTX* context,
			           const hl_uint8* data,
				   unsigned int len);

		/**
		 *  @brief 	Ends the SHA384 operation and return the
		 *  		created hash in the given buffer.
		 *  @param	context The context to end.
		 *  @param	buffer This OUT-Parameter contains the created
		 *  		hash after ending the operation.
		 */  
		char* SHA384_End(HL_SHA_384_CTX* context,
			       	 char buffer[SHA384_DIGEST_STRING_LENGTH]);

		/**
		 *  @brief 	Ends the SHA512 operation and return the
		 *  		created hash in the given buffer.
		 *  @param	context The context to end.
		 *  @param	buffer This OUT-Parameter contains the created
		 *  		hash after ending the operation.
		 */  
		char* SHA512_End(HL_SHA512_CTX* context,
			       	 char buffer[SHA512_DIGEST_STRING_LENGTH]);

};


//----------------------------------------------------------------------
//end of include protection
#endif

//----------------------------------------------------------------------
//EOF
