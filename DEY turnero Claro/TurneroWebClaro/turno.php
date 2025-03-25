<?php
session_start();

// Datos de conexión a la base de datos
$servername = "sql309.infinityfree.com"; // MySQL Hostname
$username = "if0_38582766"; // MySQL Username
$password = "BTVxj0Gwgtq2qB"; // MySQL Password
$database = "if0_38582766_personas"; // MySQL Database Name

// Crear conexión
$conn = new mysqli($servername, $username, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Obtener todas las personas en orden
$sql = "SELECT * FROM persona ORDER BY id ASC";
$result = $conn->query($sql);
$personas = $result->fetch_all(MYSQLI_ASSOC);
$total_personas = count($personas);

// Inicializar el turno actual si no está definido
if (!isset($_SESSION["turno_actual"]) || $_SESSION["turno_actual"] >= $total_personas) {
    $_SESSION["turno_actual"] = 0; 
}

// Manejo de cambio de turno
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST["siguiente"]) && $_SESSION["turno_actual"] < $total_personas - 1) {
        $_SESSION["turno_actual"]++;
    } elseif (isset($_POST["anterior"]) && $_SESSION["turno_actual"] > 0) {
        $_SESSION["turno_actual"]--;
    }
}

// Obtener la persona actual de forma segura
$persona_actual = $total_personas > 0 ? $personas[$_SESSION["turno_actual"]] : null;

$conn->close();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turno Actual</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .container {
            text-align: center;
            margin-top: 50px;
        }
        .turno-box {
            display: inline-block;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
            font-family: Arial, sans-serif;
            width: 400px;
        }
        .logo {
            width: 150px;
            margin-bottom: 15px;
        }
        .turno-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .turno-nombre {
            font-size: 36px;
            font-weight: bold;
            color: #333;
        }
        .turno-puesto {
            font-size: 22px;
            color: #666;
            margin-top: 10px;
        }
        .buttons {
            margin-top: 20px;
        }
        .btn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 12px 25px;
            margin: 5px;
            font-size: 18px;
            cursor: pointer;
            border-radius: 5px;
        }
        .btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="turno-box">
            <img src="Logo-claro/logo-claro.png" alt="Logo Claro" class="logo">

            <div class="turno-title">TURNO ACTUAL</div>

            <?php if ($persona_actual): ?>
                <div class="turno-nombre"><?php echo strtoupper(htmlspecialchars($persona_actual["nombre"])); ?></div>
                <div class="turno-puesto"><?php echo strtoupper(htmlspecialchars($persona_actual["puesto"])); ?></div>
            <?php else: ?>
                <div class="turno-nombre">NO HAY TURNOS</div>
            <?php endif; ?>

            <form action="" method="post" class="buttons">
                <button type="submit" name="anterior" class="btn" <?php echo $_SESSION["turno_actual"] == 0 ? 'disabled' : ''; ?>>⬅ Anterior</button>
                <button type="submit" name="siguiente" class="btn" <?php echo $_SESSION["turno_actual"] >= $total_personas - 1 ? 'disabled' : ''; ?>>Siguiente ➡</button>
            </form>
        </div>
    </div>

</body>
</html>
