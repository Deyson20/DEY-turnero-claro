<?php
// Datos de conexión
$servername = "sql309.infinityfree.com";
$username = "if0_38582766";
$password = "BTVxj0Gwgtq2qB";
$database = "if0_38582766_deprueba";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Obtener el turno actual
$sql = "SELECT turno_id FROM turno_actual WHERE id = 1";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
$turno_actual = (int)$row["turno_id"];

// Obtener la persona correspondiente
$sql = "SELECT * FROM persona ORDER BY id ASC LIMIT 1 OFFSET $turno_actual";
$result = $conn->query($sql);
$persona = $result->fetch_assoc();

if ($persona) {
    echo json_encode($persona);
} else {
    echo json_encode(["nombre" => "NO HAY TURNOS", "puesto" => ""]);
}

$conn->close();
?>
