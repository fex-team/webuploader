<?php
@header("Content-Type:application/json");

$result = array();

// var_dump($_FILES);

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

	$filename = "";

	if ($_POST['zipped']) {
		$filename = 'files'.time().'.zip';
	}
	else{
		$filename = $result[ "name" ];
	}
	move_uploaded_file($_FILES["file"]["tmp_name"],
      "files/" . $filename);
	// echo "Upload: " . $_FILES["file"]["name"] . "<br />";
	// echo "Type: " . $_FILES["file"]["type"] . "<br />";
	// echo "Size: " . ($_FILES["file"]["size"] / 1024) . " Kb<br />";
	// echo "Stored in: " . $_FILES["file"]["tmp_name"];
}

echo json_encode($result);