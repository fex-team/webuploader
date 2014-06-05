T05: check
	@echo "-------- Sample 5 --------"

	@echo && echo "Now compile a SWC and demo SWF"
	"$(FLASCC)/usr/bin/g++" $(BASE_CFLAGS) \
			main.cpp \
			as3api.cpp \
			hashlib/hl_md5.cpp \
			hashlib/hl_md5wrapper.cpp \
		-O4 -disable-telemetry -flto-api=exports.txt\
		-emit-swc=com.webuploader -o Test.swc
	# "$(FLEX)/bin/mxmlc" -static-link-runtime-shared-libraries -compiler.omit-trace-statements=false -library-path=MurmurHash.swc -debug=false swcdemo.as -o swcdemo.swf

FLASCC:=X
FLEX:=X
AS3COMPILER:=asc2.jar
BASE_CFLAGS:=-Werror -Wno-write-strings -Wno-trigraphs

$?UNAME=$(shell uname -s)
ifneq (,$(findstring CYGWIN,$(UNAME)))
	$?nativepath=$(shell cygpath -at mixed $(1))
	$?unixpath=$(shell cygpath -at unix $(1))
else
	$?nativepath=$(abspath $(1))
	$?unixpath=$(abspath $(1))
endif

ifneq (,$(findstring "asc2.jar","$(AS3COMPILER)"))
	$?AS3COMPILERARGS=java $(JVMARGS) -jar $(call nativepath,$(FLASCC)/usr/lib/$(AS3COMPILER)) -merge -md
else
	echo "ASC is no longer supported" ; exit 1 ;
endif

check:
	@if [ -d $(FLASCC)/usr/bin ] ; then true ; \
	else echo "Couldn't locate FLASCC sdk directory, please invoke make with \"make FLASCC=/path/to/FLASCC/sdk ...\"" ; exit 1 ; \
	fi

	@if [ -d "$(FLEX)/bin" ] ; then true ; \
	else echo "Couldn't locate Flex sdk directory, please invoke make with \"make FLEX=/path/to/flex  ...\"" ; exit 1 ; \
	fi


clean:
	rm -f *.swf *.swc *.bc *.exe
