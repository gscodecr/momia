# Momia TS - Training System

Momia TS es una plataforma integral (SaaS) diseñada para academias deportivas de alto rendimiento. Conecta a Administradores, Entrenadores (Coaches) y Atletas en un solo entorno centralizado para la gestión de membresías, rutinas, tienda, eventos y comunicación interna.

## 🏗 Arquitectura del Proyecto

El proyecto está dividido en tres grandes bloques: **Backend** (API REST), **Frontend Web** (Plataforma administrativa y web) y **Frontend Móvil** (Aplicación para atletas).

### 1. Backend (Carpeta `/backend`)
Construido con **Python** y **FastAPI**, enfocado en velocidad y rendimiento.
- **Base de Datos:** PostgreSQL o SQLite a través de SQLAlchemy (ORM).
- **Autenticación:** JWT (JSON Web Tokens) con hashing de contraseñas mediante `passlib` y `bcrypt`.
- **Estructura de Archivos Principal:**
  - `main.py`: Punto de entrada de la API. Rutas y seeder automático.
  - `models.py`: Definición de tablas (Users, Orders, Payments, BusinessSettings, etc.).
  - `schemas.py`: Modelos Pydantic para validación de datos.
  - `database.py`: Configuración de base de datos.
  - `auth.py`: Autenticación y registro.
  - `payments.py`: Lógica principal de facturación, comprobantes de SINPE y fechas de corte.

### 2. Frontend Web (Carpeta `/web`)
Construido con **Next.js (App Router)**, **React 19** y **Tailwind CSS**.
- **Estética:** UI premium, modo oscuro por defecto (`#09090b`), acentos en azul Momia (`#0d83b1`) y componentes "Glassmorphism" (cristalizado).
- **Notificaciones:** Sistema de toasters globales usando `react-hot-toast`.
- **Paneles por Rol:**
  - **Súper Admin:** Gestión de usuarios, configuración del negocio, control de pagos (aprobación/rechazo manual de SINPE), y marketplace.
  - **Coach:** Panel de Atletas (Semáforos de cumplimiento) y Planificador de Rutinas (Calendario semanal).
  - **Atleta:** Progreso, Facturación (Subida de comprobantes) y Tienda.

### 3. Frontend Móvil (Carpeta `/mobile`)
Construido con **React Native (Expo)**.
- **Enrutamiento:** `expo-router` con navegación basada en pestañas (Tabs).
- **Funcionalidad:** Replicación de la experiencia web optimizada para dispositivos móviles (Gestión de expedientes, Subida de comprobantes desde la galería del celular, Calendario de eventos).

## 📊 Estado Actual
- ✅ **Completado:** 
  - Arquitectura base (Base de datos y API) operativa.
  - Autenticación, redirección basada en roles y vistas UI completas para Web y Móvil.
  - Subida de comprobantes de pago (SINPE / Transferencia) y flujo de aprobación administrativo que renueva membresías automáticamente.
  - Sistema de configuración de parámetros de negocio (Teléfonos, Cuentas Bancarias).
  - Integración básica para notificaciones por correo (vía SMTP).
- 🚧 **En Progreso / Pendiente:** 
  - Integración en firme (Producción) con la API de la pasarela **Tilopay**.
  - Migración del guardado de imágenes (comprobantes y avatares) desde almacenamiento local hacia la nube (Ej. AWS S3).
  - Integraciones adicionales con Training Peaks y WhatsApp.

## 🚀 Despliegue (Deploy)
El proyecto cuenta con un script automatizado `deploy.sh` configurado para entornos Linux (ej. AWS Lightsail) que:
1. Actualiza el repositorio mediante Git.
2. Instala dependencias (`requirements.txt` y `package.json`).
3. Construye el frontend (`npm run build`).
4. Reinicia los servicios a través de PM2.
