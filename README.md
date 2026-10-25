# Turnero Claro en Cloudflare

La aplicación usa Cloudflare Workers para la API y D1 (SQLite) para guardar las personas y el turno compartido. La administración se protege con usuario y contraseña; las sesiones se firman en cookies `HttpOnly`.

## Preparar el proyecto

1. Instala Node.js y crea una base D1 desde esta carpeta:

   ```powershell
   npx wrangler d1 create turnero-claro
   ```

2. Copia el `database_id` que devuelve el comando y reemplaza `REEMPLAZAR_CON_EL_ID_DE_D1` en `wrangler.toml`.
3. Aplica el esquema a D1 local y remoto:

   ```powershell
   npx wrangler d1 migrations apply turnero-claro --local
   npx wrangler d1 migrations apply turnero-claro --remote
   ```

4. Copia `.dev.vars.example` como `.dev.vars` y configura en ese archivo el secreto de sesión y las credenciales administrativas para desarrollo:

   ```powershell
   Copy-Item .dev.vars.example .dev.vars
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Pega el valor generado después de `SESSION_SECRET=` y reemplaza `ADMIN_USERNAME` y `ADMIN_PASSWORD`. Usa una contraseña de al menos 12 caracteres. `.dev.vars` está excluido de Git; nunca subas las credenciales al repositorio.

5. Inicia localmente:

   ```powershell
   npx wrangler dev
   ```

## Publicar

Configura las credenciales administrativas y el secreto de firma seguro para producción, y despliega:

```powershell
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

Wrangler solicitará el valor de cada secreto. Usa un usuario propio y una contraseña única de al menos 12 caracteres. No guardes las credenciales en `wrangler.toml`, en el código ni en el repositorio; el Worker no permitirá iniciar sesión si faltan.

La gestión de personas (`/`) y la administración de turnos (`/turno.html`) requieren iniciar sesión. La pantalla `/smartv.html` permanece pública y solo recibe los datos del turno actual. La sesión administrativa caduca después de ocho horas.

## Instalar como aplicación

La aplicación incluye un manifiesto y el logo de Claro como icono del navegador y de instalación. En un navegador compatible, usa la opción **Instalar aplicación** o **Añadir a pantalla de inicio** para crear un acceso directo con el icono.

## Pantalla para Smart TV

Abre `/smartv.html` en el navegador de la televisión. La pantalla pública muestra el turno actual y se actualiza automáticamente cada tres segundos. El turno que aparece allí es compartido con la página `/turno.html` desde D1.

Al actualizar un despliegue existente, aplica también la nueva migración:

```powershell
npx wrangler d1 migrations apply turnero-claro --local
npx wrangler d1 migrations apply turnero-claro --remote
```

## Pasar las personas existentes de MySQL a D1

La base MySQL anterior no se copia automáticamente. Exporta desde phpMyAdmin la tabla `persona` como CSV, incluyendo los encabezados `id`, `nombre` y `puesto`. Convierte el CSV al formato compatible con D1:

```powershell
node scripts/csv-to-sql.js .\personas.csv .\personas.sql
npx wrangler d1 execute turnero-claro --remote --file=.\personas.sql
```

No incluyas credenciales MySQL en el archivo exportado ni en el proyecto. Después de verificar que los datos están en D1, cambia la contraseña de la base MySQL antigua.
