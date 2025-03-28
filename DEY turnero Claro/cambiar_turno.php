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

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $accion = $_POST["accion"];

    // Obtener el turno actual
    $sql = "SELECT turno_id FROM turno_actual WHERE id = 1";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    $turno_actual = (int)$row["turno_id"];

    // Obtener el número total de personas
    $sql = "SELECT COUNT(*) AS total FROM persona";
    $result = $conn->query($sql);
    $total_personas = $result->fetch_assoc()["total"];

    // Actualizar el turno según la acción
    if ($accion == "anterior" && $turno_actual > 0) {
        $turno_actual--;
    } elseif ($accion == "siguiente" && $turno_actual < $total_personas - 1) {
        $turno_actual++;
    }

    // Actualizar el turno en la base de datos
    $sql = "UPDATE turno_actual SET turno_id = $turno_actual WHERE id = 1";
    $conn->query($sql);

    echo json_encode(["success" => true]);
}

$conn->close();
?>
