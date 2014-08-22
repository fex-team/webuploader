#include <stdlib.h>
#include <string>
#include "AS3/AS3.h"

#include "hashlib/hl_hashwrapper.h"
#include "hashlib/hl_md5wrapper.h"

void md5String() __attribute__((used,
    annotate("as3sig:public function md5String(input:String):String"),
    annotate("as3package:com.webuploader")));


/**
 * MD5 ("") = d41d8cd98f00b204e9800998ecf8427e
 * MD5 ("a") = 0cc175b9c0f1b6a831c399e269772661
 * MD5 ("abc") = 900150983cd24fb0d6963f7d28e17f72
 * MD5 ("message digest") = f96b697d7cb7938d525a2f31aaf161d0
 * MD5 ("abcdefghijklmnopqrstuvwxyz") = c3fcd3d76192e4007dfb496cca67e13b
 * MD5 ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") =
 * d174ab98d277d9f5a5611c2c9f419d9f
 * MD5 ("123456789012345678901234567890123456789012345678901234567890123456
 * 78901234567890") = 57edf4a22be3c955ac49da2e2107b67a
 */
void md5String(){
    const char *src = NULL;
    AS3_MallocString(src, input);

    std::string srcString(src);

    const char *result;

    hashwrapper *wrapper;

    wrapper = new md5wrapper();
    std::string md5 = wrapper->getHashFromString(srcString);

    result = md5.c_str();

    delete wrapper;

    // We can't just call AS3_Return(s) because s is not a scalar.
    // Instead we need to marshall the C string into AS3 and use
    // AS3_ReturnAS3Var().

    AS3_DeclareVar(myString, String);
    AS3_CopyCStringToVar(myString, result, 32);
    AS3_ReturnAS3Var(myString);
}