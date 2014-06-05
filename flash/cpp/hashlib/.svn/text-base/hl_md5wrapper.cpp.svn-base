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
 *  @file 	hl_md5wrapper.cpp
 *  @brief	This file contains the implementation of the 
 *  		md5wrapper class
 *  @date 	Mo 17 Sep 2007
 */  

//---------------------------------------------------------------------- 
//STL includes
#include <string>
#include <fstream>
#include <iostream>
#include <sstream>

//---------------------------------------------------------------------- 
//hashlib++ includes
#include "hl_md5wrapper.h"

//---------------------------------------------------------------------- 
//private member functions

/**
 *  @brief 	This method ends the hash process
 *  		and returns the hash as string.
 *
 *  @return 	the hash as std::string
 */  
std::string md5wrapper::hashIt(void)
{
	//create the hash
	unsigned char buff[16] = "";	
	md5->MD5Final((unsigned char*)buff,&ctx);

	//converte the hash to a string and return it
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
std::string md5wrapper::convToString(unsigned char *data)
{
	/*
	 * using a ostringstream to convert the hash in a
	 * hex string
	 */
	std::ostringstream os;
	for(int i=0; i<16; ++i)
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
 *  		current hash context.
 *
 *  @param 	data The data to add to the current context
 *  @param 	len The length of the data to add
 */  
void md5wrapper::updateContext(unsigned char *data, unsigned int len)
{
	//update 
	md5->MD5Update(&ctx, data, len);
}

/**
 *  @brief 	This method resets the current hash context.
 *  		In other words: It starts a new hash process.
 */  
void md5wrapper::resetContext(void)
{
	//init md5
	md5->MD5Init(&ctx);
}

/**
 * @brief 	This method should return the hash of the
 * 		test-string "The quick brown fox jumps over the lazy
 * 		dog"
 */
std::string md5wrapper::getTestHash(void)
{
	return "9e107d9d372bb6826bd81d3542a419d6";
}

//---------------------------------------------------------------------- 
//public member functions

/**
 *  @brief 	default constructor
 */  
md5wrapper::md5wrapper()
{
	md5 = new MD5();
}

/**
 *  @brief 	default destructor
 */  
md5wrapper::~md5wrapper()
{
	delete md5;
}

//---------------------------------------------------------------------- 
//EOF
