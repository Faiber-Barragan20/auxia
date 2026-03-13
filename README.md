# Automatiza con auxia - Landing Page

Este repositorio contiene el código fuente de la página de aterrizaje (landing page) estática para **Automatiza con auxia**. El sitio está diseñado para ser de alto rendimiento, 100% estático y optimizado para implementarse en plataformas como GitHub Pages o Vercel sin necesidad de un backend.

## 🚀 Acerca del Proyecto

La web está estructurada como un diseño "futurista suave" (soft futuristic) enfocado en la conversión B2B. Presenta nuestro SaaS de automatización empresarial mediante un diseño limpio, animaciones CSS sutiles (glassmorphism) y copywriting persuasivo.

### Características Principales:
- **Tecnología Estática:** HTML puro y Vanilla CSS. No requiere compilación.
- **Estilos:** Tailwind CSS (vía CDN) combinado con clases personalizadas de `glassmorphism`.
- **Fondo Animado:** Orbes ambientales y malla de gradientes construidos 100% en CSS para evitar impacto en el rendimiento.
- **Enfoque en WhatsApp:** Sin formularios nativos. Toda la conversión se dirige automáticamente a flujos de trabajo en WhatsApp.

## 📂 Estructura del Proyecto

El sitio consta de 4 páginas principales listas para producción:

- `index.html` - Página principal de inicio (Home) con el pitch de venta (Problem-Agitate-Solution).
- `condiciones.html` - Página formal de los Términos y Condiciones del Servicio.
- `privacidad.html` - Política de Privacidad y manejo de datos de clientes.
- `eliminacion-datos.html` - Documento simplificado sobre el borrado de datos (requerido para cumplimiento como Meta Tech Provider).

## 🛠 Instalación y Desarrollo Local

Dado que el sitio es estático, el desarrollo y pruebas locales son inmediatos:

1. Clona este repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd auxia_front
   ```

2. Abre cualquier archivo `.html` directamente en tu navegador, o levanta un servidor local en Python:
   ```bash
   python -m http.server 8000
   ```
   > Luego, visita `http://127.0.0.1:8000` en tu navegador.

## 📝 Personalización

Para modificar el número de contacto de WhatsApp, debes buscar la cadena de texto `https://wa.me/3024453822` en los archivos HTML y sustituir el número por el deseado (con código de país, sin el `+`).

---
*Desarrollado para Automatiza con auxia.*
