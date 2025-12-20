# PresNova

Clon simplificado de ProPresenter - Monorepo

## Estructura

- `backend/`: Proyecto Django con Django REST Framework
- `frontend/`: Aplicación React con Vite y TailwindCSS

## Requisitos Previos

- Python 3.11 o superior
- Node.js 18 o superior
- npm o yarn

## Instalación y Ejecución

### Paso 1: Configurar el Backend (Django)

1. Navega a la carpeta del backend:
```bash
cd backend
```

2. Crea un entorno virtual de Python:
```bash
python3 -m venv venv
```

3. Activa el entorno virtual:
   - En macOS/Linux:
   ```bash
   source venv/bin/activate
   ```
   - En Windows:
   ```bash
   venv\Scripts\activate
   ```

4. Instala las dependencias:
```bash
pip install -r requirements.txt
```

5. Ejecuta las migraciones:
```bash
python manage.py migrate
```

6. (Opcional) Crea un superusuario para acceder al admin:
```bash
python manage.py createsuperuser
```

7. Inicia el servidor de desarrollo:
```bash
python manage.py runserver
```

El backend estará disponible en `http://localhost:8000`
La API estará disponible en `http://localhost:8000/api/`

### Paso 2: Configurar el Frontend (React)

Abre una nueva terminal y:

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Rutas Disponibles

- `/` - Página de inicio
- `/operator` - Vista del operador
- `/output` - Vista de salida
- `/stage` - Vista de escenario

## Notas

- El backend está configurado con CORS para permitir peticiones desde `http://localhost:5173`
- El proyecto usa SQLite como base de datos por defecto
- Para producción, asegúrate de cambiar `SECRET_KEY` y `DEBUG` en `backend/presnova_backend/settings.py`

