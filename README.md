# Barberly — app móvil

App de Barberly para clientes y barberos, hecha con Expo. El propietario administra su barbería en `barberly-panel` (D-10).

Barberly tiene tres repositorios (D-11) que se clonan en la misma carpeta:

- `barberly-api`: API con Express, Prisma y MySQL 8, y la documentación del proyecto en `docs/`.
- `barberly-movil`: este repositorio.
- `barberly-panel`: panel web del propietario.

## Requisitos

- Node.js 26 (`nvm use` lee `.nvmrc`).
- La API corriendo en local (ver el README de `barberly-api`).
- Expo Go para Android, compatible con el SDK 58, en la misma red que el computador.

## Instalación

```bash
nvm use
npm install
cp .env.example .env
```

En `.env`, `EXPO_PUBLIC_URL_API` debe usar la IP local del computador, por ejemplo `http://192.168.1.10:3000/api/v1`.

## Uso

```bash
npm run start
```

Escanea el QR con Expo Go. Sin red común: `npx expo start --tunnel`.

## Verificación

```bash
bash .claude/skills/verificar/scripts/verificar.sh
```

Corre `lint`, `typecheck` y `test`.

## Contrato con la API

`src/api/contrato.ts` es una copia de `src/compartido/contrato.ts` de `barberly-api`. Si cambia en la API, se copia aquí en la misma funcionalidad. La referencia completa es `GET /api/v1/documentacion`.
