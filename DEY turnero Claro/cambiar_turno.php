<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST["accion"])) {
        if ($_POST["accion"] == "siguiente") {
            $_SESSION["turno_actual"]++;
        } elseif ($_POST["accion"] == "anterior" && $_SESSION["turno_actual"] > 0) {
            $_SESSION["turno_actual"]--;
        }
    }
    echo json_encode(["success" => true]);
}
?>
