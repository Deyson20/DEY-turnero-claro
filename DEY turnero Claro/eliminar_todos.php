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

// Eliminar todos los registros de la tabla 'persona'
$sql = "DELETE FROM persona";
if ($conn->query($sql) === TRUE) {
    echo "Todos los registros eliminados con éxito!";
} else {
    echo "Error al eliminar registros: " . $conn->error;
}

// Cerrar conexión
$conn->close();
?>
