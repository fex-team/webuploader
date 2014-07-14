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
 *  @file 	hl_sha1wrapper.cpp
 *  @brief	This file contains the implementation of the 
 *  		sha1wrapper class
 *  @date 	Mo 17 Sep 2007
 */  

//----------------------------------------------------------------------	
//hashlib++ includes
#include "hl_sha1wrapper.h"
#include "hl_sha1.h"
#include "hl_types.h"

//---------------------------------------------------------------------- 
//STL includes
#include <sstream>

//----------------------------------------------------------------------	
//private memberfunctions

/**
 *  @brief 	This method ends the hash process
 *  		and returns the hash as string.
 *
 *  @return 	a hash as std::string
 */  
std::string sha1wrapper::hashIt(void)
{
	hl_uint8 Message_Digest[20];
	sha1->SHA1Result(&context, Message_Digest);

	return convToString(Message_Digest);
}

/**
 *  @brief 	This internal member-function
 *  		convertes the hash-data to a
 *  		std::string (HEX).
 *
 *  @param 	data The hash-data to covert into HEX
 *  @return	the converted data as std::string
 */  
std::string sha1wrapper::convToString(unsigned char *data)
{
	std::ostringstream os;
	for(int i=0; i<20; ++i)
	{
		/*
		 * set the width to 2
		 */
		os.width(2);

		/*
		 * fill with 0
		 */
		os.fill('0');

		/*
		 * conv to hex
		 */
		os << std::hex << static_cast<unsigned int>(data[i]);
	}

	/*
	 * return as std::string
	 */
	return os.str();
}

/**
 *  @brief 	This method adds the given data to the 
 *  		current hash context
 *
 *  @param 	data The data to add to the current context
 *  @param 	len The length of the data to add
 */  
void sha1wrapper::updateContext(unsigned char *data, unsigned int len)
{
	sha1->SHA1Input(&context, data, len);
}

/**
 *  @brief 	This method resets the current hash context.
 *  		In other words: It starts a new hash process.
 */  
void sha1wrapper::resetContext(void)
{
	sha1->SHA1Reset(&context);
}

/**
 * @brief 	This method should return the hash of the
 * 		test-string "The quick brown fox jumps over the lazy
 * 		dog"
 */
std::string sha1wrapper::getTestHash(void)
{
	return "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12";
}

//----------------------------------------------------------------------	
//public memberfunctions

/**
 *  @brief 	default constructor
 */  
sha1wrapper::sha1wrapper()
{
	this->sha1 = new SHA1();
}

/**
 *  @brief 	default destructor
 */  
sha1wrapper::~sha1wrapper()
{
	delete this->sha1;
}

//----------------------------------------------------------------------
//EOF
