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
 *  @file 	hl_exception.h
 *  @brief	This file contains the hashlib++ exception class
 *  @date 	Sa 24 Nov 2007
 */  


//---------------------------------------------------------------------- 
//include protection
#ifndef HL_EXCEPTION_H
#define HL_EXCEPTION_H

//---------------------------------------------------------------------- 
//STL
#include <string>

//----------------------------------------------------------------------

/**
 * definition of hashlib++ errornumbers
 */
typedef enum hlerrors
{
	HL_NO_ERROR = 0,
	HL_FILE_READ_ERROR,
	HL_VERIFY_TEST_FAILED,
	HL_UNKNOWN_SEE_MSG,
	HL_UNKNOWN_HASH_TYPE
} hlerror;

//----------------------------------------------------------------------

/**
 *  @brief	This class represents a exception within the hashlib++
 *  		project
 */  
class hlException
{
	private:

			/**
			 * Error Number
			 */
			hlerror iError;

			/**
			 * Error message as string
			 */
			std::string strMessge;
			

	public:
			/**
			 *  @brief 	constructor
			 *  @param	er	Error number
			 *  @param	m	Error message
			 */  
			hlException(hlerror er, std::string m)
			{
				this->iError = er;
				this->strMessge = m;
			}

			/**
			 *  @brief 	constructor
			 *  @param	m	Error Message
			 */  
			hlException(std::string m)
			{
				this->iError = HL_UNKNOWN_SEE_MSG;
				this->strMessge = m;
			}

			/**
			 *  @brief 	returns the error message
			 *  @return	the error message
			 */  
			std::string error_message(void)
			{
				return strMessge;
			}

			/**
			 *  @brief 	returns the error number
			 *  @return	the error number
			 */  
			hlerror error_number(void)
			{
				return iError;
			}
};

//----------------------------------------------------------------------
//end of include protection
#endif

//----------------------------------------------------------------------
//EOF
