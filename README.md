# 🎂 Birthdays - Nunca olvides una fecha especial

**Birthdays** es una aplicación web progresiva (PWA) de estilo nativo iOS diseñada para gestionar, recordar y visualizar los cumpleaños de tus amigos, familiares y compañeros de trabajo de forma completamente privada, rápida y moderna. 

La app funciona de manera local en el dispositivo (sin servidores externos) utilizando tecnologías del navegador de última generación.

---

## 🌟 Características Principales

### 📱 Experiencia de Usuario (UX) de Nivel Nativo
* **Diseño iOS 26 Style:** Interfaz con efectos de desenfoque de cristal (glassmorphism), tipografía moderna (Inter), transiciones fluidas y soporte completo para **Modo Oscuro** automático o manual.
* **Respuesta Háptica:** Vibraciones sutiles (`vibrate` API) al presionar botones, eliminar o guardar datos para una sensación táctil premium en dispositivos móviles.
* **Pantalla de Carga (Splash Screen):** Entrada limpia al abrir la aplicación desde la pantalla de inicio.
* **Deslizar para Eliminar (Swipe to Delete):** Gesto móvil intuitivo en los elementos de la lista que revela un botón de eliminación rápida con cierre automático inteligente de otras tarjetas abiertas.

### 📅 Gestión de Fechas e Información
* **Visualización Dinámica:** Sección destacada de **HOY** con lluvia de confeti animada para celebrar a los cumpleañeros actuales.
* **Clasificación y Filtros:** Organización rápida por categorías (Familia, Amigos, Trabajo, Otros) y sección de cumpleaños más cercanos en los próximos 30 días.
* **Línea de Tiempo (Timeline):** Vista cronológica agrupada por meses que detalla el día, el día de la semana, los días restantes, la edad que cumplirá y el signo del zodiaco con su respectivo símbolo emoji.
* **Estadísticas Avanzadas:** Análisis del total de contactos, promedio de edad actual, cantidad de cumpleaños en el mes actual y cuenta regresiva exacta para el cumpleaños más cercano.

### 🚀 Integraciones y Exportación
* **Compartir por WhatsApp:** Genera y abre automáticamente un mensaje personalizado con emojis adecuado para felicitar al contacto ("¡Hoy es el cumpleaños de...", "Mañana cumple...", etc.) o recordar la fecha.
* **Agregar al Calendario (ICS):** Genera y descarga un archivo de calendario estándar compatible con Apple Calendar, Google Calendar y Microsoft Outlook, con recurrencia anual automática y alarma de recordatorio configurada para 1 día antes.
* **Exportar a PDF:** Genera un documento PDF limpio y paginado con el listado completo de todos los cumpleaños y detalles de fechas y signos zodiacales.
* **Copia de Seguridad (Backup):** Permite exportar todos los datos y configuraciones a un archivo JSON y restaurarlos en cualquier momento en cualquier otro dispositivo.

### 🔒 Privacidad y PWA (Modo Offline)
* **IndexedDB Local:** Almacenamiento directo en el navegador del dispositivo. Los datos son 100% privados y nunca viajan a ningún servidor web.
* **Funcionamiento sin Conexión:** Registro de Service Worker v4 que almacena en caché la estructura HTML, las hojas de estilo y las librerías necesarias de CDN (incluyendo Tailwind CSS v4 y Google Fonts), permitiendo un acceso completo offline.

---

## 📁 Estructura del Proyecto

* **[index.html](file:///c:/Users/Adriel/Desktop/bu/index.html):** Estructura del DOM, maquetación de modales, vistas dinámicas de estadísticas y Timeline.
* **[app.js](file:///c:/Users/Adriel/Desktop/bu/app.js):** Controladores de interfaz (UIController), gestión del gesto táctil de deslizamiento (SwipeToDelete), utilidades de fechas, zodiaco, exportación de ICS y PDF, y lógica principal de IndexedDB.
* **[style.css](file:///c:/Users/Adriel/Desktop/bu/style.css):** Hoja de estilos con variables CSS adaptadas para modos claro/oscuro, animaciones de confeti, efectos glassmorphism y adaptabilidad para áreas seguras de pantalla en móviles (Safe Areas de iOS).
* **[sw.js](file:///c:/Users/Adriel/Desktop/bu/sw.js):** Service worker encargado de la estrategia de caché local, manejo de recursos externos de CDNs y notificaciones locales.
* **[manifest.json](file:///c:/Users/Adriel/Desktop/bu/manifest.json):** Configuración de la aplicación web progresiva para permitir su instalación en dispositivos móviles como app de pantalla completa.

---

## ⏳ Control de Versiones

### `v2.1.0` (Versión Actual)
* **Corrección de Zona Horaria:** Implementación de `utils.parseLocalDate` para corregir el bug de desfase de hora. Anteriormente, al guardar un cumpleaños, la fecha se interpretaba en formato UTC ISO, provocando que se mostrara el día anterior por la noche en zonas horarias de América (como GMT-4/5).
* **Corrección del Zodiaco en Enero:** Se corrigió un solapamiento lógico en el recorrido de rangos de meses de `utils.getZodiac`. Anteriormente, cualquier fecha del 20 al 31 de enero se catalogaba incorrectamente como Capricornio en lugar de Acuario.
* **Caché Completo Offline:** Se actualizó `sw.js` a la versión de caché `v4` y se corrigió el interceptor de fetch para permitir el almacenamiento de respuestas del tipo `'cors'` y `'opaque'`. Esto permite que Tailwind CSS v4 (de `cdn.jsdelivr.net`) y las fuentes tipográficas de Google Fonts (de `fonts.gstatic.com`) se almacenen localmente y funcionen sin internet.
* **Correcciones Visuales:** 
  * Se corrigió la pluralización de estadísticas para cumpleaños a 1 día de distancia ("1 día" en lugar de "1 días").
  * Se optimizó el gesto Swipe de las tarjetas de lista para que al deslizar una nueva se cierre automáticamente cualquier otra tarjeta abierta previamente.

### `v2.0.0`
* Incorporación de estadísticas avanzadas y modales interactivos.
* Implementación de la vista cronológica mensual (Timeline).
* Integración con la API de WhatsApp y exportación dinámica de archivos ICS para calendarios móviles.
* Exportación de listados de cumpleaños a documentos PDF nativos utilizando la librería `jsPDF`.

### `v1.0.0`
* Lanzamiento inicial de la aplicación.
* Base de datos local en IndexedDB.
* Registro y edición de contactos (Nombre, Fecha de nacimiento, Categoría y Notas).
* Filtros rápidos en la lista por categorías (Familia, Amigos, Trabajo).

---

## 🛠️ Instalación y Uso Local

Para ejecutar la aplicación localmente:
1. Clona o copia los archivos del proyecto a un directorio local.
2. Inicia un servidor web estático en el directorio raíz. Por ejemplo:
   ```bash
   # Usando http-server de Node.js
   npx http-server -p 8080
   
   # O usando Python
   python -m http.server 8080
   ```
3. Abre tu navegador y navega a `http://localhost:8080`.
4. Para instalarla en dispositivos móviles, selecciona **"Compartir > Añadir a la pantalla de inicio"** (en iOS/Safari) o presiona el botón **"Instalar aplicación"** (en Android/Chrome).
