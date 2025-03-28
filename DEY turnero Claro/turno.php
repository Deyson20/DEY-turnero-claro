<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Turno Actual</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #e0f7fa, #bbdefb);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .container {
            text-align: center;
        }

        .turno-box {
           display: inline-block;
         padding: 40px 30px;
         background: #fff;
          border-radius: 20px;
          box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.5s ease;
          width: 750px; /* Ancho aumentado */
          position: relative;
        }


        .logo {
            width: 130px;
            margin-bottom: 15px;
        }

        .turno-title {
            font-size: 30px;
            font-weight: bold;
            color: #333;
            margin: 15px 0;
        }

        .turno-nombre {
            font-size: 36px;
            font-weight: bold;
            color: #d32f2f;
            margin: 15px 0;
            white-space: nowrap;  /* Evita el salto de línea */
            overflow: hidden;     /* Esconde el texto sobrante */
            text-overflow: ellipsis;  /* Agrega "..." si el texto es demasiado largo */
        }

        }

        .turno-puesto {
            font-size: 36px !important;
            font-weight: bold;
            color: #555;
            margin-bottom: 20px;
        }

        #turno-puesto {
            font-size: 25px; /* Ajusta el tamaño a tu preferencia */
            color: #555;
            margin-bottom: 20px;
        }


        .btn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 5px 10px;
            margin: 8px;
            font-size: 18px;
            cursor: pointer;
            border-radius: 15px;
            transition: background-color 0.3s ease, transform 0.2s ease;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
        }

        .btn:hover {
            background-color: #218838;
            transform: translateY(-2px);
        }

        .btn:disabled {
            background-color: #ccc;
            color: #777;
            cursor: not-allowed;
            transform: none;
        }

        .btn:disabled:hover {
            background-color: #ccc;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Caja de Turno -->
        <div class="turno-box">
            <!-- Logo Claro Centrando Dentro de la Caja -->
            <img src="Logo-claro/logo-claro.png" alt="Logo Claro" class="logo">
            <div class="turno-title">TURNO ACTUAL</div>
            <div id="turno-nombre" class="turno-nombre">Cargando...</div>
            <div id="turno-puesto" class="turno-puesto"></div>
            <button id="btn-anterior" class="btn">⬅ Anterior</button>
            <button id="btn-siguiente" class="btn">Siguiente ➡</button>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        function actualizarTurno() {
            $.get("turno_data.php", function(data) {
                $("#turno-nombre").text(data.nombre);
                $("#turno-puesto").text(data.puesto);

                // Deshabilitar botones en límites
                $("#btn-anterior").prop("disabled", data.turno_actual == 0);
                $("#btn-siguiente").prop("disabled", data.turno_actual >= data.total_personas - 1);
            }, "json");
        }

        $("#btn-anterior").click(function() {
            $.post("cambiar_turno.php", { accion: "anterior" }, function() {
                actualizarTurno();
            });
        });

        $("#btn-siguiente").click(function() {
            $.post("cambiar_turno.php", { accion: "siguiente" }, function() {
                actualizarTurno();
            });
        });

        // Actualizar el turno automáticamente cada 2 segundos
        setInterval(actualizarTurno, 2000);
    </script>
</body>
</html>
