# AWS Setup — ITIA Learning

Nada de esto se ejecuta automáticamente: es la guía para que David (o quien lo
acompañe) cree los recursos reales en la cuenta de AWS cuando decida
desplegar. Ninguno de estos pasos se hizo durante el desarrollo de este
repositorio.

**Estado actual del deploy en Amplify:** el build compila y el sitio se ve
(landing, `/planes`, etc.) aunque ninguna variable de Cognito/S3/SES/Stripe
esté configurada todavía — `amplify.yml` solo avisa si faltan, no falla el
build. Pero **login, signup y todo lo que dependa de una sesión (`/dashboard`,
`/learn`, `/admin`, checkout de Stripe) no funcionará** hasta que sigas los
pasos de este documento y agregues esas variables en Amplify → App settings →
Environment variables.

## 1. Base del proyecto

1. Usa Node.js 22 y npm.
2. Configura `.env` desde `.env.example`.
3. Ejecuta `npm install`, `npx prisma generate`, `npm run lint` y `npm run build`.
4. Trabaja con `QA` como staging y `main` como producción.

## 2. RDS PostgreSQL

1. Crea una instancia PostgreSQL en `us-east-1` (o la región que prefieras).
2. Activa backups automáticos y PITR.
3. Exige SSL y guarda credenciales en Secrets Manager o Parameter Store.
4. Ejecuta `npx prisma migrate deploy` para aplicar `prisma/schema.prisma`.

## 3. Cognito

1. Crea un User Pool con email como identificador, verificación de correo activa.
2. Crea dos grupos: `Admin` y `Teacher` (coinciden con `COGNITO_ADMIN_GROUP` /
   `COGNITO_TEACHER_GROUP` en `.env`). Cualquier usuario sin grupo es `USER`.
3. Configura Hosted/Managed Login.
4. Callback: `${APP_BASE_URL}/api/auth/callback`. Logout: `${APP_BASE_URL}/login`.

```env
COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
COGNITO_DOMAIN=
COGNITO_REDIRECT_URI=
COGNITO_LOGOUT_REDIRECT_URI=
COGNITO_ADMIN_GROUP=Admin
COGNITO_TEACHER_GROUP=Teacher
```

Los maestros (`role = TEACHER`) los crea el Admin directamente (no se
auto-registran): crea el usuario en Cognito, agrégalo al grupo `Teacher`, y
desde el panel Admin crea su `TeacherProfile` con horario disponible.

## 4. S3 — contenido exclusivo de la plataforma

El video/audio/curso **no se puede descargar** fuera de la plataforma: todo
se sirve con URLs firmadas de vida corta (15 min lectura, 5 min subida), nunca
como archivo público permanente.

1. Crea un bucket privado, bloquea acceso público, activa cifrado SSE-S3/KMS.
2. Prefijos usados por `lib/s3.js`: `users/{userId}/{scope}/...` para lo que
   sube un usuario (foto de maestro, contenido de comunidad) y
   `content/{scope}/...` para lo que sube el Admin (audio de vocabulario,
   video de cine, subtítulos).
3. CORS para permitir subida directa desde la web:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedOrigins": ["https://www.itia-learning.com", "http://localhost:3000"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
4. Para el módulo de Cine (fase futura), considera CloudFront + firmas de
   cookie/URL en lugar de URLs firmadas S3 directas, para streaming con seek.

## 5. SES

1. Verifica dominio, configura SPF/DKIM/DMARC, sal del sandbox.
2. Configura `SES_FROM_EMAIL`/`SES_REPLY_TO_EMAIL` para bienvenida, recordatorios
   de fin de trial, y confirmaciones de cita con maestro.

## 6. Stripe

1. Crea dos productos recurrentes: **Plan Basic** ($9.00 USD/mes) y
   **Plan Pro** ($19.00 USD/mes, incluye Cine + Maestros).
2. Guarda cada `stripePriceId` en la tabla `plans` (ver `prisma/seed.js`).
3. Configura webhook a `/api/stripe/webhook`. Eventos mínimos:
   - `checkout.session.completed`
   - `customer.subscription.created` / `.updated` / `.deleted`
   - `invoice.paid` / `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Usa Stripe Test Clocks para probar el trial de 7 días sin esperar días reales.

## 7. Amplify Hosting

1. Conecta el repo de GitHub `davidcasasDEV-code/ITIA-Learning`.
2. Usa `QA` como staging y `main` como producción, Node 22.
3. Usa el `amplify.yml` del repo.
4. Agrega las variables de entorno por ambiente (incluye
   `INVITATION_TOKEN_SECRET` con 32+ caracteres estables).

## 8. Checklist antes de cobrar de verdad

- `npm run lint` y `npm run build` pasan.
- Login/callback/logout de Cognito funciona para `USER`, `ADMIN` y `TEACHER`.
- El trial de 7 días bloquea contenido correctamente al expirar.
- Stripe checkout crea la suscripción y el webhook la refleja en `subscriptions`.
- S3 no permite acceso público ni descarga directa del contenido de curso.
- Headers de seguridad activos (`next.config.ts`).
