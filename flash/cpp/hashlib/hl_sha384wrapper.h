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

/**
 *  @file 	hl_sha384wrapper.h
 *  @brief	This file contains the definition of the sha384wrapper 
 *  		class.
 *  @date 	Mo 12 Nov 2007
 */  

//----------------------------------------------------------------------	
//include protection
#ifndef SHA384WRAPPER_H
#define SHA384WRAPPER_H

//----------------------------------------------------------------------	
//hashlib++ includes
#include "hl_hashwrapper.h"
#include "hl_sha2ext.h"

//----------------------------------------------------------------------	
//STL
#include <string>

//----------------------------------------------------------------------	

/**
 *  @brief 	This class represents the SHA384 wrapper-class
 *
 *  		You can use this class to easily create a sha384 hash.
 *  		Just create an instance of sha384wrapper and call the
 *  		inherited memberfunctions getHashFromString()
 *  		and getHashFromFile() to create a hash based on a
 *  		string or a file. 
 *
 *  		Have a look at the following example:
 *
 *  @include 	sha384example.cpp
 *
 *  		sha384wrapper implements resetContext(), updateContext()
 *  		and hashIt() to create a hash.
 */  
class sha384wrapper : public hashwrapper
{
	private:

			/**
			 * SHA384 access
			 * via extended SHA2
			 */
			SHA2ext *sha384;

			/**
			 * SHA384 context
			 */
			HL_SHA_384_CTX context;

			/**
			 *  @brief 	This method ends the hash process
			 *  		and returns the hash as string.
			 *
			 *  @return 	a hash as std::string
			 */  
			virtual std::string hashIt(void);

			/**
			 *  @brief 	This internal member-function
			 *  		convertes the hash-data to a
			 *  		std::string (HEX).
			 *
			 *  @param 	data The hash-data to covert into HEX
			 *  @return	the converted data as std::string
			 */  
			virtual std::string convToString(unsigned char *data);

			/**
			 *  @brief 	This method adds the given data to the 
			 *  		current hash context
			 *
			 *  @param 	data The data to add to the current context
			 *  @param 	len The length of the data to add
			 */  
			virtual void updateContext(unsigned char *data, unsigned int len);

			/**
			 *  @brief 	This method resets the current hash context.
			 *  		In other words: It starts a new hash process.
			 */  
			virtual void resetContext(void);

			/**
			 * @brief 	This method should return the hash of the
			 * 		test-string "The quick brown fox jumps over the lazy
			 * 		dog"
			 */
			virtual std::string getTestHash(void);

	public:

			/**
			 *  @brief 	default constructor
			 */  
			sha384wrapper();

			/**
			 *  @brief 	default destructor
			 */  
			virtual ~sha384wrapper();
};

//----------------------------------------------------------------------	
//end of include protection
#endif

//----------------------------------------------------------------------	
//EOF
