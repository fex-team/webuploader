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
 *  @file 	hl_wrapperfactory.h
 *  @brief	This file contains a simple hashwrapper factory
 *  @date 	DO 13 Oct 2011
 */  

//----------------------------------------------------------------------	
//include protection
#ifndef WRAPPERFACTORY_H
#define WRAPPERFACTORY_H

//---------------------------------------------------------------------- 
//hashlib++ includes
#include "hl_hashwrapper.h"

//----------------------------------------------------------------------	
//enumeration

/*
 * definition of the supported hashtypes 
 */
enum HL_Wrappertype { HL_MD5, HL_SHA1, HL_SHA256, HL_SHA384, HL_SHA512 };

//---------------------------------------------------------------------- 

/**
 *  @brief	This class represents a simple factory for creating wrappers.
 *
 *		U can use this class for dynamicly create wrappers of a given
 * 		type at runtime. 
 */
class wrapperfactory
{
	public:

		/**
		 * @brief	Simple factory-method to create a hashwrapper
		 * 
		 * @param	type The type of the hash algorithm to create a wrapper for
		 * @return	A hashwrapper for the fiven type
		 */
		hashwrapper* create(HL_Wrappertype type);

		/**
		 * @brief	Simple factory-method to create a hashwrapper
		 * 
		 * @param	type the simple name of the type for example "md5"
		 * @return	A hashwrapper for the fiven type
		 */
		hashwrapper* create(std::string type);
};

//----------------------------------------------------------------------	
//end of include protection
#endif

//----------------------------------------------------------------------	
//EOF
