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
 *  @file 	hl_types.h
 *  @brief	This file defines some global types
 *  @date 	So 13 Jan 2008
 */  

//----------------------------------------------------------------------	
//include protection
#ifndef HLTYPES_H
#define HLTYPES_H

//----------------------------------------------------------------------	

/**
 * exactly 1 Byte
 */
typedef unsigned char 	hl_uint8;

/**
 * at least 2 Byte
 */
typedef unsigned short int 	hl_uint16;

/**
 * at least 4 Byte
 */
typedef unsigned int hl_uint32;

/**
* at least 8 Byte
*/
#ifdef __GNUC__
	typedef unsigned long long int	hl_uint64;
#elif __MINGW32__
	typedef unsigned long long int	hl_uint64;
#elif _MSC_VER
	typedef unsigned __int64 hl_uint64;
#else
	#error "Unsuppported compiler." \
               "Please use GCC,MINGW,MSVC " \
	       " or define hl_uint64 for your compiler in hl_types.h line 62"
#endif


//----------------------------------------------------------------------	
//end of include protection
#endif

//----------------------------------------------------------------------	
//EOF
