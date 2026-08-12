# CRM · Venta de Cursos (Demo)

Prototipo funcional de un CRM para un negocio de venta de cursos online: login de administrador, catálogo de cursos, registro de alumnos con simulación de pago (tipo Stripe) y tablero de ventas (Kanban).

## Cómo probarlo

No necesita instalación. Dos opciones:

1. **Local:** descarga `index.html` y ábrelo directamente con doble clic en tu navegador.
2. **En línea (GitHub Pages):**
   - Ve a **Settings → Pages** en este repositorio.
   - En "Source" selecciona la rama `main` y la carpeta `/ (root)`.
   - Guarda; en un par de minutos tendrás una URL pública (algo como `https://tu-usuario.github.io/tu-repo/`).

## Acceso a la demo

```
Correo:      admin@escuela.com
Contraseña:  admin123
```

## Qué incluye

- **Login de administrador** con validación.
- **Catálogo de cursos**: crear y eliminar cursos con precio.
- **Alumnos**: registrar un alumno nuevo, que dispara un modal de pago simulado (número de tarjeta, nombre, vencimiento, CVC) antes de activarlo.
- **Pipeline de ventas (Kanban)**: columnas Interesado → En Contacto → Compró Curso.
- **Panel de métricas**: total facturado, alumnos activos, tasa de conversión.
- Los datos se guardan en el `localStorage` de tu navegador, así que persisten si recargas la página (pero son locales a ese navegador/dispositivo — no se comparten entre visitantes).

## Limitaciones (es una demo)

- El login valida credenciales fijas en el propio código; no es un sistema de autenticación real.
- El pago es 100% simulado — no se conecta a ninguna cuenta de Stripe real ni cobra dinero.
- No hay backend ni base de datos compartida: cada navegador ve solo sus propios datos.

## Siguiente paso para producción

Conectar esto a un backend real con: base de datos (ej. PostgreSQL), autenticación de verdad (ej. NextAuth/JWT), Stripe Checkout + webhooks, y un servicio de email transaccional (ej. Resend/SendGrid).
