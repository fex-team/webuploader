<?php

// { "status":{"code": "0","msg": "ok" }, "data": {"thumbnail":["http:\/\/priv.hiphotos.baidu.com\/album\/s%3D200\/sign=9879a0fdc9fcc3ceb0c0ce33a244d6b7\/79f0f736afc37931d53caaf6eac4b74542a9119c.jpg?psign=768593fc622762d065d95ea8a0c5c79b513d26975beee61a"],"sign":"54fbe5e08f1747df38baaafd6a19604400c22270"}}

@header("Content-Type:application/json");

$data = array();
$status = array();

if (empty($_FILES) || $_FILES["file"]["error"] > 0) {
    $status = array(
        "code" => $_FILES["file"]["error"],
        "msg" => '文件上传错误'
        );
    // echo "Error: " . $_FILES["file"]["error"] . "<br />";
}
else {
    $status = array(
        "code" => 0,
        "msg" => 'ok'
    );

    $data = array(
        "name" => $_FILES["file"]["name"],
        "type" => $_FILES["file"]["type"],
        "size" => ($_FILES["file"]["size"] / 1024) ."KB"
    );
}

echo json_encode(array(
        'status' => $status,
        'data' => $data
    ));