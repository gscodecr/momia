# Guía de Despliegue en Producción: Momia TS (AWS Lightsail)

Esta guía detalla el proceso paso a paso para desplegar el sistema completo de Momia TS (Frontend y Backend) en una máquina virtual de AWS Lightsail, utilizando PostgreSQL para la base de datos y un Bucket S3 de Lightsail para el almacenamiento de imágenes.

## 1. Requisitos Previos en AWS Lightsail

Antes de tocar el servidor, debes crear estos tres recursos en tu panel de AWS Lightsail:

### A. Base de Datos PostgreSQL
1. En la pestaña **Bases de datos**, crea una nueva base de datos.
2. Selecciona **PostgreSQL** (versión 14 o superior).
3. Configura un usuario y una contraseña segura.
4. Una vez creada, anota el **Endpoint (Host)**, el **Puerto (5432)**, el **Usuario** y la **Contraseña**.
5. *Tu `DATABASE_URL` se verá así:* `postgresql://usuario:contraseña@endpoint:5432/postgres`

### B. Bucket de Almacenamiento (S3)
1. En la pestaña **Almacenamiento**, crea un nuevo Bucket.
2. Nómbralo (ej. `momia-ts-bucket`).
3. Ve a la pestaña de **Permisos** del bucket y configúralo como **Público** para que las imágenes puedan verse en la app.
4. En la pestaña de **Acceso**, crea una "Access Key" (Clave de Acceso). Anota el **Access Key ID** y el **Secret Access Key**. ¡Cuidado! El Secret Key solo se muestra una vez.

### C. Instancia Virtual (Servidor)
1. En la pestaña **Instancias**, crea una instancia de **Linux/Unix** (OS Only) -> **Ubuntu 22.04 LTS**.
2. Elige un plan (recomendado mínimo 1GB o 2GB de RAM).
3. Ve a la pestaña **Redes** de la instancia y crea una **IP Estática**. Adjúntala a tu instancia.
4. En las reglas del firewall (IPv4), asegúrate de tener abiertos los puertos:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)
5. En tu registrador de dominio (ej. GoDaddy o Namecheap), crea un **Registro A** que apunte tu dominio (ej. `app.midominio.com`) a la IP Estática que acabas de crear.

---

## 2. Configuración del Servidor (Ubuntu)

Conéctate por SSH a tu instancia de Ubuntu y ejecuta los siguientes comandos para preparar el servidor:

```bash
# Actualizar el servidor
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y curl git nginx python3-pip python3-venv libpq-dev

# Instalar Node.js (v20+ LTS recomendado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 para mantener Next.js vivo
sudo npm install -g pm2
```

---

## 3. Clonar y Configurar el Proyecto

Suponiendo que tu código está en GitHub, clónalo en el servidor:

```bash
# Clonar tu repositorio (te pedirá credenciales o Personal Access Token si es privado)
git clone https://github.com/tu-usuario/momia.git
cd momia
```

### Configuración del Backend (.env)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Crear y editar el archivo .env
nano .env
```
Pega dentro del `.env` las variables que guardaste en el Paso 1:
```env
DATABASE_URL=postgresql://usuario:contraseña@tu-endpoint:5432/postgres
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_BUCKET_NAME=momia-ts-bucket
AWS_REGION=us-east-1
SECRET_KEY=crea_una_clave_secreta_larga
```

Para mantener el backend vivo usando `systemd`, crea un archivo de servicio:
```bash
sudo nano /etc/systemd/system/momia-backend.service
```
Pega esto (ajusta `/home/ubuntu/momia` según tu ruta):
```ini
[Unit]
Description=Gunicorn instance to serve Momia Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/momia/backend
Environment="PATH=/home/ubuntu/momia/backend/venv/bin"
ExecStart=/home/ubuntu/momia/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001

[Install]
WantedBy=multi-user.target
```
Habilita e inicia el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl start momia-backend
sudo systemctl enable momia-backend
```

### Configuración del Frontend Web (Next.js)

```bash
cd /home/ubuntu/momia/web
npm install

# Compilar Next.js para producción
npm run build

# Iniciar la app con PM2
pm2 start npm --name "momia-web" -- start
pm2 save
pm2 startup
```

---

## 4. Configurar Nginx (Proxy Inverso) y Dominio

Nginx se encargará de recibir el tráfico web normal y pasarlo a Next.js, y todo lo que vaya a `/api` pasarlo al Backend de Python.

```bash
sudo nano /etc/nginx/sites-available/momia
```
Pega esta configuración:
```nginx
server {
    listen 80;
    server_name app.tudominio.com; # CAMBIA ESTO POR TU DOMINIO

    # Tráfico del Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Tráfico del Backend y WebSockets
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Habilita la configuración y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/momia /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

### Instalar Certificado SSL (HTTPS Seguro)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.tudominio.com
```

---

## 5. Script de Actualización Fácil (Redeploy)

Para que puedas actualizar el código en el futuro sin tener que recordar todo esto, crea un script en la carpeta de tu proyecto.

```bash
cd /home/ubuntu/momia
nano deploy.sh
```
Pega esto:
```bash
#!/bin/bash
echo "Descargando últimos cambios de GitHub..."
git pull origin main

echo "Actualizando Backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart momia-backend
cd ..

echo "Actualizando Frontend Web..."
cd web
npm install
npm run build
pm2 restart momia-web
cd ..

echo "¡Actualización completada exitosamente!"
```
Dale permisos de ejecución:
```bash
chmod +x deploy.sh
```

**¡Listo!** A partir de ahora, cada vez que hagas cambios en tu computadora y los envíes a GitHub (`git push`), solo debes entrar a tu servidor AWS y ejecutar `./deploy.sh`. Tu sistema se actualizará mágicamente en segundos sin caídas.
