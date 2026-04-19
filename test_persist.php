<?php
$jsonFile = 'data.json';
$data = json_decode(file_get_contents($jsonFile), true);
if (!$data) {
    echo "ERROR: Could not read data.json";
} else {
    echo "SUCCESS: Read data.json. Vehicle count: " . count($data['vehicles']);
    $data['vehicles'] = array_filter($data['vehicles'], function($v) {
        return $v['reg_number'] !== 'HB 1234';
    });
    file_put_contents('data.json', json_encode($data, JSON_PRETTY_PRINT));
    echo " | SUCCESS: Deleted HB 1234 and saved.";
}
?>
