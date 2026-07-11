# Momia TS - Training System

Momia TS es una plataforma integral (SaaS) diseñada para academias deportivas de alto rendimiento. Conecta a Súper Administradores, Entrenadores (Coaches) y Atletas en un solo entorno centralizado para la gestión de rutinas, pagos, eventos y comunicación.

## Arquitectura del Proyecto

El proyecto está dividido en dos grandes bloques: **Backend** (API REST) y **Frontend** (Aplicación Web/Móvil).

### 1. Backend (Carpeta `/backend`)
Construido con **Python** y **FastAPI**, enfocado en velocidad y rendimiento.
- **Base de Datos:** SQLite (`momia.db`) a través de SQLAlchemy (ORM).
- **Autenticación:** JWT (JSON Web Tokens) con hashing de contraseñas mediante `passlib` y `bcrypt`.
- **Estructura de Archivos:**
  - `main.py`: Punto de entrada de la API. Contiene el "seeder" automático de roles y el súper administrador.
  - `models.py`: Definición de tablas de la base de datos (Usuarios, Roles, etc.).
  - `schemas.py`: Modelos Pydantic para validación de datos de entrada/salida.
  - `database.py`: Configuración de la conexión a la base de datos.
  - `auth.py`: Rutas de registro, inicio de sesión y validación de tokens.
  - `admin.py`: Rutas protegidas exclusivas para administradores (aprobación de usuarios).

### 2. Frontend (Carpeta `/web`)
Construido con **Next.js (App Router)**, **React 19** y **Tailwind CSS**.
- **Estética:** UI premium, modo oscuro por defecto (`#09090b`), acentos en azul Momia (`#0d83b1`) y componentes estilo "Glassmorphism" (cristalizado).
- **Notificaciones:** Sistema de toasters globales usando `react-hot-toast`.
- **Enrutamiento y Layouts:**
  - `/login` y `/register`: Flujos de autenticación pública.
  - `/(dashboard)`: Grupo de rutas protegidas bajo un `DashboardLayout` dinámico. El Sidebar (menú lateral) se adapta automáticamente según el rol del usuario (Admin, Coach o Atleta).
- **Vistas Principales Desarrolladas (UI):**
  - **Súper Admin:** Dashboard (KPIs), Aprobación de Usuarios, Marketplace, Gestión de Pagos.
  - **Coach:** Panel de Atletas (Semáforos de cumplimiento), Planificador de Rutinas (Calendario semanal).
  - **Atleta:** Progreso (Hero Banner compartible), Facturación (SINPE/Tilopay), Tienda.
  - **Compartidas:** Calendario de Eventos, Centro de Mensajería.

## Estado Actual
- ✅ **Completado:** Arquitectura base, autenticación segura, redirección por roles y el 100% de la Interfaz de Usuario (UI) de los paneles principales.
- 🚧 **En Progreso / Pendiente:** Conectar las interfaces del frontend (que actualmente usan datos simulados) con endpoints reales del backend, integraciones de terceros (Pagos, WhatsApp, Training Peaks) y despliegue a producción.
