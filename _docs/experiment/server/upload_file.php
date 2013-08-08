<?php
@header("Content-Type:application/json");

var_dump($HTTP_RAW_POST_DATA);

$result = array();

if (empty($_FILES) || $_FILES["file"]["error"] > 0) {
	$result = array(
		"err" => 1
	);
 	// echo "Error: " . $_FILES["file"]["error"] . "<br />";
}
else {
	$result = array(
		"name" => $_FILES["file"]["name"],
		"type" => $_FILES["file"]["type"],
		"size" => ($_FILES["file"]["size"] / 1024) ."KB",
		"err" => 0
	);
	//echo "Upload: " . $_FILES["file"]["name"] . "<br />";
	//echo "Type: " . $_FILES["file"]["type"] . "<br />";
	//echo "Size: " . ($_FILES["file"]["size"] / 1024) . " Kb<br />";
	//echo "Stored in: " . $_FILES["file"]["tmp_name"];
}

echo json_encode($result);