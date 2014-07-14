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
 *  @file 	hl_wrapperfactory.cpp
 *  @brief	This file contains the implementation of the 
 *		wrapperfactory class
 *  @date 	DO 13 Oct 2011
 */  

//---------------------------------------------------------------------- 
#include <algorithm>
#include "hl_wrapperfactory.h"
#include "hashlibpp.h"



//---------------------------------------------------------------------- 
//public member functions

/**
 * @brief	Simple factory-method to create a hashwrapper
 * 
 * @param	type The type of the hash algorithm to create a wrapper for
 * @return	A hashwrapper for the fiven type
 */
hashwrapper* wrapperfactory::create(HL_Wrappertype type)
{
	if(type == HL_MD5)
	{
		return new md5wrapper();
	}
	else if(type == HL_SHA1)
	{
		return new sha1wrapper();
	}
	else if(type == HL_SHA256)
	{
		return new sha256wrapper();
	}
	else if(type == HL_SHA384)
	{
		return new sha384wrapper();
	}
	else if(type == HL_SHA512)
	{
		return new sha512wrapper();
	}

	throw hlException(HL_UNKNOWN_HASH_TYPE,"Unknown hashtype");
}

/**
 * @brief	Simple factory-method to create a hashwrapper
 * 
 * @param	type The type of the hash algorithm to create a wrapper for
 * @return	A hashwrapper for the fiven type
 */
hashwrapper* wrapperfactory::create(std::string type)
{
 	std::transform(type.begin(), type.end(), type.begin(), ::toupper);
	if(type == "MD5")
	{
		return new md5wrapper();
	}
	else if(type == "SHA1")
	{
		return new sha1wrapper();
	}
	else if(type == "SHA256")
	{
		return new sha256wrapper();
	}
	else if(type == "SHA384")
	{
		return new sha384wrapper();
	}
	else if(type == "SHA512")
	{
		return new sha512wrapper();
	}
	return NULL;
}

//---------------------------------------------------------------------- 
//EOF
