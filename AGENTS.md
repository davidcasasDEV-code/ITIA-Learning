<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Convenciones del proyecto

- Mismo stack y patrones que el proyecto hermano `go-pulsarxsuite`: Next.js App
  Router con JS/JSX (no TSX) para páginas y componentes, Cognito+jose para
  sesión (no NextAuth), Prisma sobre Postgres, Stripe para suscripciones, S3
  con URLs firmadas (nunca archivos públicos permanentes), SES para correo.
- No hay concepto de "Tenant"/multi-tenant aquí: es una app B2C, todo se
  filtra por `userId`.
- Roles: `USER`, `ADMIN`, `TEACHER` (ver `lib/permissions.js`). El rol viene
  de los grupos de Cognito (`COGNITO_ADMIN_GROUP`/`COGNITO_TEACHER_GROUP`).
- Privacidad: fuera de `/api/me`, nunca devuelvas `email`, `fullName`, `phone`
  o `address` de un `User` — solo `publicHandle` y `displayName`.
- El contenido del curso vive en `Level > Unit > Section` (una Section por
  cada uno de los 6 pilares: Dialogs/Vocabulary/Exercises/Intonation/
  Pronunciation/Comprehension). Ver `prisma/schema.prisma` para el modelo
  completo (incluye módulos aún sin UI: exámenes, juegos, cine, maestros,
  comunidad — ver README "Roadmap" para qué falta implementar).
