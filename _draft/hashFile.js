// 此文件在worker环境下运行。
importScripts('md5.js');

var hashMe = function(file, callbackFunction) {

  var thisObj = this,
    _binStart = "",
    _binEnd = "",
    callback = "",
    fileManager1 = new FileReader,
    fileManager2 = new FileReader;

  thisObj.setBinAndHash = function(startOrEnd, binData) {

    switch (startOrEnd) {
      case 0:
        thisObj._binStart = binData;
        break;
      case 1:
        thisObj._binEnd = binData;
    }

    thisObj._binStart && thisObj._binEnd && thisObj.md5sum(thisObj._binStart, thisObj._binEnd)
  };

  thisObj.md5sum = function(start, end) {
    thisObj._hash = md5(start + end);
    callback(thisObj._hash);
  };

  thisObj.getHash = function() {
    return thisObj._hash;
  };

  thisObj.calculateHashOfFile = function(file) {

    fileManager1.onload = function(f) {
      thisObj.setBinAndHash(0, f.target.result);
    };

    fileManager2.onload = function(f) {
      thisObj.setBinAndHash(1, f.target.result);
    };

    var start = file.slice(0, 65536);
    var end = file.slice(file.size - 65536, file.size);

    fileManager1.readAsBinaryString(start);
    fileManager2.readAsBinaryString(end);
  };

  thisObj.calculateHashOfFile(file);
  callback = callbackFunction;

};

onmessage = function( e ) {
    var file = e.data;
    hashMe( file, function( ret ) {
        postMessage( ret );
    });
}