<?php
session_start();

// Datos de conexión a la base de datos
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

// Protección con token de sesión
if (!isset($_SESSION["token"])) {
    $_SESSION["token"] = bin2hex(random_bytes(32)); // Token más seguro
}

// Procesar formulario de agregar persona
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["agregar"])) {
    if (!isset($_POST["token"]) || $_POST["token"] !== $_SESSION["token"]) {
        die("Error de seguridad: Token inválido.");
    }

    $nombre = trim($_POST["nombre"]);
    $puesto = trim($_POST["puesto"]);

    if (!empty($nombre) && !empty($puesto)) {
        $stmt = $conn->prepare("INSERT INTO persona (nombre, puesto) VALUES (?, ?)");
        $stmt->bind_param("ss", $nombre, $puesto);

        if ($stmt->execute()) {
            header("Location: index.php?msg=success");
            exit();
        } else {
            header("Location: index.php?msg=error");
            exit();
        }
    }
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Personas</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <img src="Logo-claro/logo-claro.png" alt="Logo" class="logo">

    <form action="" method="post">
        <input type="hidden" name="token" value="<?php echo $_SESSION["token"]; ?>">
        <label for="nombre">Nombre:</label>
        <input type="text" id="nombre" name="nombre" required>
        
        <label for="puesto">Puesto:</label>
        <input type="text" id="puesto" name="puesto" required>
        
        <input type="submit" name="agregar" value="Agregar">
    </form>

    <h2>Personas agregadas:</h2>

    <button class="pequeno" onclick="eliminarTodos()">Eliminar todos</button>
    <button class="pequeno" onclick="window.location.href='turno.php'">Ver Turno</button>

    <ul>
        <?php
        $sql = "SELECT * FROM persona ORDER BY id ASC";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                echo "<li>" . htmlspecialchars($row["nombre"]) . " - " . htmlspecialchars($row["puesto"]) . " 
                <button class='pequeno' onclick='eliminarPersona(" . $row["id"] . ")'>Eliminar</button></li>";
            }
        } else {
            echo "<li>No hay personas agregadas.</li>";
        }
        ?>
    </ul>

    <?php $conn->close(); ?>

    <script>
    function eliminarPersona(id) {
        if (confirm("¿Estás seguro de que deseas eliminar a esta persona?")) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "eliminar_persona.php", true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send("id=" + id);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    alert(xhr.responseText);
                    location.reload();
                } else {
                    alert("Error al eliminar persona");
                }
            };
        }
    }

    function eliminarTodos() {
        if (confirm("¿Estás seguro de que deseas eliminar todos los registros?")) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "eliminar_todos.php", true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send();
            xhr.onload = function() {
                if (xhr.status === 200) {
                    alert(xhr.responseText);
                    location.reload();
                } else {
                    alert("Error al eliminar registros");
                }
            };
        }
    }
    </script>

</body>
</html>
