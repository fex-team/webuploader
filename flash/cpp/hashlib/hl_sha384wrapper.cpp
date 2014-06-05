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
 *  @file 	hl_sha384wrapper.cpp
 *  @brief	This file contains the implementation of the sha384wrapper 
 *  		class.
 *  @date 	Mo 12 Nov 2007
 */  
//----------------------------------------------------------------------	
//hashlib++ includes
#include "hl_sha384wrapper.h"

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
std::string sha384wrapper::hashIt(void)
{
	sha2_byte buff[SHA384_DIGEST_STRING_LENGTH];
	sha384->SHA384_End(&context,(char*)buff);
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
std::string sha384wrapper::convToString(unsigned char *data)
{
	/*
	 * we can just copy data to a string, because 
	 * the transforming to hash is already done
	 * within the sha384 implementation
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
void sha384wrapper::updateContext(unsigned char *data, unsigned int len)
{
	this->sha384->SHA384_Update(&context,data,len);
}

/**
 *  @brief 	This method resets the current hash context.
 *  		In other words: It starts a new hash process.
 */  
void sha384wrapper::resetContext(void)
{
	sha384->SHA384_Init(&context);
}

/**
 * @brief 	This method should return the hash of the
 * 		test-string "The quick brown fox jumps over the lazy
 * 		dog"
 */
std::string sha384wrapper::getTestHash(void)
{ 
	return "ca737f1014a48f4c0b6dd43cb177b0afd9e5169367544c494011e3317dbf9a509cb1e5dc1e85a941bbee3d7f2afbc9b1";
}

//----------------------------------------------------------------------	
//public memberfunctions

/**
 *  @brief 	default constructor
 */  
sha384wrapper::sha384wrapper()
{
	this->sha384 = new SHA2ext();
}

/**
 *  @brief 	default destructor
 */  
sha384wrapper::~sha384wrapper()
{
	delete sha384;
}
