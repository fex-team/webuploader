/* 
 * hashlib++ - a simple hash library for C++
 * 
 * Copyright (c) 2007-2011 Benjamin Grüdelbach
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
//doxygen mainpage

/**
 * @mainpage  hashlib++ source documentation
 *
 * 	      <div align="center"><b>Version 0.3.4</b></div>
 * 	      
 *
 * 	      @section intro Introduction
 * 	      hashlib++ a simple hash library for C++  \n
 * 	      Copyright (c) 2007-2011 Benjamin Gr&uuml;delbach
 *
 *
 *
 * 	      hashlib++ is a simple and very easy to use library to create a
 * 	      cryptographic checksum called "hash". hashlib++ is written in
 * 	      plain C++ and should work with every compiler and platform.
 * 	      hashlib++ is released under the BSD-license and
 * 	      therefore free software.
 *
 * 	      @section about About this document
 *
 * 	      This is the documentation about the hashlib++ sourcecode.
 * 	      Since it contains some internal information it its helpfull
 * 	      but not necessary to read for the average user.
 * 	      If you are new to hashlib++ you should start with reading
 * 	      the README.TXT file which contains all relevant information
 * 	      to start using this library.
 *
 */


//----------------------------------------------------------------------	

/**
 *  @file 	hl_hashwrapper.h
 *  @brief	This file contains the hashwrapper base class
 *  @date 	Mo 17 Sep 2007
 */  

//----------------------------------------------------------------------	
//include protection
#ifndef HASHWRAPPER_H
#define HASHWRAPPER_H

//----------------------------------------------------------------------	
//STL includes
#include <string>

//----------------------------------------------------------------------	
//C includes
//#include <stdio.h>
#include <fstream>

//----------------------------------------------------------------------	
//hashlib++ includes
#include "hl_exception.h"

//----------------------------------------------------------------------	

/**
 *  @brief 	This class represents the baseclass for all subwrappers
 *
 *  hashwrapper is the abstract base class of all subwrappers like md5wrapper
 *  or sha1wrapper. This class implements two simple and easy to use
 *  memberfunctions to create a hash based on a string or a file.
 *  ( getHashFromString() and getHashFromFile() )
 *
 *  getHashFromString() calls resetContext(), updateContext() and hashIt()
 *  in this order. These three memberfunctions are pure virtual and have to
 *  be implemented by the subclasses.
 *
 *  getHashFromFile() calls resetContext() before reading the specified file
 *  in 1024 byte blocks which are forwarded to the hash context by calling
 *  updateContext(). Finaly hashIt() is called to return the hash.
 */  
class hashwrapper
{
	private:
		const std::string teststring;

	protected:

		/**
		 *  @brief 	This method finalizes the hash process
		 *  		and returns the hash as std::string
		 *
		 *  		This memberfunction is pure virtual and
		 *  		has to be implemented by the subclass
		 *
		 *  @return 	the created hash as std::string
		 */  
		virtual std::string hashIt(void) = 0;

		/**
		 *  @brief 	This internal member-function
		 *  		convertes the hash-data to a
		 *  		std::string (HEX)
		 *
		 *  		This memberfunction is pure virtual and
		 *  		has to be implemented by the subclass
		 *
		 *  @param 	data The hash-data to covert into HEX
		 *  @return	The converted data as std::string
		 */  
		virtual std::string convToString(unsigned char *data) = 0;

		/**
		 *  @brief 	This method adds the given data to the 
		 *  		current hash context
		 *
		 *  		This memberfunction is pure virtual and
		 *  		has to be implemented by the subclass
		 *
		 *  @param 	data The data to add to the current context
		 *  @param 	len The length of the data to add
		 */  
		virtual void updateContext(unsigned char *data, unsigned int len) = 0;

		/**
		 *  @brief 	This method resets the current hash context.
		 *  		In other words: It starts a new hash process.
		 *
		 *  		This memberfunction is pure virtual and
		 *  		has to be implemented by the subclass
		 */  
		virtual void resetContext(void) = 0;


		/**
		 * @brief 	This method should return the hash of the
		 * 		test-string "The quick brown fox jumps over the lazy
		 * 		dog"
		 */
		virtual std::string getTestHash(void) = 0;

	public:

		/**
		 * @brief Default Konstruktor
		 */
		hashwrapper( void ) 
			: teststring("The quick brown fox jumps over the lazy dog")
		{
		}

		/**
		 *  @brief 	Default destructor
		 */  
		virtual ~hashwrapper ( void ) { };

		/**
		 * @brief Method for testing the concrete implementation
		 */
		virtual void test( void )
		{
			std::string hash = this->getHashFromString(teststring);
			std::string verify = this->getTestHash();
			if(hash != verify)
			{
				throw hlException(HL_VERIFY_TEST_FAILED,
						  "hashlib test-error: \"" + 
						  hash +
						  "\" is not \"" + 
						  verify + 
						  "\" as supposed to be.");
			}
		}

		/**
		 *  @brief 	This method creates a hash based on the
		 *  		given string
		 *
		 *  		This memberfunctions calls resetContext(),
		 *  		updateContext() and hashIt() in this order.
		 *  		These three memberfunctions are pure virtual and have to
		 *  		be implemented by the subclasses.
		 *
		 *  @param 	text The text to create a hash from. This
		 *  		parameter is forwarded to updateContext()
		 *  @return 	the created hash as std::string
		 */  
		virtual std::string getHashFromString(std::string text)
		{
			/*
			 * reset the context so that we can start
			 * with a new hash process
			 */
			resetContext();

			/*
			 * we update the context with the given text
			 */
			updateContext((unsigned char*) text.c_str(),text.length());

			/*
			 * now we can close the hash process 
			 * and return the created hash
			 */
			return this->hashIt(); 
		}

		/**
		 *  @brief 	This method creates a hash from a given file
		 *
		 *  		First of all resetContext() is called before reading the
		 *  		specified file	in 1024 byte blocks which are forwarded
		 *  		to the hash context by calling updateContext().
		 *  		Finaly hashIt() is called to return the hash.
		 *  		These three memberfunctions are pure virtual and have to
		 *  		be implemented by the subclasses.
		 *
		 *  @param 	filename The file to created a hash from
		 *
		 *  @return	The created hash of the file or "-1" in case
		 *  		the file could not be opened
		 *  @throw	Throws a hlException if the specified file could not
		 *  		be opened.
		 */  
		virtual std::string getHashFromFile(std::string filename)
		{
			FILE *file;
			int len;
			unsigned char buffer[1024];

			/*
			 * reset the current hash context
			 */
			resetContext();

			/*
			 * open the specified file
			 */
			if((file = fopen(filename.c_str(), "rb")) == NULL)
			{
				throw hlException(HL_FILE_READ_ERROR,
						  "Cannot read file \"" + 
						  filename + 
						  "\".");
			}

			/*
			 * read the file in 1024b blocks and
			 * update the context for every block
			 */
			while( (len = fread(buffer,1,1024,file)) )
			{
				updateContext(buffer, len);
			}

			//close the file and create the hash
			fclose(file);
			return(hashIt());
		}
}; 

//----------------------------------------------------------------------	
//end of include protection
#endif

//----------------------------------------------------------------------	
//EOF
