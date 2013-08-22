var exportName = 'WebUploader',
    _WU = window[ exportName ],
    WU = {
        version: '@version'
    };

WU.noConflict = function() {
    window[ exportName ] = _WU;
}