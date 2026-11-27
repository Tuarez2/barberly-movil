# AGENTS.md — Barberly (app móvil)

App móvil de Barberly para clientes y barberos, con asesor de estilo por IA. Expo con Expo Router; solo habla con la API (`barberly-api`).
El propietario no usa esta app: lo administrativo va en `barberly-panel` (D-10). Si un propietario entra aquí, usa la app como cliente, o como barbero si tiene esa membresía, y ve un aviso para ir al panel.
Fuente de verdad: `../api/docs/DERCAS.md` + `../api/docs/decisiones.md` (D-11); si se contradicen, gana la decisión más reciente. Si difieren de este archivo, ganan ellos: avisa, no improvises.

## Repositorios (D-11)

Los tres se clonan en la carpeta de trabajo `Barberly/` como `api/` (API y `docs/`), `movil/` (este) y `panel/`. El orquestador multi-repositorio vive en `Barberly/CLAUDE.md` (D-27). La documentación se lee en `../api/docs/` y no se copia aquí.
`src/api/contrato.ts` es una copia del contrato de la API (`src/compartido/contrato.ts` en `barberly-api`); la referencia es `GET /api/v1/documentacion`.

## Stack (fijo: no cambies de librería sin preguntar)

- React Native, Expo Router, TypeScript estricto, TanStack Query, React Hook Form + Zod, Luxon, expo-secure-store, Reanimated, expo-haptics, jest-expo.
- Movimiento (D-26): tokens en `src/tema/movimiento.ts` y componentes base en `src/componentes/` (`Boton`, `CampoTexto`, `Aviso`, `CorteDiagonal`, `Entrada`, `PantallaFormulario`, `PantallaCarga`); úsalos antes de crear otros.
- Sesión: `src/sesion/proveedor-sesion.tsx` (`useSesion`) y `src/api/cliente.ts` (`pedir`, renovación automática).
- ESLint y Prettier. Toda dependencia nueva se justifica en el PR.

## Nombres

- Lo propio va en español sin tildes ni ñ: rutas, carpetas, archivos, componentes, funciones, variables, tipos y pruebas.
- En inglés solo lo que impone la tecnología: palabras reservadas, librerías y sus APIs, `id`, términos técnicos (`token`, `hash`) y archivos estándar.
- Componentes y tipos `PascalCase`; variables `camelCase`; códigos de error `MAYUSCULAS`; rutas y archivos en minúsculas con guiones.

## Flujo SDD

1. Lee `../api/docs/especificaciones/<modulo>.md` y lo que referencia.
2. Si cambia el comportamiento, la especificación se actualiza antes en `barberly-api`.
3. Presenta un plan de 5 a 8 líneas por funcionalidad y espera OK (D-27); las dudas menores se anotan en el PR.
4. Tareas pequeñas, una rama por tarea, un PR por funcionalidad; no refactorices fuera del alcance.
5. Pruebas desde los criterios de aceptación.
6. Corre `lint`, `typecheck` y `test`.
7. Cita los códigos RN/AUT en commits y pruebas.

## Tareas y Git

- Las tareas están en `../api/docs/hoja-de-ruta.md`; si no está, primero se agrega allí.
- El usuario crea las ramas y hace commit, merge y PR. Claude hace push de la rama actual cuando el usuario lo indica.
- Nunca push a `main` ni con `--force`: `main` solo recibe código por PR con CI verde.
- Los especialistas no crean ramas ni hacen commit o push.

## Comandos

- `npm install` en la raíz.
- `npm run lint` · `npm run typecheck` · `npm run test` · `npm run formato`.
- `npx expo start` (Expo Go, Android). Rutas tipadas: se regeneran solas con `expo start`.

## Referencias

- `../api/docs/pantallas.md` (pantalla → nodo, ruta y endpoints) · `../api/docs/identidad-visual.md` (tokens; enlace a Figma).
- `../api/docs/errores.md` · `../api/docs/decisiones.md` · `../api/docs/especificaciones/`.
- `../api/docs/flujo-de-trabajo.md` · `../api/docs/hoja-de-ruta.md` (solo la fila de la tarea, nunca completa).
- `../api/docs/DERCAS.md`: solo la sección puntual, nunca completo.

## Reglas no negociables

- La app solo habla con la API; las reglas de negocio las aplica siempre el backend.
- Datos, navegación, formularios y errores: skill `expo-pantallas`. Interfaz: skill `diseno-movil`.
- Sin pantallas de propietario (D-10).
- Foto del rostro (RN-27): solo en memoria y solo hacia la API; nunca se guarda en el dispositivo.

## Hecho significa

Cumple su HU · pruebas pasan · `lint` y `typecheck` limpios · probado en Android (Expo Go).

## No hacer

- Nombrar en inglés algo propio.
- Confiar en la validación de la app en lugar de la del backend.
- Exponer correos de otros usuarios o datos entre barberías.
- Guardar tokens fuera de expo-secure-store.
- Inventar endpoints, campos o errores: usa DERCAS §9, §10 y Anexo B, o pregunta.
