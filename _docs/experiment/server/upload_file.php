<?php
@header("Content-Type:application/json");

$result = array();

if (empty($_FILES) || $_FILES["file"]["error"] > 0) {
	$result = array(
		"err" => 1
	);
}
else {
	$result = array(
		"name" => $_FILES["file"]["name"],
		"type" => $_FILES["file"]["type"],
		"size" => ($_FILES["file"]["size"] / 1024) ."KB",
		"time" => getdate(),
		"err" => 0
	);

	$filename = "";

	if ($_POST['zipped']) {
		$filename = 'files'.time().'.zip';
	}
	else{
		$filename = $result[ "name" ];
	}
	move_uploaded_file($_FILES["file"]["tmp_name"],
      "files/" . $filename);
}

echo json_encode($result);