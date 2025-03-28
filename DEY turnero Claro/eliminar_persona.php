<?php
$servername = "sql309.infinityfree.com"; // MySQL Hostname
$username = "if0_38582766"; // MySQL Username
$password = "BTVxj0Gwgtq2qB"; // MySQL Password
$database = "if0_38582766_deprueba"; // MySQL Database Name

// Crear conexión
$conn = new mysqli($servername, $username, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Verificar si la solicitud es POST y tiene un ID válido
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["id"])) {
    $id = intval($_POST["id"]); // Sanitizar el ID

    

    // Verificar si el ID existe en la base de datos
    $check = $conn->prepare("SELECT id FROM persona WHERE id = ?");
    $check->bind_param("i", $id);
    $check->execute();
    $result = $check->get_result();

    if ($result->num_rows === 0) {
        die("Error: No se encontró el ID en la base de datos.");
    }

    // Si el ID existe, proceder a eliminar
    $stmt = $conn->prepare("DELETE FROM persona WHERE id = ?");
    if ($stmt === false) {
        die("Error en la preparación de la consulta: " . $conn->error);
    }

    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo "Persona eliminada con éxito!";
    } else {
        echo "Error al eliminar persona: " . $stmt->error;
    }

    // Cerrar recursos
    $stmt->close();
    $check->close();
} else {
    echo "Error: ID no recibido.";
}

// Cerrar conexión
$conn->close();
?>
