# Kiora — Asistente de IA con avatar 3D animado

Kiora es un asistente conversacional local con una interfaz tipo "centro de mando": un avatar 3D en formato **VRM** que reacciona en tiempo real a la conversación (parpadeo, respiración, balanceo de cabeza, expresiones de habla/pensando), un fondo de red neuronal animado que se activa mientras el modelo "piensa", y un panel de chat con renderizado de Markdown — todo corriendo sobre un modelo de lenguaje local servido por **Ollama**.

Este proyecto es la base de un objetivo personal a largo plazo: construir una compañera de IA de escritorio con interfaz animada en tiempo real, en lugar de un simple chatbot de texto.

![status](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![python](https://img.shields.io/badge/python-3.x-blue)
![license](https://img.shields.io/badge/licencia-sin%20especificar-lightgrey)

---

## ✨ Características

- **Avatar 3D en VRM** renderizado con Three.js + `@pixiv/three-vrm`, con:
  - Respiración y balanceo de cabeza idle (sutiles, distintos cuando está "pensando")
  - Parpadeo automático con temporización aleatoria
  - Tres estados de animación: `idle`, `thinking`, `talking`, con expresiones faciales (`happy`, `neutral`, `aa`) que cambian según el estado
  - Carga el modelo desde `/model.vrm`, servido directamente por Flask
- **Fondo de red neuronal generativo** en `<canvas>`: nodos y pulsos que se mueven de forma orgánica y se aceleran cuando Kiora está procesando una respuesta (`trigThink()` / `trigResp()`)
- **Chat con Markdown**: las respuestas del modelo se renderizan con [marked.js](https://github.com/markedjs/marked), así que listas, código y negritas se ven correctamente
- **Backend Flask minimalista** que actúa de puente entre el navegador y un servidor [Ollama](https://ollama.com) corriendo en otra máquina de la red local
- Interfaz con sidebar de navegación (Chat / Memoria / Red / Ajustes) — actualmente solo la pestaña **Chat** está implementada; las demás son la base visual para futuras funciones

## 🧱 Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Python 3, Flask, `requests` |
| Modelo de lenguaje | [Ollama](https://ollama.com) corriendo `qwen2.5:14b` (configurable) |
| Render 3D | Three.js `0.168.0`, `@pixiv/three-vrm` `2.1.2` (vía CDN, import maps) |
| Avatar | Modelo `.vrm` (incluido: `HatsuneMikuNT.vrm`, reemplazable por cualquier modelo VRM) |
| Frontend | HTML + CSS + JavaScript vanilla (sin frameworks ni build step) |
| Markdown | [marked.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js) |

## 📂 Estructura del proyecto

```
Kiora-AI-Assistant/
├── kiora.py              # Servidor Flask: sirve la app, el modelo VRM y el endpoint /chat
├── HatsuneMikuNT.vrm     # Modelo de avatar 3D (formato VRM)
├── templates/
│   └── index.html        # Interfaz principal (sidebar, panel de chat, canvases)
└── static/
    ├── script.js          # Lógica de Three.js/VRM, animación de red neuronal y chat
    └── style.css          # Estilos de toda la interfaz
```

## ⚙️ Cómo funciona

```
Navegador (Three.js + VRM)
        │  POST /chat  { "message": "..." }
        ▼
   Flask (kiora.py)
        │  POST http://<PC_IP>:11434/api/generate
        │  { "model": "qwen2.5:14b", "prompt": "...", "stream": false }
        ▼
     Ollama (servidor local)
```

1. El usuario escribe un mensaje en el panel de chat.
2. El frontend dispara la animación de "pensando" (avatar + red neuronal) y hace `POST` a `/chat`.
3. Flask reenvía el mensaje al endpoint `/api/generate` de Ollama, en la IP configurada en `PC_IP`.
4. La respuesta del modelo vuelve al navegador, se renderiza como Markdown y dispara la animación de "hablando" del avatar.

## 🚀 Instalación

### Requisitos previos

- Python 3.9 o superior
- [Ollama](https://ollama.com) instalado y corriendo (en la misma máquina o en otra de tu red local), con el modelo descargado:
  ```bash
  ollama pull qwen2.5:14b
  ```
- Un navegador moderno con soporte de WebGL (para renderizar el modelo VRM)

### Pasos

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Gal4h4d/Kiora-AI-Assistant.git
   cd Kiora-AI-Assistant
   ```

2. Instala las dependencias de Python:
   ```bash
   pip install flask requests
   ```

3. Configura la IP del servidor de Ollama en `kiora.py`:
   ```python
   PC_IP = "192.168.1.26"  # cámbiala por la IP donde corre Ollama
   ```
   Si Ollama corre en la misma máquina donde ejecutas Flask, usa `"127.0.0.1"` o `"localhost"`.

4. Ejecuta el servidor:
   ```bash
   python kiora.py
   ```

5. Abre el navegador en:
   ```
   http://localhost:5000
   ```

## 🔧 Configuración / personalización

- **Cambiar de modelo de lenguaje**: edita el campo `"model"` en la función `chat()` de `kiora.py` por el nombre de cualquier modelo que tengas en Ollama (`ollama list`).
- **Cambiar de avatar**: reemplaza `HatsuneMikuNT.vrm` por cualquier otro modelo `.vrm` válido (debe tener huesos `humanoid` estándar y, opcionalmente, `blendShapes`/expresiones `blinkLeft`, `blinkRight`, `happy`, `neutral`, `aa` para que las animaciones funcionen) y actualiza el nombre del archivo en la ruta `/model.vrm` dentro de `kiora.py`.
- **Ajustar la cámara o iluminación del avatar**: en `static/script.js`, dentro del bloque `VRM — THREE.JS`, puedes modificar la posición de `camera`, o la intensidad/color de `ambient`, `keyLight`, `fillLight`, `rimLight`.

## 🗺️ Estado actual y próximos pasos

- [x] Chat funcional contra modelo local vía Ollama
- [x] Avatar VRM con animaciones idle / pensando / hablando
- [x] Fondo de red neuronal reactivo
- [ ] Pestaña **Memoria** (persistencia de conversaciones / contexto a largo plazo)
- [ ] Pestaña **Red** (posiblemente integración con servicios o dispositivos en red)
- [ ] Pestaña **Ajustes** (configuración desde la interfaz, sin tocar código)
- [ ] Streaming de respuestas (actualmente `stream: false`, la respuesta llega completa)
- [ ] Sincronización de labios más precisa (lip-sync real en vez de aproximación senoidal)

## 👤 Autor

**Juan David** ([Gal4h4d](https://github.com/Gal4h4d)) — proyecto personal, parte de una iniciativa de largo plazo para construir una asistente de IA de escritorio con interfaz animada en tiempo real.
