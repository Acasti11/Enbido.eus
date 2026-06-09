# Enbido Frontend - Documentación Técnica y Arquitectura de Nivel Enterprise

Enbido es una aplicación web multijugador en tiempo real para el juego de cartas **Mus**, que integra gestión de salas de juego, emparejamiento por ELO (matchmaking), torneos virtuales con lógica de brackets, anuncios de quedadas (meetups) locales en establecimientos físicos con geolocalización interactiva, una tienda de cosméticos virtuales y un sistema global de mensajería instantánea y notificaciones.

Este documento sirve como manual técnico de referencia para el equipo de desarrollo del frontend.

---

## 1. Arquitectura General

El frontend de Enbido está construido bajo la arquitectura **Feature-Sliced Design (FSD)** adaptada para React y TypeScript, estructurando el código por capas y características aisladas para asegurar la mantenibilidad y modularidad.

### Diagrama de Flujo de Renderizado (ASCII Art)

```text
  [ Acción del Usuario (Click, Input, Gesto) / Suceso en Red (WebSocket, Polling) ]
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Componentes Visuales React (Capa de Presentación)│
             │ - Capturan eventos y pintan la UI con CSS        │
             │ - Reciben datos estructurados vía props          │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      │ Invoca / Llama a hooks
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Custom Hooks (Capa de Lógica de Negocio)          │
             │ - Controlan el flujo de datos y estados locales  │
             │ - Validan inputs y estructuran payloads de red   │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      │ Dispatch / Actualiza
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Contextos Globales (Capa de Gestión de Estado)   │
             │ - AuthContext, SettingsContext, ChatContext      │
             │ - Proveen canales de comunicación transversales  │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      │ Peticiones / Handshakes
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Clientes de Comunicación (Capa de Infraestructura)│
             │ - Axios Client (api.ts) con soporte de cookies   │
             │ - Canales de WebSockets nativos (ws-mus, ws-chat)│
             └────────────────────────┬─────────────────────────┘
                                      │
                                      │ Protocolo de Red (HTTP/WS)
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Servidor Backend (Spring Boot 3 + MySQL 8)        │
             └──────────────────────────────────────────────────┘
```

### Capas y Responsabilidades

| Capa | Responsabilidad | Ubicación y Tecnologías |
| :--- | :--- | :--- |
| **Componentes (UI)** | Presentación limpia e interactiva. Pintan la UI usando Vanilla CSS con variables de diseño. No realizan lógica de persistencia. | `src/features/*/components/`, `src/pages/*/components/` |
| **Hooks (Business Logic)** | Aislan la lógica de negocio del ciclo de vida visual de los componentes, procesando cálculos de juego y validaciones. | `src/features/*/hooks/`, `src/shared/hooks/` |
| **Contexts (State)** | Comparten el estado global de la aplicación de manera transversal entre las diferentes vistas y páginas. | `src/features/*/hooks/*Context.tsx`, `src/shared/hooks/` |
| **Infrastructure (Client/WS)** | Comunicación a bajo nivel con la API REST y el servidor de WebSockets, inyectando cookies y reintentando peticiones. | `src/shared/lib/api.ts`, `src/features/game/hooks/useMusWebSocket.ts` |

---

## 2. Flujo de Autenticación y Autorización (JWT)

El frontend de Enbido implementa un sistema de autenticación seguro basado en cookies de sesión HTTP y JSON Web Tokens (JWT) gestionados a nivel de backend.

### Diagrama del Flujo JWT (ASCII Art)

```text
    [ Formulario de Login / Botón de Google OAuth ]
                           │
                           ▼
          POST /api/usuarios/login  o  /api/auth/google
                           │
                           ▼
          ┌───────────────────────────────────┐
          │ El Backend valida y firma el JWT  │
          ├───────────────────────────────────┤
          │ Establece la cookie de acceso:    │
          │ - HttpOnly (segura contra XSS)    │
          │ - SameSite=Strict                 │
          └────────────────┬──────────────────┘
                           │
                           ▼
          Envío automático de la cookie por Axios 
          (gracias a withCredentials: true)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    Petición REST protegida      WebSocket Handshake
  (Ej: /api/usuarios/me/profile) (ws://.../ws-mus)
             │                           │
             ▼                           ▼
    [ Backend valida JWT ]      [ Backend valida JWT ]
```

### Gestión de Seguridad y Almacenamiento

1. **Almacenamiento del Token:** A diferencia de las arquitecturas clásicas con almacenamiento en `localStorage`, Enbido utiliza **cookies HttpOnly** establecidas directamente por el servidor Spring Boot. Esto evita por completo la lectura de los tokens desde JavaScript y mitiga los riesgos de robo de credenciales a través de ataques **XSS (Cross-Site Scripting)**.
2. **Expiración y Retries (Refresh automático):**
   * Cuando el token expira o es inválido, una petición REST devuelve un código de estado `401 Unauthorized`.
   * El cliente Axios (`src/shared/lib/api.ts`) captura el error mediante un interceptor de respuesta, bloquea peticiones encoladas mediante un semáforo (`isRefreshing`), y envía una solicitud al endpoint `/auth/refresh` para renovar la cookie.
   * Si la renovación es exitosa, se reintentan las peticiones originales fallidas. Si falla, el interceptor limpia el estado y redirige forzadamente al usuario a `/login`.
3. **Protección de Rutas (Auth Guards):**
   * La verificación de acceso se gestiona dentro de `useNavbar.ts` y de los componentes mediante la validación del estado `isAuthenticated` del `AuthContext`.
   * Si un usuario no autenticado intenta acceder a rutas privadas como `/jugar`, `/cuenta` o `/torneos`, se bloquea el renderizado y se le redirige al login.

---

## 3. Mapeo de Rutas → Componentes → Servicios

| Ruta URL | Componente Renderizado | Hook(s) Usado(s) | Service/API Llamado | Estado Involucrado | Props Clave / Parámetros |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage` | `useAuth()`, `useNavbar()` | Ninguno | `AuthContext` | Ninguna |
| `/login` | `LoginPage` | `useLoginForm()`, `useAuth()` | `POST /usuarios/login` | `AuthContext` | Ninguna |
| `/recuperar-password`| `ResetPasswordPage` | `useFormValidation()` | `POST /usuarios/login/reset-password` | Local (`useState`) | Ninguna |
| `/jugar` | `MusGamePage` | `useMusGame()`, `useMusWebSocket()`, `useSettingsAudio()` | WebSocket `/ws-mus` y `/ws-chat` | `SettingsContext`, `ChatWebSocketContext` | Ninguna |
| `/torneos` | `TournamentPage` | `useTournamentLobby()` | `/api/tournaments` | Local, `AuthContext` | Ninguna |
| `/quedadas` | `MeetupPage` | `useMeetupMap()`, `useMeetupData()` | `/api/local-meetup-ad` | Local | Ninguna |
| `/tienda` | `ShopPage` | `useShopData()` | `/api/shop` | Local, `AuthContext` | Ninguna |
| `/perfil` | `ProfilePage` | `useAuth()` | `/api/usuarios/me/profile` | `AuthContext` | Ninguna |
| `/cuenta` | `AccountPage` | `useAccountData()` | `/api/usuarios/me/profile` | Local, `AuthContext` | Ninguna |
| `/reglas` | `RulesPage` | Ninguno | Ninguno | Ninguno | Ninguna |
| `/admin` | `AdminPage` | `useUsuarios()` | `/api/admin/*` | Local, `AuthContext` | Ninguna |

---

## 4. Explicación Fichero por Fichero

A continuación se realiza un desglose exhaustivo de los ficheros de código fuente y configuración que integran el proyecto del frontend:

### Directorio Raíz (`/`)

#### 1. `.env.local`
* **Propósito:** Define las variables de entorno para el entorno de desarrollo local.
* **Detalle:** Contiene `VITE_API_URL` apuntando a `http://localhost:8080/api` y la credencial pública de Google Client ID para local.
* **Seguridad:** Archivo de configuración puramente local.

#### 2. `.env.production`
* **Propósito:** Define las variables de entorno para el entorno de producción.
* **Detalle:** Establece `VITE_API_URL` a `/api` (petición relativa delegada en el proxy de Nginx) y el ID de Google Client ID correspondiente al dominio productivo.
* **Seguridad:** Los secretos y configuraciones privadas deben inyectarse en el pipeline del servidor y no subirse al repositorio.

#### 3. `.gitignore`
* **Propósito:** Indica a Git qué carpetas y extensiones debe ignorar en el seguimiento de cambios.
* **Detalle:** Excluye `node_modules/`, compilados de desarrollo como `dist/`, logs de npm y editores locales (`.idea/`, `.vscode/`).

#### 4. `Dockerfile`
* **Propósito:** Define la receta de construcción de la imagen Docker de producción para el frontend en dos fases (*multi-stage*).
* **Fases:** 
  1. *Build:* Instala dependencias con `npm ci`, copia todo el código fuente y compila con `npm run build` usando Node 20 en Alpine.
  2. *Servidor:* Instala Nginx en Alpine, copia los archivos estáticos de `/app/dist` a `/usr/share/nginx/html` y expone el puerto 80 con la configuración de `nginx.conf`.

#### 5. `eslint.config.js`
* **Propósito:** Configuración de reglas de análisis estático de código para JavaScript y TypeScript.
* **Detalle:** Define los patrones de codificación requeridos y alertas por variables no utilizadas, importaciones incorrectas y dependencias de hooks de React desactualizadas.

#### 6. `frontend_AGENTS.md`
* **Propósito:** Guía de desarrollo y políticas de codificación específicas para el frontend.
* **Detalle:** Define límites de 40 líneas por función, destructuring obligatorio de props en componentes, idioma inglés estricto para variables y nombres de funciones.

#### 7. `index.html`
* **Propósito:** Página web base donde se inyecta y monta toda la aplicación React en el div `<div id="root"></div>`.
* **Detalle:** Importa de forma directa el punto de entrada de la lógica en TypeScript `src/main.tsx`.

#### 8. `nginx.conf`
* **Propósito:** Configuración del servidor Nginx que corre dentro del contenedor del frontend en producción.
* **Detalle:** Configura compresión gzip, enrutamiento a SPA con `try_files $uri $uri/ /index.html;` para que React Router funcione, y proxying inverso para `/api/` y `/ws-` apuntando al backend Spring Boot.

#### 9. `package.json`
* **Propósito:** Define los metadatos del proyecto, dependencias requeridas, scripts de desarrollo y compilación.
* **Dependencias Clave:** React 19, Axios (cliente HTTP), react-router-dom (enrutamiento), i18next (traducciones), Leaflet (mapa), Google OAuth.

#### 10. `tsconfig.json`
* **Propósito:** Configura los metadatos generales del compilador TypeScript.
* **Detalle:** Configura referencias del proyecto delegando la compilación a `tsconfig.app.json` y `tsconfig.node.json`.

#### 11. `tsconfig.app.json`
* **Propósito:** Configuración de compilación específica para el código fuente de la app React.
* **Detalle:** Activa la resolución de paths usando alias (`@/*` -> `src/*`), previene la emisión de ficheros (`noEmit: true`), requiere tipado estricto y activa el chequeo contra variables no usadas.

#### 12. `tsconfig.node.json`
* **Propósito:** Configuración de TypeScript para la compilación de ficheros de configuración basados en Node como `vite.config.ts`.

#### 13. `vite.config.ts`
* **Propósito:** Configuración del empaquetador Vite.
* **Detalle:** Activa el plugin de React y define el alias de resolución `@` para simplificar importaciones relativas complejas.

---

### Directorio: `public/`

* **`favicon.svg`:** Icono identificativo de la aplicación mostrado en la pestaña del navegador.
* **`home-image-mus.png`:** Imagen promocional principal renderizada en la landing page.
* **`icons.svg`:** Hoja de sprites SVG reutilizables a nivel global (iconos del menú).
* **`Logo.png`:** Imagen de logotipo de Enbido con fondo transparente.
* **`Musica_fondo.mp3`:** Banda sonora acústica relajante que se reproduce como música de fondo del juego.
* **`robots.txt`:** Instrucciones de indexación para rastreadores de motores de búsqueda.
* **`sitemap.xml`:** Estructura jerárquica de URLs del sitio web para SEO.
* **`locales/en/common.json`, `locales/es/common.json`, `locales/eu/common.json`, `locales/fr/common.json`:** Archivos JSON de traducciones estáticas estructurados por parejas clave-valor correspondientes a los idiomas inglés, español, euskera y francés respectivamente.

---

### Directorio: `src/`

#### `src/main.tsx`
* **Propósito:** Punto de partida de la aplicación React. Inicializa la configuración de internacionalización (`i18n/config`) y monta el componente `<App />` dentro del nodo del DOM `root`.

### Directorio: `src/app/`

#### 14. `src/app/App.tsx`
* **Propósito:** Componente de arranque. Envuelve el árbol con `<AppProviders>` y monta el enrutador `<AppRouter>`.

#### 15. `src/app/providers.tsx`
* **Propósito:** Orquesta y anida los proveedores de contexto globales (Google Login, Auth, WebSocket, Chat, Settings).
* **Estado:** Envuelve las vistas e interactúa con los contextos transversales.

#### 16. `src/app/router.tsx`
* **Propósito:** Configura las URLs de la aplicación web y asocia a cada una el componente de página correspondiente utilizando React Router 7.
* **Dependencias:** `react-router-dom`.

---

### Directorio: `src/features/auth/`

#### 17. `src/features/auth/components/auth-forms.css`
* **Propósito:** Estilos visuales de los formularios de registro, login y doble factor.

#### 18. `src/features/auth/components/LoginForm.tsx`
* **Propósito:** Formulario de inicio de sesión manual y disparador del botón de Google OAuth.
* **Hooks:** `useLoginForm()`, `useTranslation()`.
* **Componentes Hijos:** `<GoogleLoginButton />`.

#### 19. `src/features/auth/components/PasswordStrength.tsx`
* **Propósito:** Evaluador visual en tiempo real de la fortaleza de la contraseña según políticas de seguridad.
* **Props:** `password` (string).
* **Validaciones:** Chequea presencia de mayúsculas, números, caracteres especiales y longitud.

#### 20. `src/features/auth/components/RegisterField.tsx`
* **Propósito:** Campo de entrada personalizado reutilizable en los formularios con control de errores dinámico.
* **Props:** `label`, `name`, `type`, `value`, `error`, `onChange`.

#### 21. `src/features/auth/components/RegisterForm.tsx`
* **Propósito:** Formulario interactivo para dar de alta nuevas cuentas.
* **Hooks:** `useRegisterForm()`.

#### 22. `src/features/auth/components/TwoFactorForm.tsx`
* **Propósito:** Formulario para introducir el código temporal (2FA) en caso de tener activada la seguridad de doble factor.
* **Props:** `onSubmit`, `onCancel`, `error`, `loading`.

#### 23. `src/features/auth/hooks/AuthContext.tsx`
* **Propósito:** Proveedor del contexto de seguridad de la aplicación. Carga el perfil activo al iniciar y gestiona login/logout.
* **Estado:** `user` (AuthUser | null), `isLoading` (boolean).
* **Efectos:** Registra un listener sobre el evento personalizado `'enbido_login'` para actualizar la información de perfil.

#### 24. `src/features/auth/hooks/useAuth.ts`
* **Propósito:** Hook utilitario para consumir rápidamente el estado de `AuthContext`.

#### 25. `src/features/auth/hooks/useLoginForm.ts`
* **Propósito:** Lógica de formulario de login (envío, estados de carga, manejo de errores de validación del backend).
* **Hooks:** `useState`, `useNavigate`, `useAuth`.

#### 26. `src/features/auth/hooks/useRegisterForm.ts`
* **Propósito:** Encapsula la lógica de validación, envío y registro de cuentas.
* **Validaciones:** Requiere mayoría de edad, coincidencia de passwords, formato de email correcto.

#### 27. `src/features/auth/types/login.ts`
* **Propósito:** Definición de interfaces para payloads de login.

#### 28. `src/features/auth/types/register.ts`
* **Propósito:** Interfaces TypeScript para envío de datos de registro.

#### 29. `src/features/auth/utils/registerValidation.ts`
* **Propósito:** Validaciones auxiliares de registro (longitudes, formatos, regex de email).

---

### Directorio: `src/features/chat/`

#### 30. `src/features/chat/components/global-chat.css`
* **Propósito:** Estilos CSS de las ventanas del chat global y directo.

#### 31. `src/features/chat/components/GlobalChatWindow.tsx`
* **Propósito:** Ventana flotante interactiva para chatear con la comunidad global o en canales privados 1 a 1.
* **Hooks:** `useChat()`, `useTranslation()`, `useEffect`, `useRef`.

#### 32. `src/features/chat/hooks/ChatContext.tsx`
* **Propósito:** Gestión de estado de mensajes, hilos directos activos y mensajes no leídos.
* **Estado:** Lista de chats directos, mensajes en cola por cada chat, recuento de alertas.

#### 33. `src/features/chat/hooks/ChatWebSocketContext.tsx`
* **Propósito:** Establece y reconecta la conexión WebSocket en el endpoint `/ws-chat` para mensajería y estados de presencia (Online/Offline) de amigos.
* **Efectos:** Gestiona reintentos de conexión exponencial e inyecta la sesión HttpOnly del usuario.

---

### Directorio: `src/features/game/`

#### 34. `src/features/game/components/ActionPanel.tsx`
* **Propósito:** Muestra los botones de decisión del Mus de forma condicional al turno activo (Ej: *Mus, Paso, Envido, Órdago, Quiero, No Quiero, Descarte*).
* **Props:** `actions` (acciones válidas), `onActionClick` (callback).

#### 35. `src/features/game/components/GameConsoleLogs.tsx`
* **Propósito:** Panel interactivo que lista en orden cronológico todas las fases, descartes y apuestas ocurridas en la mesa.
* **Props:** `logs` (array de mensajes).

#### 36. `src/features/game/components/GameScoreBoard.tsx`
* **Propósito:** Panel informativo que muestra los chicos ganados de la partida (marcador de 40 amarracos).

#### 37. `src/features/game/components/LeaderboardModal.tsx`
* **Propósito:** Modal que lista el ranking de jugadores por ELO y monedas acumuladas.
* **Hooks:** `useLeaderboard()`.

#### 38. `src/features/game/components/lobby-waiting-room.css`
* **Propósito:** Estilos de la sala pre-partida privada.

#### 39. `src/features/game/components/LobbyWaitingRoom.tsx`
* **Propósito:** Sala pre-partida de salas de juego privadas. Permite agregar bots en asientos vacíos y configurar el juego.
* **Hooks:** `useLobbyProfile()`.

#### 40. `src/features/game/components/MatchmakingPanel.tsx`
* **Propósito:** Panel para unirse a colas competitivas de emparejamiento.
* **Props:** `onJoinQueue`, `onLeaveQueue`, `isSearching`, `queueSize`.

#### 41. `src/features/game/components/mus-game.css`
* **Propósito:** Estructuración visual del tablero de Mus 2D/3D. Animación de giros de cartas y visualización de amarracos en la mesa.

#### 42. `src/features/game/components/MusGamePage.tsx`
* **Propósito:** Orquestador principal de la pestaña de Mus. Muestra el Lobby Premium si el jugador busca sala, o renderiza el tablero interactivo en partida.
* **Hooks:** `useMusGame()`, `useSettings()`.

#### 43. `src/features/game/components/OrientationOverlay.tsx`
* **Propósito:** Bloquea el uso de la pantalla del juego en móviles si no se encuentra en posición apaisada (horizontal).
* **Hooks:** `useOrientation()`.

#### 44. `src/features/game/components/PlayerHand.tsx`
* **Propósito:** Renderiza las 4 cartas del usuario y maneja la selección para realizar descartes lógicos.
* **Props:** `cards`, `canDiscard`, `onSendDiscard`.

#### 45. `src/features/game/components/PlayerPosition.tsx`
* **Propósito:** Representa visualmente la mesa de juego circular posicionando los jugadores según su asiento.
* **Props:** `seatInfo`, `isActiveTurn`, `dealerIdx`, `speechBubble`.

#### 46. `src/features/game/components/premium-lobby.css`
* **Propósito:** Estilos CSS de las secciones del panel del Lobby Premium.

#### 47. `src/features/game/components/PremiumLobby.tsx`
* **Propósito:** Panel principal del juego donde el jugador decide entre buscar emparejamiento ELO, crear sala de juego privada, o gestionar torneos virtuales.
* **Hooks:** `useLobbyProfile()`, `useTranslation()`.

#### 48. `src/features/game/components/PrivateRoomsPanel.tsx`
* **Propósito:** Interfaz interactiva para ingresar códigos alfanuméricos de salas privadas.
* **Props:** `onCreateRoom`, `onJoinRoom`.

#### 49. `src/features/game/components/ProfilePreviewModal.tsx`
* **Propósito:** Modal flotante con el detalle de las estadísticas de otro jugador (Eficacia, partidas, ELO, victorias).

#### 50. `src/features/game/components/RoundTransitionOverlay.tsx`
* **Propósito:** Capa animada que se muestra entre lances para revelar las cartas reales de la mesa y sumar amarracos.
* **Props:** `transitionData`, `countdown`.

#### 51. `src/features/game/components/RulesModal.tsx`
* **Propósito:** Manual explicativo de reglas del juego y valor de las jugadas.

#### 52. `src/features/game/components/SocialPanel.tsx`
* **Propósito:** Pestaña de amigos del lobby para enviar invitaciones, añadir por nickname y ver estado de conexión.
* **Hooks:** `useSocialPanel()`.

#### 53. `src/features/game/components/TimerCircle.tsx`
* **Propósito:** Temporizador animado en SVG para alertar sobre la fecha límite de toma de decisiones (10 segundos por turno).

#### 54. `src/features/game/components/TournamentCreateModal.tsx`
* **Propósito:** Formulario interactivo para que organizadores creen eventos y copas virtuales de Mus.

#### 55. `src/features/game/components/TournamentDetailModal.tsx`
* **Propósito:** Muestra los brackets en árbol visual interactivo de los torneos activos.

#### 56. `src/features/game/components/TournamentSection.tsx`
* **Propósito:** Sección del lobby que lista y actualiza los torneos virtuales activos.
* **Hooks:** `useTournamentLobby()`.

#### 57. `src/features/game/components/WelcomeHeader.tsx`
* **Propósito:** Cabecera de bienvenida con avatares, monedas del usuario y saldo rápido de nivel.

#### 58. `src/features/game/domain/lobby.types.ts`
* **Propósito:** Definición de tipos de datos lógicos para el lobby y las salas de juego.

#### 59. `src/features/game/helpers/musEngineHelpers.ts`
* **Propósito:** Métodos utilitarios para determinar el sentido de juego de turnos y resolver de forma ágil el pintado de cartas en el cliente.

#### 60. `src/features/game/hooks/useGameApi.ts`
* **Propósito:** Encapsula las solicitudes al servidor Spring Boot relacionadas con la creación de salas, emparejamientos y altas.

#### 61. `src/features/game/hooks/useGameAudio.ts`
* **Propósito:** Reproduce efectos de sonidos de cartas, amarracos sobre la mesa e interacciones del Mus.

#### 62. `src/features/game/hooks/useGameChat.ts`
* **Propósito:** Gestiona el historial de mensajes de texto intercambiados exclusivamente dentro de la partida de cartas.

#### 63. `src/features/game/hooks/useGameOver.ts`
* **Propósito:** Lógica de redirección y finalización de mesa cuando un equipo alcanza la puntuación límite del chico.

#### 64. `src/features/game/hooks/useLeaderboard.ts`
* **Propósito:** Hook para cargar y paginar el listado general del ranking de ELO de la base de datos.

#### 65. `src/features/game/hooks/useLobbyProfile.ts`
* **Propósito:** Sincroniza datos del perfil del usuario durante su estancia en los menús de emparejamiento.

#### 66. `src/features/game/hooks/useMusActions.ts`
* **Propósito:** Lógica para estructurar las decisiones del jugador y enviarlas en frames formateados JSON a través del WebSocket.

#### 67. `src/features/game/hooks/useMusGame.ts`
* **Propósito:** Orquestador principal de estado. Controla las variables de fases de apuesta y sincroniza audios.

#### 68. `src/features/game/hooks/useMusGameState.ts`
* **Propósito:** Estructura inicial y gestión de hooks para sincronizar las posiciones e inventarios de cartas del tablero.

#### 69. `src/features/game/hooks/useMusWebSocket.ts`
* **Propósito:** Lógica de conexión y suscripción sobre `/ws-mus`. Recibe payloads de `ROOM_STATE`, `QUEUEING`, `MUS_SIGN`, y `MATCHED` para mapear el juego.

#### 70. `src/features/game/hooks/useOrientation.ts`
* **Propósito:** Escucha cambios en el layout de pantalla táctil y de ventana del navegador.

#### 71. `src/features/game/hooks/useSocialPanel.ts`
* **Propósito:** Operaciones del panel de amigos (solicitudes, bloqueo, aceptar).

#### 72. `src/features/game/hooks/useTournamentLobby.ts`
* **Propósito:** Gestión y registro de torneos competitivos virtuales del backend.

#### 73. `src/features/game/types/MusGame.ts`
* **Propósito:** Tipos de TypeScript e interfaces para la mesa de Mus (apuestas, lances, chicos, estados).

#### 74. `src/features/game/utils/gameAudio.ts`
* **Propósito:** Utilidades de carga de archivos MP3 para alertas y avisos sonoros.

#### 75. `src/features/game/utils/signs.ts`
* **Propósito:** Catálogo de señas permitidas (Reyes -> morder labio inferior, Duples -> levantar cejas, etc.) mapeadas para representarlas visualmente.

---

### Directorio: `src/features/meetup/`

#### 76. `src/features/meetup/components/card/MeetupCardActions.tsx`
* **Propósito:** Botones para solicitar plaza, desapuntarse o cancelar un anuncio presencial.
* **Props:** `ad`, `currentUserId`, `onStatusChange`, `isAuthenticated`.

#### 77. `src/features/meetup/components/card/MeetupCardChat.tsx`
* **Propósito:** Mini-chat integrado para los participantes de una quedada presencial confirmada.
* **Hooks:** `useState`, `useEffect`.

#### 78. `src/features/meetup/components/card/MeetupCardHeader.tsx`
* **Propósito:** Encabezado con datos del bar, horario del evento y un botón para ampliar el mapa interactivo.

#### 79. `src/features/meetup/components/create-ad-page.css`
* **Propósito:** Estilos CSS para el layout y formularios de publicación de anuncios.

#### 80. `src/features/meetup/components/CreateAdPage.tsx`
* **Propósito:** Formulario para publicar anuncios de Mus en bares/sociedades, integrando geolocalización manual.
* **Hooks:** `useState`, `useNavigate`, `useTranslation`.

#### 81. `src/features/meetup/components/meetup-ad-card.css`
* **Propósito:** Maquetación de tarjetas individuales de encuentros.

#### 82. `src/features/meetup/components/MeetupAdCard.tsx`
* **Propósito:** Componente de tarjeta de encuentro presencial. Integra participantes inscritos y el mini-chat de coordinación.

#### 83. `src/features/meetup/components/MeetupFilters.tsx`
* **Propósito:** Controles de búsqueda para filtrar quedadas por distancia, ciudad o tipo de establecimiento.

#### 84. `src/features/meetup/components/MeetupListView.tsx`
* **Propósito:** Listado ordenado de los anuncios de quedadas disponibles según los filtros.

#### 85. `src/features/meetup/components/meetup-map.css`
* **Propósito:** Estilos del contendor interactivo de Leaflet y marcadores personalizados.

#### 86. `src/features/meetup/components/meetup-page.css`
* **Propósito:** Estilos globales del panel de encuentros de la comunidad de Mus.

#### 87. `src/features/meetup/components/MeetupPage.tsx`
* **Propósito:** Buscador interactivo de quedadas locales. Integra Leaflet y OpenStreetMap.
* **Hooks:** `useMeetupMap()`, `useMeetupData()`.

#### 88. `src/features/meetup/hooks/useMeetupCard.ts`
* **Propósito:** Encapsula llamadas a endpoints REST para unirse o desapuntarse de encuentros presenciales.

#### 89. `src/features/meetup/hooks/useMeetupData.ts`
* **Propósito:** Gestiona la carga de la colección de quedadas desde `/api/local-meetup-ad`.

#### 90. `src/features/meetup/hooks/useMeetupMap.ts`
* **Propósito:** Lógica de inicialización y actualización de pines geográficos en Leaflet.

#### 91. `src/features/meetup/types/LocalMeetup.ts`
* **Propósito:** Interfaces TypeScript para la entidad de anuncios presenciales de Mus.

#### 92. `src/features/meetup/types/MeetupRequest.ts`
* **Propósito:** Modelos de datos para solicitudes de participación en quedadas.

#### 93. `src/features/meetup/types/MeetupTypes.ts`
* **Propósito:** Enums y tipos de datos generales de meetups (bar, centro cívico, sociedad).

#### 94. `src/features/meetup/utils/meetupFormatters.ts`
* **Propósito:** Formateadores de distancias (Km) y fechas con soporte multiidioma.

---

### Directorio: `src/features/shop/`

#### 95. `src/features/shop/components/Coinicon.tsx`
* **Propósito:** Icono SVG animado de moneda virtual.

#### 96. `src/features/shop/components/shop-page.css`
* **Propósito:** Estilos CSS de la tienda de cosméticos (cuadrícula, animaciones al comprar).

#### 97. `src/features/shop/components/ShopCard.tsx`
* **Propósito:** Tarjeta de artículo de la tienda (avatares, reversos de cartas, alias).
* **Props:** `item`, `onAction`, `isOwned`, `isEquipped`, `canAfford`.

#### 98. `src/features/shop/components/ShopGrid.tsx`
* **Propósito:** Contenedor de la cuadrícula de artículos.

#### 99. `src/features/shop/components/ShopHero.tsx`
* **Propósito:** Cabecera promocional y estilizada de la tienda.

#### 100. `src/features/shop/components/ShopLoading.tsx`
* **Propósito:** Skeleton animado de carga para una UX fluida durante la consulta.

#### 101. `src/features/shop/components/ShopPage.tsx`
* **Propósito:** Vista general de la tienda de cosméticos de cartas y avatares.
* **Hooks:** `useShopData()`, `useTranslation()`.

#### 102. `src/features/shop/components/ShopSummary.tsx`
* **Propósito:** Panel flotante que muestra el saldo del jugador actual.

#### 103. `src/features/shop/components/ShopToast.tsx`
* **Propósito:** Toast flotante con notificaciones rápidas al comprar o equipar ítems.

#### 104. `src/features/shop/components/ShopToolbar.tsx`
* **Propósito:** Controles de filtrado de cosméticos por categoría (Todos, Avatares, Cartas, Alias).

#### 105. `src/features/shop/hooks/useShopData.ts`
* **Propósito:** Lógica de comunicación con `/api/shop` para transacciones de ítems y equipamiento de cosméticos.
* **Hooks:** `useState`, `useEffect`, `useAuth`.

#### 106. `src/features/shop/types/shop.ts`
* **Propósito:** Interfaces TypeScript de ítems de la tienda.

---

### Directorio: `src/features/tournament/`

#### 107. `src/features/tournament/components/PublishForm.tsx`
* **Propósito:** Formulario para que organizadores publiquen torneos presenciales.

#### 108. `src/features/tournament/components/PublishFormFields.tsx`
* **Propósito:** Inputs requeridos (Nombre, Premios, Localización física, Fecha).

#### 109. `src/features/tournament/components/tournament.css`
* **Propósito:** Estilos CSS de las vistas de torneos presenciales.

#### 110. `src/features/tournament/components/TournamentCard.tsx`
* **Propósito:** Tarjeta con detalles del torneo presencial.
* **Props:** `tournament`, `onClick`.

#### 111. `src/features/tournament/components/TournamentList.tsx`
* **Propósito:** Listado que renderiza los torneos presenciales disponibles.

#### 112. `src/features/tournament/components/TournamentPage.tsx`
* **Propósito:** Panel de torneos físicos con mapa e información de contacto del club organizador.
* **Hooks:** `useSeo()`.

#### 113. `src/features/tournament/constants.ts`
* **Propósito:** Constantes lógicas (estados de torneos, categorías de juego).

#### 114. `src/features/tournament/types/tournament.ts`
* **Propósito:** Tipos de TypeScript de torneos físicos y presenciales.

---

### Directorio: `src/i18n/`

#### 115. `src/i18n/config.ts`
* **Propósito:** Configuración de `react-i18next`. Inicializa el detector de idioma y el fallback predeterminado a español (`es`).
* **Idiomas:** `es` (Español), `en` (Inglés), `fr` (Francés), `eu` (Euskera).

#### 116. `src/i18n/LanguageSwitcher.css`
* **Propósito:** CSS del selector de idioma (dropdown y botones de banderas).

#### 117. `src/i18n/LanguageSwitcher.tsx`
* **Propósito:** Selector interactivo de idioma en la barra superior.
* **Hooks:** `useTranslation()`.

---

### Directorio: `src/pages/`

#### 118. `src/pages/AccountPage/AccountPage.tsx`
* **Propósito:** Página de configuración del perfil del usuario.
* **Componentes Hijos:** `<AccountSettingsForm />`.

#### 119. `src/pages/AccountPage/components/AccountSettingsForm.tsx`
* **Propósito:** Formulario para cambiar contraseñas, habilitar 2FA y subir nuevas imágenes de avatar.
* **Hooks:** `useAccountData()`, `useFormValidation()`.

#### 120. `src/pages/AccountPage/hooks/useAccountData.ts`
* **Propósito:** Lógica de actualización de datos de la cuenta de usuario.

#### 121. `src/pages/AccountPage/styles/account-page.css`
* **Propósito:** Estilos de la configuración de cuenta.

#### 122. `src/pages/AdminPage/AdminPage.css`
* **Propósito:** Estilos CSS de las vistas de administración.

#### 123. `src/pages/AdminPage/AdminPage.tsx`
* **Propósito:** Página de administración protegida (sólo rol `admin`). Permite ver estadísticas del servidor y moderar torneos/usuarios.
* **Hooks:** `useAuth()`.

#### 124. `src/pages/AdminPage/components/AdminStats.tsx`
* **Propósito:** Indicadores de volumen de salas activas y usuarios en línea.

#### 125. `src/pages/AdminPage/components/AdminTournaments.tsx`
* **Propósito:** Panel para que moderadores auditen e inicien de forma manual torneos virtuales o presenciales.

#### 126. `src/pages/AdminPage/components/AdminUsers.tsx`
* **Propósito:** Herramientas para buscar y bloquear/desbloquear cuentas de usuario.

#### 127. `src/pages/HomePage/components/HomeIcons.tsx`
* **Propósito:** SVG decorativos de cartas para la landing page.

#### 128. `src/pages/HomePage/homepage.css`
* **Propósito:** CSS de la landing page (efecto de degradado, tipografías e imágenes responsivas).

#### 129. `src/pages/HomePage/HomePage.tsx`
* **Propósito:** Página de inicio promocional de Enbido con enlaces directos para jugar.

#### 130. `src/pages/LoginPage/components/BackgroundCards.tsx`
* **Propósito:** Animación decorativa de fondo con cartas flotantes en el formulario de login.

#### 131. `src/pages/LoginPage/components/BottomFeatures.tsx`
* **Propósito:** Iconografía inferior que promociona las salas competitivas y la mensajería del juego.

#### 132. `src/pages/LoginPage/components/CardLogo.tsx`
* **Propósito:** Logotipo del juego centrado para las vistas de acceso.

#### 133. `src/pages/LoginPage/components/ChatPanel.tsx`
* **Propósito:** Interfaz de mensajería instantánea empotrada en el panel lateral.

#### 134. `src/pages/LoginPage/components/ChatWidget.tsx`
* **Propósito:** Burbuja flotante de chat rápido.

#### 135. `src/pages/LoginPage/components/CreateUserCard.tsx`
* **Propósito:** Tarjeta que envuelve el formulario de registro.

#### 136. `src/pages/LoginPage/components/CreateUserForm.tsx`
* **Propósito:** Formulario para registrarse desde la landing de login.

#### 137. `src/pages/LoginPage/components/GoogleLoginButton.tsx`
* **Propósito:** Botón de inicio con Google OAuth2.

#### 138. `src/pages/LoginPage/components/LoginCard.tsx`
* **Propósito:** Tarjeta que envuelve el formulario de inicio de sesión manual.

#### 139. `src/pages/LoginPage/components/LoginForm.tsx`
* **Propósito:** Formulario de credenciales clásicas.

#### 140. `src/pages/LoginPage/components/RecoverPasswordCard.tsx`
* **Propósito:** Formulario para solicitar el envío de un enlace de recuperación de contraseña al correo electrónico.

#### 141. `src/pages/LoginPage/components/SocialDivider.tsx`
* **Propósito:** Separador visual entre el login clásico y la opción de Google OAuth.

#### 142. `src/pages/LoginPage/login-page.css`
* **Propósito:** Layout de la página de Login.

#### 143. `src/pages/LoginPage/LoginPage.tsx`
* **Propósito:** Página de acceso principal (Login / Registro / Recuperación).
* **Hooks:** `useAuth()`.

#### 144. `src/pages/LoginPage/styles/background-cards.css`
* **Propósito:** Estilos CSS de las cartas decorativas en cascada.

#### 145. `src/pages/LoginPage/styles/bottom-features.css`
* **Propósito:** Estilos para las leyendas descriptivas inferiores.

#### 146. `src/pages/LoginPage/styles/card-logo.css`
* **Propósito:** Estilos para los logotipos superiores.

#### 147. `src/pages/LoginPage/styles/chat-panel.css`
* **Propósito:** Estilos del panel de mensajería lateral.

#### 148. `src/pages/LoginPage/styles/chat-widget.css`
* **Propósito:** Estilos de la burbuja flotante del chat.

#### 149. `src/pages/LoginPage/styles/login-card.css`
* **Propósito:** Animaciones y sombras para las tarjetas del login.

#### 150. `src/pages/LoginPage/styles/login-form.css`
* **Propósito:** Estilos para las cajas de texto y botones de acceso.

#### 151. `src/pages/LoginPage/styles/social-divider.css`
* **Propósito:** Estilos del separador social.

#### 152. `src/pages/ProfilePage/components/BackgroundCards.tsx`
* **Propósito:** Fondo animado con cartas para la vista de estadísticas de perfil.

#### 153. `src/pages/ProfilePage/components/ChatWidget.tsx`
* **Propósito:** Integra la mensajería privada directa en la vista de perfil.

#### 154. `src/pages/ProfilePage/components/ProfileCard.tsx`
* **Propósito:** Muestra la información del usuario (avatar, nivel, medallas de torneos).

#### 155. `src/pages/ProfilePage/components/ProfileHeader.tsx`
* **Propósito:** Encabezado con foto de perfil, reputación y victorias.

#### 156. `src/pages/ProfilePage/components/StatsGrid.tsx`
* **Propósito:** Grid de estadísticas detalladas (partidas jugadas, ganadas, ELO y monedas acumuladas).

#### 157. `src/pages/ProfilePage/ProfilePage.tsx`
* **Propósito:** Página de perfil del usuario logueado.

#### 158. `src/pages/ProfilePage/styles/background-cards.css`
* **Propósito:** Estilos de cartas decorativas para el perfil.

#### 159. `src/pages/ProfilePage/styles/profile-card.css`
* **Propósito:** Estilos del contenedor de perfil.

#### 160. `src/pages/ProfilePage/styles/profile-header.css`
* **Propósito:** CSS de cabeceras de estadísticas.

#### 161. `src/pages/ProfilePage/styles/profile-page.css`
* **Propósito:** Layout general del perfil.

#### 162. `src/pages/ProfilePage/styles/stats-grid.css`
* **Propósito:** CSS para la visualización del grid de victorias y derrotas.

#### 163. `src/pages/ResetPasswordPage/reset-password.css`
* **Propósito:** CSS de la vista de reseteo.

#### 164. `src/pages/ResetPasswordPage/ResetPasswordPage.tsx`
* **Propósito:** Página para introducir la nueva contraseña validando el token de recuperación de la URL.
* **Hooks:** `useFormValidation()`.

#### 165. `src/pages/RulesPage/rules.css`
* **Propósito:** CSS de la página de reglas.

#### 166. `src/pages/RulesPage/RulesPage.tsx`
* **Propósito:** Página estática e informativa de las señas y lances del Mus.

---

### Directorio: `src/shared/`

#### 167. `src/shared/components/layout/AgeModal.tsx`
* **Propósito:** Modal de advertencia legal que exige confirmar la mayoría de edad (mayor de 18 años) al registrarse.
* **Props:** `onConfirm`, `onCancel`.

#### 168. `src/shared/components/layout/game-over-modal.css`
* **Propósito:** CSS del panel final de la partida.

#### 169. `src/shared/components/layout/GameOverModal.tsx`
* **Propósito:** Modal emergente que se muestra al finalizar una partida de Mus, resumiendo el resultado, cambios de ELO y monedas acumuladas.
* **Props:** `score`, `onClose`.

#### 170. `src/shared/components/layout/MobileDrawer.tsx`
* **Propósito:** Panel desplegable de navegación lateral adaptado para dispositivos móviles.

#### 171. `src/shared/components/layout/navbar.css`
* **Propósito:** Estilos para la barra fija superior de navegación.

#### 172. `src/shared/components/layout/Navbar.tsx`
* **Propósito:** Barra superior con logotipo, selector de idiomas y dropdown de perfil del usuario.
* **Hooks:** `useNavbar()`.

#### 173. `src/shared/components/layout/NavbarIcons.tsx`
* **Propósito:** Sprites SVG para los elementos de navegación.

#### 174. `src/shared/components/layout/navbarTypes.ts`
* **Propósito:** Tipos TypeScript de opciones del menú superior.

#### 175. `src/shared/components/layout/NavLinks.tsx`
* **Propósito:** Generador de enlaces lógicos del menú superior.

#### 176. `src/shared/components/layout/SettingsModal.tsx`
* **Propósito:** Modal emergente para ajustar el volumen de sonido, volumen de música, alertas de voz y cambio de vista 2D/3D.
* **Hooks:** `useSettings()`.

#### 177. `src/shared/components/layout/useNavbar.ts`
* **Propósito:** Lógica de navegación y control de despliegue del modal de edad.

#### 178. `src/shared/components/layout/UserDropdown.tsx`
* **Propósito:** Menú flotante con atajos del perfil del usuario (Ver estadísticas, mi cuenta, desconectar).

#### 179. `src/shared/components/ui/button.css`
* **Propósito:** CSS de botones con soporte de variantes (danger, secondary, primary).

#### 180. `src/shared/components/ui/Button.tsx`
* **Propósito:** Componente de botón reutilizable con prevención de doble click y estados de carga (`isLoading`).
* **Props:** `type`, `variant`, `disabled`, `isLoading`, `onClick`.

#### 181. `src/shared/components/ui/FileInput.tsx`
* **Propósito:** Input para la subida de avatares con previsualización local e instantánea.
* **Props:** `onChange`, `previewUrl`.

#### 182. `src/shared/components/ui/ImageModal.tsx`
* **Propósito:** Modal simple para ampliar imágenes o carteles de torneos.

#### 183. `src/shared/components/ui/RadioGroup.tsx`
* **Propósito:** Inputs univariantes interactivos.

#### 184. `src/shared/components/ui/TextInput.tsx`
* **Propósito:** Input de texto personalizado con validación y visualización del mensaje de error inferior.
* **Props:** `label`, `name`, `type`, `value`, `error`, `onChange`.

#### 185. `src/shared/components/ui/UsuariosList.tsx`
* **Propósito:** Componente para buscar, filtrar y listar usuarios.

#### 186. `src/shared/hooks/settings/NotificationToast.tsx`
* **Propósito:** Toast flotante con notificaciones rápidas al usuario.

#### 187. `src/shared/hooks/settings/useSettingsAudio.ts`
* **Propósito:** Hook para reproducir archivos multimedia de música interactuando con los niveles de volumen y activaciones configuradas en `SettingsContext`.

#### 188. `src/shared/hooks/settings/useSettingsNotifications.ts`
* **Propósito:** Lógica de Toasts reactivos para disparar alertas auditivas y visuales.

#### 189. `src/shared/hooks/SettingsContext.tsx`
* **Propósito:** Contexto que almacena los valores de configuración de audio, volumen de sonido y persistencia automática en el navegador.

#### 190. `src/shared/hooks/useFormValidation.ts`
* **Propósito:** Custom hook para validar campos de formularios en tiempo real.

#### 191. `src/shared/hooks/usePasswordValidation.ts`
* **Propósito:** Evaluador de contraseñas de seguridad.

#### 192. `src/shared/hooks/useSeo.tsx`
* **Propósito:** Inyecta etiquetas de metadatos SEO en el `<head>` del DOM (título, descripción, canonical).

#### 193. `src/shared/hooks/useUsuarios.tsx`
* **Propósito:** Lógica para buscar usuarios de la base de datos REST.

#### 194. `src/shared/lib/api.ts`
* **Propósito:** Configuración centralizada de Axios. Define interceptores de peticiones para inyectar automáticamente cookies y capturar errores de red (como 401).

#### 195. `src/shared/styles/components.css`
* **Propósito:** Estilos CSS de componentes comunes (tarjetas, botones genéricos).

#### 196. `src/shared/styles/forms.css`
* **Propósito:** Maquetación estándar para inputs, textareas y labels.

#### 197. `src/shared/styles/index.css`
* **Propósito:** Estilos base globales del navegador y reseteos.

#### 198. `src/shared/styles/layout.css`
* **Propósito:** Reglas de maquetación (Flexbox, Grid) y envoltorios de páginas principales.

#### 199. `src/shared/styles/variables.css`
* **Propósito:** Declaración de variables de Vanilla CSS (colores primarios, tipografía, bordes y transiciones).

#### 200. `src/shared/types/User.ts`
* **Propósito:** Interfaces TypeScript correspondientes al usuario.

---

## 5. Flujos de Negocio Detallados

### Registro de Usuario

```text
 1. Formulario (<RegisterForm />) valida inputs en tiempo real.
 2. Comprobación de fortaleza de contraseña mediante usePasswordValidation.ts.
 3. Comprobación de edad: debe ser mayor de 18 años.
 4. Envío de datos mediante POST /usuarios/register (con api.ts).
 5. Éxito -> Redirección a /login para acceder.
 6. Fallo -> Renderizado del error en campos o modal explicativo.
```

### Inicio de Sesión (Login)

```text
 1. El usuario introduce email y contraseña (o usa Google Login).
 2. Llamada REST mediante api.post('/usuarios/login', ...).
 3. El backend valida credenciales y escribe cookies HTTP con el token.
 4. Se emite un evento personalizado 'enbido_login' en el navegador.
 5. AuthContext captura el evento, refresca el perfil (/usuarios/me).
 6. Redirección final del usuario al lobby de juego (/jugar).
```

### Flujo de Partida de Mus (Real-Time)

```text
 1. Usuario entra a emparejamiento o sala privada.
 2. Establecimiento de WebSocket en /ws-mus mediante useMusWebSocket.ts.
 3. Backend envía frame ROOM_STATE con las cartas y el turno inicial.
 4. El tablero se dibuja interactivamente en MusGamePage.tsx.
 5. En su turno, el jugador usa ActionPanel.tsx para decidir (Envido, Paso, etc.).
 6. Las acciones viajan por el WebSocket; el backend recalcula y responde.
 7. Al acabar el chico, se muestra GameOverModal.tsx actualizando ELO.
```

---

## 6. Configuración y Dependencias

### Análisis de `package.json`

* **`react` & `react-dom` (v19.2):** Librería núcleo para el renderizado declarativo de la interfaz y control de vistas.
* **`axios` (v1.6):** Cliente HTTP con soporte de promesas e interceptores para inyectar cookies.
* **`react-router-dom` (v7.1):** Enrutador del lado de cliente para transiciones fluidas entre páginas sin recarga.
* **`i18next` & `react-i18next` (v17+):** Sistema de internacionalización para traducciones de textos en tiempo real.
* **`leaflet` & `@types/leaflet` (v1.9):** Librería cartográfica interactiva y marcadores geográficos en la sección de quedadas.
* **`@react-oauth/google` (v0.13):** Integra el flujo OAuth2 de Google para inicios de sesión sociales de forma segura.
* **`lucide-react` (v1.17):** Biblioteca de iconos vectoriales ligeros en formato SVG.

### Análisis de `tsconfig.app.json` (TypeScript)

* **`target: es2023`:** Indica que el código de salida usará especificaciones modernas de ECMAScript.
* **`moduleResolution: bundler`:** Optimiza la resolución de dependencias delegándolas al empaquetador Vite.
* **`noEmit: true`:** Desactiva la escritura de ficheros compilados desde TypeScript (Vite realiza la transpilación final).
* **`strict: true` / `noImplicitAny: true`:** Obliga a tipar estrictamente el código, prohibiendo variables implícitas de tipo `any` para evitar fallos de ejecución.

### Configuración del Proxy en Vite (`vite.config.ts`)

* **Aliases de resolución:** Permite importar archivos con `@/` haciendo referencia a la carpeta `src/`.
* **Servidor Local:** Vite compila de forma asíncrona usando Rolldown (Vite 8), ofreciendo recarga en caliente de componentes.

---

## 7. Gestión de Estado

La aplicación distribuye sus estados lógicos en 3 niveles de jerarquía:

```text
 ┌────────────────────────────────────────────────────────┐
 │ Estado Global de Aplicación (App Scope)                │
 │ - AuthContext (Sesión de usuario y datos de perfil)    │
 │ - SettingsContext (Preferencias de volumen y audio)    │
 └──────────────────────────┬─────────────────────────────┘
                            │ Consume
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Estado de Característica (Feature Scope)                │
 │ - ChatContext (Mensajería directa e historial)         │
 │ - useMusGameState (Tablero de cartas, turnos y lances) │
 └──────────────────────────┬─────────────────────────────┘
                            │ Consume
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Estado Local del Componente (Component Scope)          │
 │ - useState (Entradas de texto de formularios, sliders) │
 │ - useFormValidation (Errores y validez del formulario) │
 └────────────────────────────────────────────────────────┘
```

* **Persistencia:** Las configuraciones del usuario en `SettingsContext` (como volumen del juego o idioma) se guardan automáticamente en el `localStorage` del navegador bajo la clave `enbido_settings`. Las credenciales de sesión se asocian de forma segura al dominio mediante cookies HttpOnly controladas por el servidor.

---

## 8. Comunicación con el Backend

El canal HTTP se centraliza en `src/shared/lib/api.ts`.

```typescript
// Configuración de la instancia base de Axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial para la transferencia automática de cookies de sesión
});
```

### Políticas de Manejo de Errores de Red

* **Semáforo de refresco:** Si se detecta un error `401 Unauthorized`, las peticiones adicionales se encolan mientras se solicita `/auth/refresh`. Si la renovación del token es exitosa, las peticiones en cola se reintentan de forma transparente para el usuario.
* **Timeout:** Peticiones limitadas a 10 segundos para prevenir bloqueos por hilos suspendidos en el cliente.
* **Estado de Carga (Loading State):** Encapsulado en los hooks de llamadas (`isLoading`) para desactivar controles (`disabled`) en la UI y evitar envíos duplicados de payloads.

---

## 9. Seguridad Frontend

1. **Saneamiento de Entradas (Prevención de XSS):** React escapa de forma predeterminada todos los valores inyectados en el código JSX. Evitamos intencionadamente el uso de directivas vulnerables como `dangerouslySetInnerHTML`.
2. **Uso Seguro de Variables de Entorno:** Las variables públicas necesarias en tiempo de ejecución (como Google Client ID) se declaran con el prefijo `VITE_` y son compiladas. Las credenciales de la API no se exponen al frontend.
3. **Control de CORS (Cross-Origin Resource Sharing):** Las cookies tienen directivas `SameSite=Strict` y `Secure`. En desarrollo, el proxy de Vite soluciona el intercambio; en producción, Nginx mapea `/api` y el backend convalida los orígenes permitidos.
4. **Validaciones en Dos Capas (Cliente vs Servidor):**
   * *Cliente (UX):* Validaciones rápidas con regex de correo, contraseñas robustas y edad mínima en tiempo real.
   * *Servidor (Seguridad):* El backend de Spring Boot realiza de nuevo las comprobaciones con Jakarta Validation antes de persistir la información.

---

## 10. Internacionalización (i18n)

* **Idiomas Soportados:** Español (`es`), Inglés (`en`), Francés (`fr`), Euskera (`eu`).
* **Detección Automática:** Utiliza `i18next-browser-languagedetector` para leer las preferencias idiomáticas del navegador del usuario al iniciar la carga.
* **Estructura de Directorios:** Las traducciones se cargan diferidamente (lazy loading) desde archivos JSON estáticos estruturados por idioma:
  * `/public/locales/es/common.json`
  * `/public/locales/en/common.json`
  * `/public/locales/fr/common.json`
  * `/public/locales/eu/common.json`
* ** runtime Switcher:** El componente `<LanguageSwitcher />` permite alternar el idioma de forma fluida a través de `i18n.changeLanguage(code)`.

---

## 11. Manejo de Errores y UI Feedback

* **Feedback de Errores en Formularios:** Los errores de validación se muestran inmediatamente bajo los campos utilizando `<TextInput />` con clases CSS rojas llamativas.
* **Feedback de Carga (Loading Feedback):** Implementación de skeletons en la tienda (`<ShopLoading />`) y de spinners dinámicos en los botones (`<Button isLoading={...} />`).
* **Error Boundaries:** Los componentes capturan fallos inesperados de renderizado evitando la caída completa de la SPA.
* **Logs del Sistema:** Las advertencias críticas de WebSockets o errores de carga de la API se registran de forma ordenada en consola utilizando la API `console` indicando contexto y marcas de tiempo.

---

## 12. Testing

El proyecto frontend utiliza un enfoque de pruebas en dos niveles para garantizar la estabilidad del software:

1. **Pruebas Unitarias (Vitest):**
   * Ejecutadas mediante el comando `npm run test` localmente.
   * Validan de forma aislada componentes y hooks de utilidades como la fuerza de contraseña (`usePasswordValidation.ts`), cálculos de formularios y el enrutamiento.
2. **Pruebas de Integración y E2E (Cypress):**
   * Automatizadas dentro del directorio `frontend/cypress/`.
   * Simulan interacciones completas de jugadores: registro de usuarios, login, creación y unión a salas de juego de Mus, descarte de cartas y flujo de puntuación de la mano.
   * *Mocking:* Se simulan las respuestas de la API del servidor y las conexiones WebSocket mediante interceptores de Cypress para garantizar pruebas deterministas.

---

## 13. Estilos y Diseño

### Sistema de Diseño (Variables CSS)

Los estilos de Enbido están gobernados por variables globales definidas en `src/shared/styles/variables.css`:

```css
:root {
  /* Paleta cromática corporativa */
  --color-primary: #128250;
  --color-primary-dark: #0c613b;
  --color-secondary: #d4af37; /* Dorado de Enbido */
  --color-dark: #121214;
  --color-dark-surface: #1a1a1e;
  --color-gray: #7a7a8c;
  --color-danger: #e04545;

  /* Tipografías y efectos */
  --font-sans: 'Inter', sans-serif;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --border-radius: 8px;
}
```

### Componentes Reutilizables de Interfaz

* **`<Button />`:** Soporta variantes de estilos (primary, secondary, danger, outline) y estados de carga desactivados.
* **`<TextInput />`:** Campo de entrada unificado que implementa validación visual en tiempo real.
* **`<RadioGroup />`:** Selector circular limpio de opciones simples.
* **`<FileInput />`:** Componente de carga de avatares con lectura instantánea e intuitiva.

### Diseño Adaptativo (Responsive Design)

La interfaz de Enbido está optimizada bajo una estrategia combinada (mobile-first para listados y vistas comunes, apaisado obligatorio para el tablero de juego):

* **Breakpoint Tablet y Móvil Horizontal:** `@media (max-width: 768px)` -> Transforma menús en un cajón desplegable lateral (`<MobileDrawer />`).
* **Breakpoint Móvil Vertical:** `@media (max-width: 480px)` -> Simplifica layout a columnas simples.
* **Partida de Mus:** El componente `<OrientationOverlay />` utiliza escuchas en JS para forzar la visualización en formato horizontal y garantizar el espacio óptimo de juego.
