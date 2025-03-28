<?php
session_start();
header('Content-Type: application/json');

// Datos de conexión
$servername = "sql309.infinityfree.com"; // MySQL Hostname
$username = "if0_38582766"; // MySQL Username
$password = "BTVxj0Gwgtq2qB"; // MySQL Password
$database = "if0_38582766_personas"; // MySQL Database Name

$conn = new mysqli($servername, $username, $password, $database);
if ($conn->connect_error) {
    echo json_encode(["error" => "Conexión fallida"]);
    exit();
}

// Obtener personas
$sql = "SELECT * FROM persona ORDER BY id ASC";
$result = $conn->query($sql);
$personas = $result->fetch_all(MYSQLI_ASSOC);
$total_personas = count($personas);

// Validar turno
if (!isset($_SESSION["turno_actual"]) || $_SESSION["turno_actual"] >= $total_personas) {
    $_SESSION["turno_actual"] = 0;
}

$persona_actual = $total_personas > 0 ? $personas[$_SESSION["turno_actual"]] : null;

$conn->close();

// Responder con JSON
echo json_encode([
    "nombre" => $persona_actual ? strtoupper($persona_actual["nombre"]) : "NO HAY TURNOS",
    "puesto" => $persona_actual ? strtoupper($persona_actual["puesto"]) : "",
    "turno_actual" => $_SESSION["turno_actual"],
    "total_personas" => $total_personas
]);
?>
