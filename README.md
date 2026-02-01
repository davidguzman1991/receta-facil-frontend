# Frontend - Receta Facil

Frontend desarrollado con Next.js 14 y Tailwind CSS.

## Requisitos

- Node.js 18+ 
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
# o
yarn install
```

## Ejecutar la aplicación

### Desarrollo:
```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Producción:
```bash
npm run build
npm start
# o
yarn build
yarn start
```

## Estructura del proyecto

```
frontend/
├── app/
│   ├── layout.tsx       # Layout principal
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globales
├── public/              # Archivos estáticos
├── package.json
└── tailwind.config.ts   # Configuración de Tailwind
```
