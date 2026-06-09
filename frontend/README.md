# Enbido Frontend - Enterprise-Grade Architecture Documentation

Enbido is a modern, real-time multiplayer card web application for playing **Mus** online, managing virtual and local physical tournaments, and connecting players through local meetups. 

This document provides a highly technical, enterprise-grade architecture guide for developers.

---

## 1. Arquitectura General

El frontend de Enbido sigue una **arquitectura por capas orientada a características (Feature-Based Architecture)**, segregando responsabilidades desde la UI hasta el cliente HTTP.

### Diagrama de Flujo de Renderizado (ASCII Art)

```text
[ Entrada del Usuario / Evento del Navegador ]
                   │
                   ▼
       ┌────────────────────────┐
       │ Componente de React    │ (Ej: <PlayerHand />, <LoginForm />)
       │ - Renderizado de UI    │
       │ - Captura de Eventos   │
       └───────────┬────────────┘
                   │ Invoca
                   ▼
       ┌────────────────────────┐
       │ Custom Hook / Service  │ (Ej: useMusActions.ts, useLoginForm.ts)
       │ - Lógica de Negocio    │
       │ - Validación de Datos  │
       └───────────┬────────────┘
                   │ Despacha / Actualiza
                   ▼
       ┌────────────────────────┐
       │ Context / State        │ (Ej: AuthContext, ChatWebSocketContext)
       │ - Estado Global        │
       │ - React Context / State│
       └───────────┬────────────┘
                   │ Consume / Ejecuta
                   ▼
       ┌────────────────────────┐
       │ API Client (Axios)     │ (shared/lib/api.ts)
       │ - Interceptores JWT    │
       │ - Headers por defecto  │
       └───────────┬────────────┘
                   │ Solicitud HTTP / WS
                   ▼
       ┌────────────────────────┐
       │ Servidor Backend       │ (Spring Boot / WebSocket Server)
       └────────────────────────┘
```

### Responsabilidades por Capa

| Capa | Responsabilidad Principal | Tecnologías y Patrones |
| :--- | :--- | :--- |
| **Componentes (`UI`)** | Presentación visual pura, accesibilidad y layouts responsivos. | React 19, Tailwind CSS / Custom CSS. |
| **Custom Hooks (`Business Logic`)** | Encapsulamiento del comportamiento, validación de inputs y llamadas a servicios. | Custom hooks (`useAuth`, `useMusGame`, `useMeetupMap`). |
| **Context/State (`Global State`)** | Gestión de datos compartidos transversalmente (Auth, Audio, Configuración, WebSockets). | React Context API. |
| **API Client (`HTTP / WebSocket`)** | Abstracción de llamadas REST, interceptores de seguridad para tokens y sincronización de WS. | Axios, WebSockets nativos (`ws://`). |

---

## 2. Flujo de Autenticación y Autorización (JWT)

Enbido asegura su comunicación con el backend de Spring Boot mediante tokens JSON Web Tokens (JWT) y el protocolo de autenticación Google OAuth2.

### Diagrama del Flujo JWT (ASCII Art)

```text
  [ Formulario / Google Sign-In ]
                 │
                 ▼
     POST /api/auth/login  (o google login)
                 │
                 ▼
  ┌──────────────────────────────┐
  │ Backend valida credenciales  │
  ├──────────────────────────────┤
  │ Devuelve:                    │
  │ - Token JWT (en body/header) │
  │ - Datos del Usuario          │
  └──────────────┬───────────────┘
                 │
                 ▼
  ┌──────────────────────────────┐
  │ Guardado en LocalStorage     │
  │ - token                      │
  │ - userId / username          │
  └──────────────┬───────────────┘
                 │
                 ├─────────────────────────┐
                 ▼ (En cada petición REST)  ▼ (Conexión WS)
  ┌──────────────────────────────┐   ┌──────────────────────────────┐
  │ Axios Interceptor            │   │ Mensaje WebSocket 'JOIN'     │
  │ Inserta:                     │   │ Envía:                       │
  │ Authorization: Bearer <token>│   │ { type: 'JOIN', token: ... } │
  └──────────────┬───────────────┘   └──────────────┬───────────────┘
                 │                                  │
                 ▼                                  ▼
      [ Valida Firma JWT ]               [ Valida Firma JWT ]
```

### Gestión de Tokens y Seguridad

* **Almacenamiento:** El token se almacena en el `localStorage` del cliente.
  * *Riesgos:* Al estar expuesto a scripts del lado del cliente, es susceptible a ataques **XSS (Cross-Site Scripting)**. 
  * *Mitigación:* Se implementa un saneamiento estricto de entradas y las cookies de sesión del navegador no se utilizan para almacenar datos sensibles de autorización, confiando en la corta expiración del token y la invalidación del backend.
* **Expiración e Invalidez:**
  * Si un request devuelve un error `401 Unauthorized`, el interceptor de Axios intercepta el fallo, borra las credenciales del `localStorage` de manera segura, limpia el estado de `AuthContext` y redirige al usuario a `/login`.
* **Protección de Rutas:**
  * El componente `<ProtectedRoute>` valida la presencia y validez del token en el estado global. Si el usuario no está autenticado, la ruta bloquea el renderizado y redirige inmediatamente al login.

---

## 3. Mapeo de Rutas → Componentes → Servicios

La siguiente tabla describe la correspondencia entre los puntos de entrada (URLs), sus controladores visuales y las capas lógicas subyacentes:

| Ruta URL | Componente Renderizado | Hook(s) Usado(s) | Service / API Llamado | Estado Involucrado | Props Clave |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | `useLoginForm()`, `useAuth()` | `/auth/login` (Axios) | `AuthContext` | Ninguna |
| `/register` | `RegisterPage` | `useRegisterForm()` | `/auth/register` (Axios) | Local (`useState`) | Ninguna |
| `/` | `HomePage` | `useAuth()`, `useNavbar()` | Ninguno | `AuthContext` | Ninguna |
| `/juego` | `MusGamePage` | `useMusGame()`, `useMusWebSocket()`, `useSettingsAudio()` | `/api/tournaments` (REST), WS (Mensajes) | `ChatWebSocketContext`, `SettingsContext` | Ninguna |
| `/torneos` | `TournamentPage` | `useTournamentLobby()`, `useSeo()` | `/api/tournaments/*` | Local, `AuthContext` | Ninguna |
| `/meetup` | `MeetupPage` | `useMeetupMap()`, `useMeetupData()` | `/api/local-meetup-ad` | Local | Ninguna |
| `/cuenta` | `AccountPage` | `useAccountData()` | `/api/usuarios/me/profile` | Local | Ninguna |

---

## 4. Explicación Fichero por Fichero

A continuación se detalla exhaustivamente cada fichero fuente del frontend.

### Directorio: `src/app/`

#### 1. `src/app/App.tsx`
* **Propósito:** Nodo raíz de la aplicación de React. Encapsula los proveedores globales y monta el router.
* **Componentes Hijos:** `<Providers>`, `<RouterProvider>`.

#### 2. `src/app/providers.tsx`
* **Propósito:** Agrupa los contextos globales para evitar el "nesting hell" en `App.tsx`.
* **Contextos que provee:** `GoogleOAuthProvider`, `AuthContextProvider`, `ChatWebSocketProvider`, `ChatContextProvider`, `SettingsContextProvider`.
* **Dependencias:** `@react-oauth/google`, React Contexts del proyecto.

#### 3. `src/app/router.tsx`
* **Propósito:** Define el árbol de enrutamiento utilizando `react-router-dom` (v7). Configura las rutas públicas y las protegidas con `<ProtectedRoute>`.
* **Rutas declaradas:** `/` (Home), `/login`, `/register`, `/juego`, `/torneos`, `/meetup`, `/cuenta`, `/admin`.

---

### Directorio: `src/features/auth/`

#### 4. `src/features/auth/components/LoginForm.tsx`
* **Propósito:** Componente de formulario de inicio de sesión estándar y botón de OAuth con Google.
* **Hooks utilizados:** `useLoginForm()`, `useTranslation()`.
* **Validaciones:** Email válido por regex, contraseña requerida.

#### 5. `src/features/auth/components/PasswordStrength.tsx`
* **Propósito:** Muestra un indicador visual de la fortaleza de la contraseña en tiempo real.
* **Props:** `password` (string).
* **Validaciones:** Evalúa longitud mínima, caracteres especiales, números y mayúsculas.

#### 6. `src/features/auth/components/RegisterField.tsx`
* **Propósito:** Campo de entrada configurable y reutilizable para el formulario de registro con manejo automático de errores.
* **Props:** `label`, `name`, `type`, `value`, `error`, `onChange`.

#### 7. `src/features/auth/components/RegisterForm.tsx`
* **Propósito:** Formulario de registro de nuevas cuentas.
* **Hooks utilizados:** `useRegisterForm()`.
* **Validaciones:** Coincidencia de contraseñas, fecha de nacimiento mayor de edad, fortaleza de contraseña.

#### 8. `src/features/auth/components/TwoFactorForm.tsx`
* **Propósito:** Formulario para introducir el código temporal (2FA) enviado por correo electrónico si el usuario tiene el doble factor activado.
* **Props:** `onSubmit`, `onCancel`, `error`, `loading`.

#### 9. `src/features/auth/components/auth-forms.css`
* **Propósito:** Estilos CSS para todos los formularios de acceso y registro (transiciones de carga, inputs con foco iluminado, avisos de error).

#### 10. `src/features/auth/hooks/AuthContext.tsx`
* **Propósito:** Contexto que almacena el estado de autenticación (usuario activo, token JWT).
* **Estado:** `user` (datos del perfil), `token` (string), `isAuthenticated` (boolean).
* **Efectos secundarios:** Lee de `localStorage` al inicializar para mantener la sesión persistente.

#### 11. `src/features/auth/hooks/useAuth.ts`
* **Propósito:** Hook para consumir el `AuthContext` de forma sencilla.

#### 12. `src/features/auth/hooks/useLoginForm.ts`
* **Propósito:** Gestiona el estado local del formulario de login, llamadas a la API y redirección post-login.
* **Dependencias:** `axios`, `AuthContext`.

#### 13. `src/features/auth/hooks/useRegisterForm.ts`
* **Propósito:** Lógica de negocio y validación de campos para la creación de usuarios.

---

### Directorio: `src/features/chat/`

#### 14. `src/features/chat/components/GlobalChatWindow.tsx`
* **Propósito:** Ventana flotante de chat para la comunicación directa entre amigos y usuarios globales.
* **Hooks utilizados:** `useChat()`, `useChatWebSocket()`.
* **Componentes Hijos:** Controles de envío, lista de mensajes.

#### 15. `src/features/chat/components/global-chat.css`
* **Propósito:** Estilos CSS de la burbuja flotante del chat de la comunidad y del chat privado uno a uno.

#### 16. `src/features/chat/hooks/ChatContext.tsx`
* **Propósito:** Proveedor del estado del chat global y directo. Maneja los chats activos, mensajes no leídos e historiales de conversación.
* **Estado:** Lista de chats abiertos, mensajes en cola.

#### 17. `src/features/chat/hooks/ChatWebSocketContext.tsx`
* **Propósito:** Maneja la conexión WebSocket dedicada para la mensajería instantánea y notificaciones de presencia (Online/Offline) de amigos.
* **Efectos secundarios:** Reconexión automática ante caídas de red e inyección del token JWT en el evento de conexión.

---

### Directorio: `src/features/game/`

#### 18. `src/features/game/components/ActionPanel.tsx`
* **Propósito:** Muestra los botones de acción del juego (Mus, Descarte, Envido, Paso, Quiero, No Quiero, Órdago) dinámicamente según el turno del jugador.
* **Props:** Acciones disponibles, callback de clicks.

#### 19. `src/features/game/components/GameConsoleLogs.tsx`
* **Propósito:** Panel lateral que lista los registros cronológicos de las acciones ocurridas durante la partida de Mus.

#### 20. `src/features/game/components/GameScoreBoard.tsx`
* **Propósito:** Marcador visual de chicos ganados y puntos de la mano actual (Nosotros vs Ellos).

#### 21. `src/features/game/components/LeaderboardModal.tsx`
* **Propósito:** Modal que muestra el ranking de jugadores ordenado por ELO, porcentaje de victorias o partidas jugadas.

#### 22. `src/features/game/components/LobbyWaitingRoom.tsx`
* **Propósito:** Sala de espera previa al inicio de una partida privada. Permite añadir/quitar bots y configurar las reglas.

#### 23. `src/features/game/components/MatchmakingPanel.tsx`
* **Propósito:** Panel interactivo para buscar partida de Mus en línea de forma emparejada por ELO.

#### 24. `src/features/game/components/MusGamePage.tsx`
* **Propósito:** Contenedor de la vista de juego de Mus. Orquesta el tablero de juego o el lobby principal según el estado actual de la sesión.
* **Hooks utilizados:** `useMusGame()`, `useSettingsAudio()`.

#### 25. `src/features/game/components/OrientationOverlay.tsx`
* **Propósito:** Mensaje que obliga al usuario móvil a rotar el dispositivo en posición horizontal para poder jugar.

#### 26. `src/features/game/components/PlayerHand.tsx`
* **Propósito:** Renderiza las 4 cartas del jugador actual. Permite seleccionarlas para realizar descartes interactivos.

#### 27. `src/features/game/components/PlayerPosition.tsx`
* **Propósito:** Posiciona en el tablero circular a los jugadores en sus respectivas sillas (Sur, Norte, Este, Oeste), mostrando sus nombres, burbujas de voz y cartas traseras.

#### 28. `src/features/game/components/PremiumLobby.tsx`
* **Propósito:** El lobby premium principal. Contiene accesos al emparejamiento, creación de salas privadas, listado de torneos y apartado social de amigos.

#### 29. `src/features/game/components/PrivateRoomsPanel.tsx`
* **Propósito:** Interfaz para crear o unirse a salas de juego privadas mediante códigos alfanuméricos.

#### 30. `src/features/game/components/ProfilePreviewModal.tsx`
* **Propósito:** Ventana emergente con el perfil detallado de otro jugador al hacer clic sobre su avatar.

#### 31. `src/features/game/components/RoundTransitionOverlay.tsx`
* **Propósito:** Pantalla de transición animada que revela las cartas de todos los jugadores al finalizar una ronda para el recuento de lances (Grande, Chica, Pares, Juego).

#### 32. `src/features/game/components/RulesModal.tsx`
* **Propósito:** Guía interactiva de reglas del Mus y combinaciones de señas.

#### 33. `src/features/game/components/SocialPanel.tsx`
* **Propósito:** Panel para buscar usuarios, enviar solicitudes de amistad, chatear y bloquear cuentas.

#### 34. `src/features/game/components/TimerCircle.tsx`
* **Propósito:** Temporizador visual animado en forma de círculo que realiza la cuenta atrás de 10 segundos del turno del jugador.

#### 35. `src/features/game/components/TournamentCreateModal.tsx`
* **Propósito:** Formulario para que los organizadores creen torneos virtuales con cuota de entrada y premios.

#### 36. `src/features/game/components/TournamentDetailModal.tsx`
* **Propósito:** Muestra la información del torneo seleccionado, participantes inscritos y el árbol visual de brackets en tiempo real (Cuartos, Semis, Final).

#### 37. `src/features/game/components/TournamentSection.tsx`
* **Propósito:** Sección del lobby que lista los torneos virtuales abiertos y en juego.

#### 38. `src/features/game/components/WelcomeHeader.tsx`
* **Propósito:** Encabezado con estadísticas rápidas del perfil del usuario (Elo, Monedas, Botón de Ránking).

#### 39. `src/features/game/components/lobby-waiting-room.css`
* **Propósito:** Estilos CSS para el layout de la sala de espera pre-partida.

#### 40. `src/features/game/components/mus-game.css`
* **Propósito:** Estilos CSS de alto rendimiento del tablero de Mus 2D/3D (efectos de cartas, giros de cámara, posiciones de avatares).

#### 41. `src/features/game/components/premium-lobby.css`
* **Propósito:** Estilos CSS del lobby principal (listados, paneles colapsables, pestañas y animaciones de carga).

#### 42. `src/features/game/hooks/useGameApi.ts`
* **Propósito:** Centraliza peticiones de juego como crear o unirse a salas.

#### 43. `src/features/game/hooks/useGameAudio.ts`
* **Propósito:** Carga y reproduce los efectos de sonido de la partida (barajar, arrojar cartas, botones, alertas de señas).

#### 44. `src/features/game/hooks/useGameChat.ts`
* **Propósito:** Lógica del canal de comunicación textual dentro de la partida de Mus.

#### 45. `src/features/game/hooks/useGameOver.ts`
* **Propósito:** Lógica de cierre del juego y redirección cuando se alcanza el marcador ganador.

#### 46. `src/features/game/hooks/useLeaderboard.ts`
* **Propósito:** Carga y paginación de los perfiles líderes del ranking.

#### 47. `src/features/game/hooks/useLobbyProfile.ts`
* **Propósito:** Sincroniza datos rápidos del jugador en el lobby.

#### 48. `src/features/game/hooks/useMusActions.ts`
* **Propósito:** Maneja el envío de acciones de juego del usuario por el WebSocket (Mus, Descarte, Envidos).

#### 49. `src/features/game/hooks/useMusGame.ts`
* **Propósito:** Orquesta el estado de la partida, controlando transiciones de fase y turnos.

#### 50. `src/features/game/hooks/useMusGameState.ts`
* **Propósito:** Mantiene la copia del estado sincronizado del motor del backend para representarlo en la UI de forma reactiva.

#### 51. `src/features/game/hooks/useMusWebSocket.ts`
* **Propósito:** Inicializa y mantiene la conexión de red WebSocket para la partida en curso.

#### 52. `src/features/game/hooks/useOrientation.ts`
* **Propósito:** Detecta cambios de orientación física de la pantalla (Horizontal vs Vertical).

#### 53. `src/features/game/hooks/useSocialPanel.ts`
* **Propósito:** Acciones sociales del panel (agregar amigos, procesar peticiones, bloquear).

#### 54. `src/features/game/hooks/useTournamentLobby.ts`
* **Propósito:** Lógica de torneos para unirse, confirmar estado de "listo" en emparejamientos y actualizar brackets.

---

### Directorio: `src/features/meetup/`

#### 55. `src/features/meetup/components/CreateAdPage.tsx`
* **Propósito:** Formulario para publicar anuncios de quedadas de Mus en establecimientos físicos locales, integrando geolocalización.

#### 56. `src/features/meetup/components/MeetupAdCard.tsx`
* **Propósito:** Tarjeta que muestra detalles del anuncio físico (lugar, mapa, descripción, jugadores necesarios).

#### 57. `src/features/meetup/components/MeetupFilters.tsx`
* **Propósito:** Filtros para segmentar anuncios por tipo de establecimiento o distancia.

#### 58. `src/features/meetup/components/MeetupListView.tsx`
* **Propósito:** Listado que renderiza la colección de anuncios.

#### 59. `src/features/meetup/components/MeetupPage.tsx`
* **Propósito:** Vista principal del buscador de partidas de Mus presenciales. Integra Leaflet para renderizar el mapa interactivo de Euskadi.

#### 60. `src/features/meetup/components/card/MeetupCardActions.tsx`
* **Propósito:** Botones para solicitar participar, cancelar solicitud o borrar anuncios en las tarjetas.

#### 61. `src/features/meetup/components/card/MeetupCardChat.tsx`
* **Propósito:** Mini-chat integrado dentro de la tarjeta de quedada para los 4 participantes del encuentro.

#### 62. `src/features/meetup/components/card/MeetupCardHeader.tsx`
* **Propósito:** Encabezado de la tarjeta con nombre del bar/lugar, fecha del encuentro y mapa estático.

#### 63. `src/features/meetup/components/create-ad-page.css`
* **Propósito:** Estilos CSS del formulario de creación de anuncios.

#### 64. `src/features/meetup/components/meetup-ad-card.css`
* **Propósito:** Estilos CSS de las tarjetas de los anuncios presenciales.

#### 65. `src/features/meetup/components/meetup-map.css`
* **Propósito:** Estilos del mapa interactivo de Leaflet y marcadores personalizados.

#### 66. `src/features/meetup/components/meetup-page.css`
* **Propósito:** Estilos de la página general del buscador de encuentros.

#### 67. `src/features/meetup/hooks/useMeetupCard.ts`
* **Propósito:** Hook para manejar las acciones y peticiones de una tarjeta de meetup individual.

#### 68. `src/features/meetup/hooks/useMeetupData.ts`
* **Propósito:** Carga de los anuncios disponibles de la base de datos REST.

#### 69. `src/features/meetup/hooks/useMeetupMap.ts`
* **Propósito:** Lógica de integración y pintado del mapa OpenStreetMap con Leaflet.

---

### Directorio: `src/features/shop/`

#### 70. `src/features/shop/components/Coinicon.tsx`
* **Propósito:** Componente visual para renderizar la moneda virtual personalizada del juego.

#### 71. `src/features/shop/components/ShopCard.tsx`
* **Propósito:** Tarjeta que representa un artículo de la tienda (avatares, reversos de cartas, alias). Muestra precio, estado de propiedad o equipamiento.

#### 72. `src/features/shop/components/ShopGrid.tsx`
* **Propósito:** Cuadrícula contenedora de las tarjetas de la tienda.

#### 73. `src/features/shop/components/ShopHero.tsx`
* **Propósito:** Sección superior promocional de la tienda de cosméticos.

#### 74. `src/features/shop/components/ShopLoading.tsx`
* **Propósito:** Skeletons animados de carga para la tienda.

#### 75. `src/features/shop/components/ShopPage.tsx`
* **Propósito:** Contenedor de la tienda de cosméticos del perfil.
* **Hooks utilizados:** `useShopData()`.

#### 76. `src/features/shop/components/ShopSummary.tsx`
* **Propósito:** Muestra el saldo actual del jugador de forma flotante.

#### 77. `src/features/shop/components/ShopToast.tsx`
* **Propósito:** Toast flotante con notificaciones rápidas al comprar o equipar ítems.

#### 78. `src/features/shop/components/ShopToolbar.tsx`
* **Propósito:** Barra de herramientas para filtrar los cosméticos por categoría.

#### 79. `src/features/shop/components/shop-page.css`
* **Propósito:** Estilos CSS de la tienda de cosméticos.

#### 80. `src/features/shop/hooks/useShopData.ts`
* **Propósito:** Centraliza la lógica de compra y equipamiento de cosméticos mediante el endpoint `/api/shop`.

---

### Directorio: `src/features/tournament/`

#### 81. `src/features/tournament/components/PublishForm.tsx`
* **Propósito:** Formulario para publicar torneos presenciales locales.

#### 82. `src/features/tournament/components/PublishFormFields.tsx`
* **Propósito:** Campos de datos para el formulario de publicación de torneos físicos.

#### 83. `src/features/tournament/components/TournamentCard.tsx`
* **Propósito:** Tarjeta informativa de torneos presenciales (lugar, fecha de inicio, premios).

#### 84. `src/features/tournament/components/TournamentList.tsx`
* **Propósito:** Renderiza la lista completa de torneos, permitiendo filtrar entre virtuales y presenciales.

#### 85. `src/features/tournament/components/TournamentPage.tsx`
* **Propósito:** Vista general de torneos presenciales organizados por los usuarios.

#### 86. `src/features/tournament/components/tournament.css`
* **Propósito:** Estilos CSS de la página de torneos presenciales.

---

### Directorio: `src/shared/`

#### 87. `src/shared/components/layout/AgeModal.tsx`
* **Propósito:** Modal de advertencia legal de mayoría de edad que aparece para usuarios que intentan registrarse con edades no válidas.

#### 88. `src/shared/components/layout/GameOverModal.tsx`
* **Propósito:** Pantalla final modal que muestra las estadísticas de la partida ganada o perdida, cambios en el ELO y ganancias.

#### 89. `src/shared/components/layout/MobileDrawer.tsx`
* **Propósito:** Cajón de navegación lateral desplegable optimizado para dispositivos móviles.

#### 90. `src/shared/components/layout/NavLinks.tsx`
* **Propósito:** Enlaces lógicos de la barra de navegación del sitio.

#### 91. `src/shared/components/layout/Navbar.tsx`
* **Propósito:** Barra de navegación fija superior. Soporta traducción en runtime y dropdown de perfil de usuario.

#### 92. `src/shared/components/layout/NavbarIcons.tsx`
* **Propósito:** Agrupa los iconosSVG utilizados en el menú de navegación.

#### 93. `src/shared/components/layout/SettingsModal.tsx`
* **Propósito:** Modal de opciones de configuración de audio (música, efectos) y visualización del juego.

#### 94. `src/shared/components/layout/UserDropdown.tsx`
* **Propósito:** Dropdown desplegable con accesos directos al perfil, cuenta y cierre de sesión.

#### 95. `src/shared/components/layout/useNavbar.ts`
* **Propósito:** Lógica de menús y opciones de navegación.

#### 96. `src/shared/components/ui/Button.tsx`
* **Propósito:** Componente de botón reutilizable con estados de carga (`loading`), estilos configurables (primario, secundario, peligro) y prevención de doble click accidental.

#### 97. `src/shared/components/ui/FileInput.tsx`
* **Propósito:** Campo de subida de archivos/imágenes optimizado con previsualización del avatar.

#### 98. `src/shared/components/ui/ImageModal.tsx`
* **Propósito:** Modal simple para ampliar y visualizar imágenes de carteles de torneos.

#### 99. `src/shared/components/ui/RadioGroup.tsx`
* **Propósito:** Grupo de opciones de selección circular univariante.

#### 100. `src/shared/components/ui/TextInput.tsx`
* **Propósito:** Entrada de texto estilizada con validación y estados de error integrados.

#### 101. `src/shared/components/ui/UsuariosList.tsx`
* **Propósito:** Componente para listar y filtrar rápidamente usuarios en paneles de administración.

#### 102. `src/shared/hooks/SettingsContext.tsx`
* **Propósito:** Contexto que almacena los valores de configuración global de audio, notificaciones visuales y volumen de sonido. Persiste los datos en el navegador del usuario de forma automática.

#### 103. `src/shared/hooks/settings/NotificationToast.tsx`
* **Propósito:** Renderizador de notificaciones emergentes de tipo "Toast" para avisos rápidos al usuario.

#### 104. `src/shared/hooks/settings/useSettingsAudio.ts`
* **Propósito:** Hook para reproducir archivos multimedia interactuando con los niveles de volumen y activaciones configuradas en `SettingsContext`.

#### 105. `src/shared/hooks/settings/useSettingsNotifications.ts`
* **Propósito:** Hook para disparar Toasts reactivos.

#### 106. `src/shared/hooks/useFormValidation.ts`
* **Propósito:** Utilidad para validar campos de formularios reactivos (email, contraseñas, vacíos).

#### 107. `src/shared/hooks/usePasswordValidation.ts`
* **Propósito:** Evalúa la fortaleza y la complejidad de las contraseñas contra políticas corporativas de seguridad.

#### 108. `src/shared/hooks/useSeo.tsx`
* **Propósito:** Inyecta de forma dinámica las etiquetas de metadatos SEO en el `<head>` del DOM (título, descripción, canonical links y JSON-LD estructurado).

#### 109. `src/shared/hooks/useUsuarios.tsx`
* **Propósito:** Facilita la obtención y listado de usuarios de la base de datos.

#### 110. `src/shared/lib/api.ts`
* **Propósito:** Configuración centralizada del cliente Axios. Define interceptores de peticiones para inyectar automáticamente el token JWT y capturar errores de red comunes (como expiraciones de token con error 401).

---

## 5. Flujos de Negocio Detallados

### Registro de Usuario
```text
1. El usuario introduce Name, Email, Password, Birthdate en <RegisterForm />.
2.useRegisterForm evalúa en tiempo real:
   - Contraseña fuerte (usePasswordValidation)
   - Edad mayor de 18 años (si falla, levanta el <AgeModal /> bloqueando el envío).
3. Al hacer submit, el cliente realiza POST a /auth/register.
4. Si el servidor responde 200:
   - Redirige a /login.
5. Si falla (ej: Email en uso):
   - Muestra error detallado bajo el input.
```

### Inicio de Sesión (Login) y 2FA
```text
1. El usuario envía email y contraseña en <LoginForm />.
2. POST a /auth/login.
3. Si el usuario tiene doble factor activado (twoFactorEnabled == true):
   - El backend responde con estado parcial y envía un código temporal por email.
   - El cliente renderiza <TwoFactorForm />.
   - El usuario introduce el código de 6 dígitos que se valida en un nuevo POST.
4. Si la autenticación final es exitosa:
   - Se guarda el token JWT en localStorage.
   - Se actualiza el AuthContext y redirige al dashboard.
```

### Flujo de Partida de Mus
```text
1. Búsqueda de partida (MatchmakingPanel) o invitación (LobbyWaitingRoom).
2. Se abre canal WebSocket (useMusWebSocket).
3. Transición de fases de juego gobernadas por el motor del servidor:
   - Reparto de cartas (dealing) -> Muestra <PlayerHand />.
   - Envío de decisión de Mus (mus-check).
   - Descartes (discarding).
   - Apuestas por lances (betting).
4. El temporizador circular (TimerCircle) de 10s realiza cuenta atrás. Si llega a 0, se auto-envía la acción "Paso" o "No Quiero".
5. Al finalizar los 40 puntos, salta el <GameOverModal />.
```

---

## 6. Configuración y Dependencias

### `package.json`

* **Dependencias de Producción (`dependencies`):**
  * `react` (v19) & `react-dom`: Núcleo de la interfaz de usuario.
  * `@react-oauth/google` (v0.13.5): Librería oficial para gestionar el flujo OAuth2 de inicio de sesión social.
  * `axios` (v1.6.0): Cliente HTTP utilizado para consumir los servicios del backend de Spring Boot.
  * `i18next` & `react-i18next`: Framework de internacionalización para traducciones en runtime.
  * `leaflet`: Motor gráfico de mapas utilizado en las quedadas presenciales de Mus.
  * `lucide-react`: Paquete de iconos vectoriales optimizados de interfaz.
  * `react-router-dom` (v7.15.0): Enrutador virtual del lado del cliente.

### `tsconfig.json`

Configura el compilador de TypeScript.
* `target: "ES2022"`: Compila el código a estándares modernos compatibles con navegadores modernos.
* `baseUrl: "."` y `paths: { "@/*": ["src/*"] }`: Permite importaciones absolutas limpias utilizando el alias `@/` (apuntando a `src/`), evitando rutas relativas largas como `../../../components`.

### `vite.config.ts`

Define la configuración del servidor de desarrollo y empaquetador de producción:
* Utiliza el plugin `@vitejs/plugin-react` para dar soporte a JSX y recarga rápida en caliente (HMR).
* Define alias de resolución de directorios para mapear `@/` a `./src`.

---

## 7. Gestión de Estado

Enbido implementa un modelo híbrido de gestión de estado estructurado en tres niveles según su ámbito de consumo:

```text
┌────────────────────────────────────────────────────────┐
│ Estado Global (Persistente / Compartido)               │
│ - AuthContext (Token, Perfil de Usuario)               │
│ - ChatWebSocketContext (Canal activo de amigos)        │
│ - SettingsContext (Preferencia de audio y volumen)     │
└──────────────────────────┬─────────────────────────────┘
                           ▼ Consume
┌────────────────────────────────────────────────────────┐
│ Estado de la Característica (Feature Scope)            │
│ - useMusGameState (Representación reactiva del tablero)│
│ - useMeetupMap (Coordenadas de Leaflet y marcadores)    │
└──────────────────────────┬─────────────────────────────┘
                           ▼ Consume
┌────────────────────────────────────────────────────────┐
│ Estado Local del Componente (Component Scope)          │
│ - useState / useFormValidation (Inputs de texto)       │
│ - Modal toggles, sliders de volumen                    │
└────────────────────────────────────────────────────────┘
```

---

## 8. Comunicación con el Backend

El cliente Axios (`shared/lib/api.ts`) está configurado como un cliente HTTP único con las siguientes políticas:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Interceptor de Peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Respuestas (Manejo de Errores)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 9. Seguridad Frontend

* **Prevención de XSS:** React escapa por defecto todos los valores insertados en el JSX. Evitamos en todo el proyecto el uso de `dangerouslySetInnerHTML`.
* **Variables de Entorno:** Las claves de configuración pública (como el Google Client ID o la URL del backend) se leen en runtime vía variables con prefijo `VITE_` (`import.meta.env`). Las credenciales secretas nunca se suben al código fuente y se configuran como variables de entorno privadas en el pipeline de despliegue.
* **Validación en Dos Capas (Client/Server):**
  * *Client-side:* Validación rápida mediante regex y condicionales en tiempo real para mejorar la UX (fortaleza de contraseña, formatos de email, edad mayor de 18 años).
  * *Server-side:* El backend de Spring Boot realiza de nuevo las validaciones estrictas con anotaciones de Jakarta Validation antes de persistir los datos en base de datos.

---

## 10. Internacionalización (i18n)

* **Idiomas Soportados:** Español (`es`), Inglés (`en`), Francés (`fr`), Euskera (`eu`).
* **Detección Automática:** Utiliza `i18next-browser-languagedetector` para leer las preferencias idiomáticas guardadas en el navegador del usuario.
* **Estructura de Archivos:** Las traducciones se cargan de forma diferida (lazy loading) desde archivos JSON estáticos estructurados en carpetas de idiomas:
  * `/public/locales/es/common.json`
  * `/public/locales/en/common.json`
  * `/public/locales/fr/common.json`
  * `/public/locales/eu/common.json`
* ** runtime Switcher:** El componente `<LanguageSwitcher />` permite alternar el idioma de forma fluida a través del método `i18n.changeLanguage(code)` de `react-i18next`.

---

## 11. Manejo de Errores y UI Feedback

* **Feedback de Formularios:** Los errores de validación de campos se pintan en etiquetas inferiores rojas estilizadas integradas en `<TextInput />`.
* **Cargando (Loading State):** Todos los botones implementan estados deshabilitados (`disabled`) acompañados de un spinner de carga circular animado para mitigar el envío múltiple de peticiones.
* **Consola y Debugging:** Las advertencias y errores lógicos de WebSockets se capturan y registran de forma ordenada en logs formateados por consola para facilitar las labores de diagnóstico.

---

## 12. Testing

* **Unit Testing (Vitest/Jest):**
  * Cubren validadores de contraseñas (`usePasswordValidation.ts`), cálculos de formularios (`useFormValidation.ts`) e internacionalización.
* **E2E/Integration Testing (Cypress):**
  * Ubicados en `frontend/cypress/`.
  * Simulan flujos de usuario completos: creación de salas de juego, login de usuarios con credenciales simuladas y flujos interactivos de juego de Mus.

---

## 13. Estilos y Diseño

* **Arquitectura de Estilos:** Se utiliza Vanilla CSS estructurado por variables globales (`shared/styles/variables.css`) que definen el sistema de diseño visual de Enbido:
  ```css
  :root {
    --color-primary: #128250;
    --color-primary-dark: #0c613b;
    --color-dark: #121214;
    --color-gray: #7a7a8c;
    --font-sans: 'Inter', sans-serif;
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  ```
* **Adaptabilidad (Responsive Design):** Mobile-first y breakpoints configurados de forma estándar para pantallas táctiles verticales/horizontales y desktops:
  * Tablet / Móvil Horizontal: `@media (max-width: 768px)`
  * Mobile Vertical / Small sizes: `@media (max-width: 480px)`
