# ITIA Learning

Plataforma web para aprender inglés: cursos por nivel (Basic/Medium/Advanced),
exámenes, medallas de progreso, minijuegos, cine con transcripción, contenido
de comunidad y citas con maestros. Suscripción mensual: **Plan Basic $9 USD**
(curso completo) y **Plan Pro $19 USD** (+ Cine + Maestros), con 7 días de
prueba gratis.

## Stack

- Next.js 15 + React 19, Node.js 22
- Prisma 5 + PostgreSQL/RDS
- Amazon Cognito (auth), S3 (storage privado con URLs firmadas), SES (correo)
- Stripe Checkout + webhooks
- AWS Amplify Hosting SSR

Mismo stack y convenciones que el proyecto hermano `go-pulsarxsuite` (ver
`AGENTS.md`), sin el concepto de multi-tenant: aquí todo es B2C por `userId`.

## Desarrollo local

```bash
npm install
cp .env.example .env
npx prisma generate
npm run prisma:seed
npm run dev
```

Configura `DATABASE_URL`, Cognito, S3, SES y Stripe en `.env`. El seed crea
los dos planes, el currículo Nivel Basic / Unidad 1 con contenido real (las 6
secciones: Dialogs, Vocabulary, Exercises, Intonation, Pronunciation,
Comprehension) y un usuario Admin de prueba.

## Validación

```bash
npm run lint
npm run build
npx prisma validate
```

## Despliegue

`amplify.yml` incluido para AWS Amplify Hosting SSR (branch `QA` = staging,
`main` = producción). Ver `docs/aws-setup.md` para el paso a paso de
Cognito/RDS/S3/SES/Stripe — **nada de eso está creado todavía**, es una guía
para cuando David esté listo para provisionar la cuenta de AWS.

## Qué incluye esta primera fase

- Modelo de datos completo (`prisma/schema.prisma`) para **todo** el producto
  descrito en la spec original (currículo, exámenes, progreso, juegos, cine,
  comunidad, maestros y agenda).
- Implementado end-to-end: registro/login (Cognito), roles `USER`/`ADMIN`/
  `TEACHER`, trial de 7 días + paywall, checkout de Stripe, el flujo completo
  de **Nivel Basic → Unidad 1** con sus 6 secciones y contenido real, medalla
  y estrellas de progreso, el minijuego **Memorama**, y un panel Admin básico
  (usuarios, CMS de contenido de una unidad, resumen de suscripciones).

## Roadmap (esquema listo, UI pendiente)

- Exámenes autogenerados por unidad/salto de nivel + bitácora descargable.
- Resto de las ~27 unidades (CMS ya permite cargarlas; o pedir que se
  procesen los PDF `basic.pdf`/`medium.pdf`/`advanced.pdf` unidad por unidad).
- Catálogo completo de minijuegos (sopa de letras, puzzle, "adivina quién"
  contra bot adaptativo) y sesión de 2 personas en la misma partida.
- Cine: reproductor con transcripción pausable y traducción bajo demanda.
- Comunidad: publicar contenido/ejercicios propios, moderación Admin.
- Maestros: calendario de disponibilidad, citas (máx. 10/hora), favoritos,
  calificación solo tras asistir, vacaciones/ausencias.
- Prueba de nivel opcional al crear cuenta (placement test).
- Analítica de ingresos del Admin (mensual/anual, activos, churn).
