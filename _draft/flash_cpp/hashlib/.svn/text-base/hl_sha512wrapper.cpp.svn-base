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
 *  @file 	hl_sha512wrapper.cpp
 *  @brief	This file contains the implementation of the sha512wrapper 
 *  		class.
 *  @date 	Mo 12 Nov 2007
 */  

//----------------------------------------------------------------------	
//hashlib++ includes
#include "hl_sha512wrapper.h"

//----------------------------------------------------------------------	
//STL includes
#include <string>

//----------------------------------------------------------------------	
//private memberfunctions

/**
 *  @brief 	This method ends the hash process
 *  		and returns the hash as string.
 *
 *  @return 	a hash as std::string
 */  
std::string sha512wrapper::hashIt(void)
{
	sha2_byte buff[SHA512_DIGEST_STRING_LENGTH];
	sha512->SHA512_End(&context,(char*)buff);
	return convToString(buff);
}

/**
 *  @brief 	This internal member-function
 *  		convertes the hash-data to a
 *  		std::string (HEX).
 *
 *  @param 	data The hash-data to covert into HEX
 *  @return	the converted data as std::string
 */  
std::string sha512wrapper::convToString(unsigned char *data)
{
	/*
	 * we can just copy data to a string, because 
	 * the transforming to hash is already done
	 * within the sha512 implementation
	 */
	return std::string((const char*)data);
}

/**
 *  @brief 	This method adds the given data to the 
 *  		current hash context
 *
 *  @param 	data The data to add to the current context
 *  @param 	len The length of the data to add
 */  
void sha512wrapper::updateContext(unsigned char *data, unsigned int len)
{
	this->sha512->SHA512_Update(&context,data,len);
}

/**
 *  @brief 	This method resets the current hash context.
 *  		In other words: It starts a new hash process.
 */  
void sha512wrapper::resetContext(void)
{
	sha512->SHA512_Init(&context);
}

/**
 * @brief 	This method should return the hash of the
 * 		test-string "The quick brown fox jumps over the lazy
 * 		dog"
 */
std::string sha512wrapper::getTestHash(void)
{
	return "07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb642e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6";
}

//----------------------------------------------------------------------	
//public memberfunctions

/**
 *  @brief 	default constructor
 */  
sha512wrapper::sha512wrapper()
{
	this->sha512 = new SHA2ext();
}

/**
 *  @brief 	default destructor
 */  
sha512wrapper::~sha512wrapper()
{
	delete sha512;
}
