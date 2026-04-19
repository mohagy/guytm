<?php
/**
 * Guyana VMS - Backend API
 * Handles data persistence for data.json
 */

header('Content-Type: application/json');

$jsonFile = 'data.json';

// Get current data
function getData($file) {
    if (!file_exists($file)) return ['users' => [], 'vehicles' => [], 'licenses' => [], 'offences' => [], 'fitness' => [], 'zones' => []];
    return json_decode(file_get_contents($file), true);
}

// Save data
function saveData($file, $data) {
    // Ensure all collections are indexed arrays for JSON
    $data['users'] = array_values($data['users']);
    $data['vehicles'] = array_values($data['vehicles']);
    $data['licenses'] = array_values($data['licenses']);
    $data['offences'] = array_values($data['offences']);
    $data['fitness'] = array_values($data['fitness']);
    
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Handle request
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo file_get_contents($jsonFile);
    exit;
}

if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');
    error_log("VMS API: Raw Body: " . $rawBody);
    
    $json = json_decode($rawBody, true);
    $input = is_array($json) ? $json : $_POST;

    if (!isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing action', 'received' => $input]);
        exit;
    }

    $action = $input['action'];
    $data = getData($jsonFile);
    $success = false;
    $message = '';

    switch ($action) {
        case 'add_vehicle':
            $newVehicle = $input['data'];
            $newVehicle['id'] = time();
            $data['vehicles'][] = $newVehicle;
            $success = true;
            break;

        case 'delete_vehicle':
            $reg = $input['reg'];
            $data['vehicles'] = array_filter($data['vehicles'], function($v) use ($reg) {
                return $v['reg_number'] !== $reg;
            });
            $data['vehicles'] = array_values($data['vehicles']); // Re-index
            $success = true;
            break;

        case 'edit_vehicle':
            $editedVehicle = $input['data'];
            foreach ($data['vehicles'] as &$v) {
                if ($v['reg_number'] === $editedVehicle['reg_number']) {
                    $v = array_merge($v, $editedVehicle);
                    $success = true;
                    break;
                }
            }
            break;


        case 'add_license':
            $newLicense = $input['data'];
            $newLicense['id'] = time();
            $data['licenses'][] = $newLicense;
            $success = true;
            break;

        case 'delete_license':
            $id = (int)$input['id'];
            $data['licenses'] = array_filter($data['licenses'], function($l) use ($id) {
                return $l['id'] !== $id;
            });
            $data['licenses'] = array_values($data['licenses']);
            $success = true;
            break;

        case 'edit_license':
            $edited = $input['data'];
            foreach ($data['licenses'] as &$l) {
                if ($l['id'] == $edited['id']) {
                    $l = array_merge($l, $edited);
                    $success = true;
                    break;
                }
            }
            break;

        case 'add_offence':
            $newOffence = $input['data'];
            $newOffence['id'] = time();
            $data['offences'][] = $newOffence;
            $success = true;
            break;

        case 'delete_offence':
            $id = (int)$input['id'];
            $data['offences'] = array_filter($data['offences'], function($o) use ($id) {
                return $o['id'] !== $id;
            });
            $data['offences'] = array_values($data['offences']);
            $success = true;
            break;

        case 'edit_offence':
            $edited = $input['data'];
            foreach ($data['offences'] as &$o) {
                if ($o['id'] == $edited['id']) {
                    $o = array_merge($o, $edited);
                    $success = true;
                    break;
                }
            }
            break;

        case 'add_fitness':
            $newFit = $input['data'];
            $newFit['id'] = time();
            $data['fitness'][] = $newFit;
            $success = true;
            break;

        case 'delete_fitness':
            $id = (int)$input['id'];
            $data['fitness'] = array_filter($data['fitness'], function($f) use ($id) {
                return $f['id'] !== $id;
            });
            $data['fitness'] = array_values($data['fitness']);
            $success = true;
            break;

        case 'edit_fitness':
            $edited = $input['data'];
            foreach ($data['fitness'] as &$f) {
                if ($f['id'] == $edited['id']) {
                    $f = array_merge($f, $edited);
                    $success = true;
                    break;
                }
            }
            break;

        case 'add_user':
            $newUser = $input['data'];
            $newUser['id'] = time();
            $data['users'][] = $newUser;
            $success = true;
            break;

        case 'delete_user':
            $id = (int)$input['id'];
            $data['users'] = array_filter($data['users'], function($u) use ($id) {
                return $u['id'] !== $id;
            });
            $data['users'] = array_values($data['users']);
            $success = true;
            break;

        default:
            $message = 'Unknown action: ' . $action;
    }

    if ($success) {
        saveData($jsonFile, $data);
        echo json_encode(['success' => true, 'action' => $action]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $message]);
    }
    exit;
}
