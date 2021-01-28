<?php
/**
 * 此页面用来协助 IE6/7 预览图片，因为 IE 6/7 不支持 base64
 */

#!! 注意
#!! 此文件只是个示例，不要用于真正的产品之中。
#!! 不保证代码安全性。
#!! IMPORTANT:
#!! this file is just an example, it doesn't incorporate any security checks and
#!! is not recommended to be used in production environment as it is. Be sure to
#!! revise it and customize to your needs.

$DIR = 'preview';
// Create target dir
if (!file_exists($DIR)) {
    @mkdir($DIR);
}

$cleanupTargetDir = true; // Remove old files
$maxFileAge = 5 * 3600; // Temp file age in seconds

if ($cleanupTargetDir) {
    if (!is_dir($DIR) || !$dir = opendir($DIR)) {
        die('{"jsonrpc" : "2.0", "error" : {"code": 100, "message": "Failed to open temp directory."}, "id" : "id"}');
    }

    while (($file = readdir($dir)) !== false) {
        $tmpfilePath = $DIR . DIRECTORY_SEPARATOR . $file;

        // Remove temp file if it is older than the max age and is not the current file
        if (@filemtime($tmpfilePath) < time() - $maxFileAge) {
            @unlink($tmpfilePath);
        }
    }
    closedir($dir);
}

$src = file_get_contents('php://input');

if (preg_match("#^data:image/(\w+);base64,(.*)$#", $src, $matches)) {

    $previewUrl = sprintf(
        "%s://%s%s",
        isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' ? 'https' : 'http',
        $_SERVER['HTTP_HOST'],
        $_SERVER['REQUEST_URI']
    );
    $previewUrl = str_replace("preview.php", "", $previewUrl);


    $base64 = $matches[2];
    $type = $matches[1];
    if ($type === 'jpeg') {
        $type = 'jpg';
    }

    if (!in_array($type, array("jpg", "png", "gif", "bmp"))) {
        die('{"jsonrpc" : "2.0", "error" : {"code": 200, "message": "un recoginized image source"}, "id" : "id"}');
    }

    $filename = md5($base64).".$type";
    $filePath = $DIR.DIRECTORY_SEPARATOR.$filename;

    if (file_exists($filePath)) {
        die('{"jsonrpc" : "2.0", "result" : "'.$previewUrl.'preview/'.$filename.'", "id" : "id"}');
    } else {
        $data = base64_decode($base64);
        file_put_contents($filePath, $data);
        die('{"jsonrpc" : "2.0", "result" : "'.$previewUrl.'preview/'.$filename.'", "id" : "id"}');
    }

} else {
    die('{"jsonrpc" : "2.0", "error" : {"code": 100, "message": "un recoginized source"}}');
}
