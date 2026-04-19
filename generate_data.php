<?php
$zones = ["Georgetown", "New Amsterdam", "Linden", "Anna Regina", "Rose Hall", "Bartica", "Mahdia"];
$categories = ["Hire Car", "Motor Bus", "Private", "Lorry", "Trailer"];
$makes = ["Toyota", "Honda", "Nissan", "Suzuki", "Mercedes", "Isuzu"];
$models = [
    "Toyota" => ["Premio", "Allion", "Vitz", "Hiace", "Hilux"],
    "Honda" => ["Civic", "Fit", "Accord", "CR-V"],
    "Nissan" => ["Sunny", "X-Trail", "Bluebird", "Tiida"],
    "Suzuki" => ["Swift", "Vitara", "Jimny"],
    "Mercedes" => ["E-Class", "S-Class", "Sprinter"],
    "Isuzu" => ["Forward", "Elf", "D-Max"]
];

$data = [
    "users" => [
        ["id" => 1, "username" => "admin", "password" => "123", "role" => "Admin", "full_name" => "Chief Administrator", "email" => "admin@vms.gov.gy"],
        ["id" => 2, "username" => "officer1", "password" => "123", "role" => "Licensing Officer", "full_name" => "Sgt. David Persaud", "email" => "persaud@vms.gov.gy"],
        ["id" => 3, "username" => "officer2", "password" => "123", "role" => "Licensing Officer", "full_name" => "Cpl. Sarah Lynch", "email" => "lynch@vms.gov.gy"],
        ["id" => 4, "username" => "owner1", "password" => "123", "role" => "Vehicle Owner", "full_name" => "Kishore Singh", "email" => "ksingh@gmail.com"],
        ["id" => 5, "username" => "owner2", "password" => "123", "role" => "Vehicle Owner", "full_name" => "Ramnarine Singh", "email" => "ramnarine@gmail.com"],
        ["id" => 6, "username" => "owner3", "password" => "123", "role" => "Vehicle Owner", "full_name" => "Mohamed Ali", "email" => "ali786@gmail.com"],
        ["id" => 7, "username" => "owner4", "password" => "123", "role" => "Vehicle Owner", "full_name" => "Anita Deolall", "email" => "adeolall@yahoo.com"],
        ["id" => 8, "username" => "owner5", "password" => "123", "role" => "Vehicle Owner", "full_name" => "Leroy Thompson", "email" => "leroy.t@outlook.com"]
    ],
    "zones" => $zones,
    "vehicles" => [],
    "licenses" => [],
    "offences" => [],
    "fitness" => []
];

// Generate Vehicles
for ($i = 0; $i < 20; $i++) {
    $make = $makes[array_rand($makes)];
    $model = $models[$make][array_rand($models[$make])];
    $cat = $categories[array_rand($categories)];
    $prefix = ($cat === "Hire Car") ? "HB" : (($cat === "Motor Bus") ? "B" : "P");
    $reg = $prefix . " " . rand(1000, 9999);
    $ownerIdx = rand(4, 8);
    $ownerId = "owner" . ($ownerIdx - 3);
    
    $v = [
        "id" => 100 + $i,
        "owner_id" => $ownerId,
        "reg_number" => $reg,
        "category" => $cat,
        "make" => $make,
        "model" => $model,
        "year" => rand(2010, 2024),
        "business_license_no" => ($cat === "Hire Car" || $cat === "Motor Bus") ? "TX-" . rand(2024, 2025) . "-" . str_pad($i, 3, "0", STR_PAD_LEFT) : "",
        "reg_date" => date('Y-m-d', strtotime('-' . rand(1, 1000) . ' days'))
    ];
    $data['vehicles'][] = $v;
    
    // Random fitness
    if (rand(0, 1)) {
        $data['fitness'][] = [
            "id" => 500 + $i,
            "reg" => $reg,
            "result" => "Pass",
            "comments" => "Verified brakes, tires, and lights.",
            "issue" => date('Y-m-d', strtotime('-' . rand(1, 180) . ' days')),
            "expiry" => date('Y-m-d', strtotime('+' . rand(1, 365) . ' days'))
        ];
    }
}

// Generate Licenses
foreach ($data['users'] as $u) {
    if ($u['role'] === "Vehicle Owner") {
        $data['licenses'][] = [
            "id" => 200 + $u['id'],
            "user_id" => $u['username'],
            "license_no" => "DL-GUY-" . rand(10000, 99999),
            "type" => "Driver",
            "issue_date" => "2023-01-01",
            "expiry_date" => "2026-01-01",
            "status" => "Active",
            "zone" => ""
        ];
    }
}

// Generate Offences
$sections = ["Section 35", "Section 102", "Section 44", "Section 15"];
$descs = ["Speeding on Highway", "Invalid Business License", "Failure to Stop", "Driving under Influence"];
for ($i = 0; $i < 10; $i++) {
    $v = $data['vehicles'][array_rand($data['vehicles'])];
    $data['offences'][] = [
        "id" => 300 + $i,
        "reg" => $v['reg_number'],
        "section" => $sections[array_rand($sections)],
        "desc" => $descs[array_rand($descs)],
        "fine" => rand(5000, 50000),
        "date" => date('Y-m-d, h:i A', strtotime('-' . rand(1, 100) . ' days')),
        "status" => rand(0, 1) ? "Paid" : "Pending"
    ];
}

file_put_contents('data.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Successfully generated full dataset in data.json\n";
?>
