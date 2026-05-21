# 🃏 Enbido.eus - Plataforma Integral de Mus Multijugador

Bienvenido a la documentación oficial y completa de **Enbido.eus**, una plataforma Full Stack avanzada para jugar al Mus en línea, organizar torneos físicos, gestionar quedadas presenciales (MeetUps) y personalizar la experiencia del jugador con un sistema de economía y tienda virtual.

---

## 📑 Tabla de Contenidos

1. [Visión General y Arquitectura](#1-visión-general-y-arquitectura)
2. [Motor del Juego de Mus (Multijugador)](#2-motor-del-juego-de-mus-multijugador)
3. [Economía, Perfiles y Tienda Virtual](#3-economía-perfiles-y-tienda-virtual)
4. [Módulo Social: MeetUps y Torneos Físicos](#4-módulo-social-meetups-y-torneos-físicos)
5. [Ranking Global ELO](#5-ranking-global-elo)
6. [Estructura de la Base de Datos (MySQL)](#6-estructura-de-la-base-de-datos-mysql)
7. [Despliegue y Orquestación (Docker)](#7-despliegue-y-orquestación-docker)
8. [Diccionario Exhaustivo de Archivos (TODO EL CÓDIGO)](#8-diccionario-exhaustivo-de-archivos-todo-el-código)

---

## 1. Visión General y Arquitectura

El proyecto está diseñado siguiendo una arquitectura **Cliente-Servidor (Full Stack)** con comunicación bidireccional en tiempo real.

- **Frontend (Cliente):** React 18, TypeScript y Vite. La UI es ultra-premium, moderna, con animaciones CSS avanzadas (Glassmorphism, gradientes, sombras 3D) y un flujo de uniones a salas extremadamente fluido.
- **Backend (Servidor):** Java 21 con Spring Boot 3.5. Gestiona toda la lógica de negocio, reglas del Mus, matchmaking, perfiles y seguridad HTTP (Spring Security) y comunicación de sockets.
- **Comunicación en Tiempo Real:** Las partidas se juegan utilizando **WebSockets** (`ws://`), permitiendo que el estado de la mesa se sincronice al milisegundo entre 4 jugadores.
- **Base de Datos:** MySQL 8.0 relacional, orquestada y gestionada a través de volúmenes en Docker.
- **Infraestructura:** Todo el proyecto está containerizado y orquestado mediante Docker Compose, incluyendo un proxy reverso Nginx para servir el Frontend.

---

## 2. Motor del Juego de Mus (Multijugador)

El corazón de Enbido.eus es el motor de juego, ubicado en el paquete `com.mus.backend.engine` del servidor (clase `GameSession.java`).

### Flujo de WebSocket
Cuando un jugador entra en la sala (`LobbyWaitingRoom`), el cliente y el servidor abren una conexión WebSocket. Todo el estado del juego se transmite en mensajes JSON con un tipo de acción (`START_GAME`, `BET_ACTION`, `DISCARD_ACTION`, etc.).
El servidor procesa la lógica, valida si es el turno del jugador y hace un broadcast (`ROOM_STATE`) a los 4 jugadores para actualizar el tapete.

### Fases del Juego
El juego se divide en estrictas fases lógicas (`phase` en `GameSession`):
1. **init:** Esperando jugadores o en la sala del lobby.
2. **discarding (El Descarte):** Fase inicial donde el jugador mano evalúa si desea Mus o cortar el Mus. Si hay Mus, los jugadores pueden descartar entre 1 y 4 cartas.
3. **betting (Apuestas):** Se juega a los 4 lances clásicos: Grande, Chica, Pares y Juego/Punto. Las decisiones incluyen Paso, Envido, Órdago y Quiero/No Quiero.
4. **round-over (Fin de Mano):** Se resuelven los lances, se calculan las piedras (tantos), y los jugadores pueden ver las cartas antes de pulsar en "Siguiente Mano" para rotar al repartidor.
5. **game-over (Fin de Partida):** Se alcanza cuando el "Equipo 1" o el "Equipo 2" superan los 30 puntos (tantos). Aparece una ventana para solicitar "Revancha" y reiniciar la mesa.

### Modo 4 Reyes vs 8 Reyes
La plataforma soporta los dos estilos principales del Mus:
- **Modo 8 Reyes (Por defecto):** Los *Treses (3)* valen y cuentan como Reyes (10 puntos). Los *Doses (2)* valen y cuentan como Ases (1 punto).
- **Modo 4 Reyes:** Se juega con la baraja estricta. El 3 es simplemente un 3, y el 2 es un 2. 

---

## 3. Economía, Perfiles y Tienda Virtual

Para fomentar la retención, Enbido.eus implementa un meta-juego donde los usuarios ganan "monedas" y suben de rango (ELO).

### Perfil del Jugador
Cada usuario tiene un registro en la tabla `user_game_profile` gestionada por el `UserProfileController`. Este perfil almacena:
- Su ELO (Puntos de liga competitiva).
- Sus Monedas virtuales.
- Estadísticas de victorias y partidas jugadas.
- Los **objetos equipados** (IDs numéricos que apuntan a la tienda).

### La Tienda (Shop)
La tienda (`ShopPage.tsx`) permite comprar personalizaciones premium.
Las categorías implementadas (`categoryId` en la tabla `categories`) son:
1. **Perfiles/Avatares:** Cambian la imagen del jugador.
2. **Barajas:** Cambian los reversos de las cartas (Ej. Reverso Nocturno, Baraja Euskal).
3. **Alias/Títulos:** Textos que aparecen debajo de tu nombre (Ej. "El Tímido", "Maestro del Órdago").
4. **Tapetes de Mesa (Boards):** Cambian dinámicamente la estética CSS de todo el tablero (`.game-felt-board`). Ejemplos: Tapete Azul Real, Terciopelo Negro, Casino Dorado. Estos modifican brillos, texturas y hasta la iluminación de la sala.

---

## 4. Módulo Social: MeetUps y Torneos Físicos

Enbido.eus va más allá del juego virtual e incluye herramientas para el mundo real.

### MeetUps (Quedadas Físicas)
- Endpoint: `/api/meetups` (`MeetupController.java`)
- Los jugadores pueden publicar "Anuncios" buscando personas en su zona (Ej. "Falta uno para jugar en el Bar Txiki a las 18:00"). Estos anuncios persisten en la tabla `local_meetup_ad`.

### Torneos Físicos
- Endpoint: `/api/tournaments` (`PhysicalTournamentController.java`)
- Organizadores de asociaciones o bares pueden registrar campeonatos enteros con fecha, ubicación, precio de entrada, estructura del torneo y los premios. Toda la información queda documentada en la tabla `physical_tournament`.

---

## 5. Ranking Global ELO

La competitividad se gestiona a través del sistema **ELO**.
- Todos los usuarios comienzan con 200 puntos ELO (definido en `UserGameProfile.java`).
- Al ganar o perder partidas multijugador, este valor fluctúa.
- La página `/ranking` hace una llamada a `/api/usuarios/ranking` que cruza los datos de las cuentas de registro (`user_login`) con el perfil de juego (`user_game_profile`) ordenando a los jugadores por ELO descendente y calculando su **Win Rate (%)** en vivo.

---

## 6. Estructura de la Base de Datos (MySQL)

El script maestro de base de datos se encuentra en `db/init/01-schema.sql`. La base de datos (`mudb`) contiene una amplia variedad de tablas para sostener este gigantesco sistema:

### Sistema de Cuentas y Seguridad
- **`user_login`**: El núcleo de la cuenta. Guarda email, password encriptado, fecha de nacimiento, rol, y estado de banneo.
- **`friendships`**: Para el sistema de amigos (pendiente/aceptado).

### Sistema de Juego Virtual
- **`user_game_profile`**: El perfil estadístico y los cosméticos equipados.
- **`play_game`**: El registro histórico de cada partida, guardando qué 4 jugadores estuvieron en la mesa, puntos finales y tiempos.
- **`game_action_log`**: Trazabilidad y auditoría de los movimientos realizados en partidas en curso.
- **`matchmaking_queue`**: Una cola donde los jugadores esperan a que el servidor los empareje con aliados u oponentes según su nivel.
- **`chat`**: Almacena mensajes persistentes entre partidas.

### Tienda Virtual y Monetización
- **`categories`** y **`items`**: Catálogo general que ofrece la tienda.
- **`user_inventory`**: Tabla cruzada que dictamina de qué objetos es propietario cada usuario.
- **`purchase_history`**: Registro de facturación (cuántas monedas gastó el usuario, qué compró y a qué hora).

### Sistema Físico y Torneos
- **`physical_tournament`** y **`physical_tournament_team`**: Inscripción y pagos de equipos en el mundo real.
- **`local_meetup_ad`** y **`meetup_request`**: Solicitudes de asistencia a quedadas en bares locales.

---

## 7. Despliegue y Orquestación (Docker)

Todo el ecosistema está configurado para un levantamiento local instantáneo y con cero fricción ("One Click Deploy").

Para lanzar toda la aplicación desde cero:
```bash
docker compose up --build -d
```
*(Nota: Spring Boot esperará 15 segundos a que el contenedor de MySQL haya iniciado los puertos y precargado el esquema `01-schema.sql` antes de conectar y ejecutar las migraciones Java de `DataInitializer`).*

---

## 8. Diccionario Exhaustivo de Archivos (TODO EL CÓDIGO)

Esta sección explica de forma detallada qué hace **absolutamente cada archivo** del repositorio.

### Archivos de Configuración Raíz y Despliegue
* **`.env`**: Archivo de variables de entorno (contraseñas, configuraciones). Oculto pero vital para seguridad.
* **`docker-compose.yml`** y **`docker-compose.dev.yml`**: Orquestan los tres contenedores principales (MySQL, Spring Boot Backend, Nginx Frontend) indicando puertos y volúmenes persistentes.
* **`Readme.md`**: Este mismo archivo de documentación principal.
* **`fix_passwords.sql`** y **`test_login.sh`**: Scripts utilitarios (shell y SQL) creados para testear la encriptación BCrypt o reiniciar usuarios corruptos en desarrollo.

### Directorio Base de Datos (`/db`)
* **`db/Dockerfile`**: Configura la imagen base de la base de datos MySQL 8.
* **`db/init/01-schema.sql`**: **El archivo más crítico de la BD**. Ejecuta automáticamente el DDL (Data Definition Language) creando TODAS las tablas descritas en la Sección 6 y pobladas con cuentas de prueba.

### Directorio Backend Java (`/backend`)
* **`backend/Dockerfile`**: Compila el código Java usando Maven (multi-etapa) y crea un contenedor ligero Alpine con el JAR listo para correr.
* **`backend/entrypoint.sh`**: Script que ejecuta Spring Boot asegurando que MySQL ya ha arrancado (espera 15 seg).
* **`backend/pom.xml`**: El manejador de dependencias de Maven (Lombok, Spring Web, Spring WebSocket, Spring Data JPA, MySQL Connector).

#### Controladores REST y Endpoints (`/backend/src/main/java/com/mus/backend/controller/`)
* **`GameMatchController.java`**: Gestiona las llamadas HTTP para las salas multijugador y consultas de partidas históricas.
* **`MeetupController.java`**: API que recibe y sirve los anuncios de quedadas físicas y de bares.
* **`PhysicalTournamentController.java`**: Expone la lista de torneos físicos registrados en la base de datos.
* **`ShopController.java`**: Devuelve al frontend los artículos (items) y categorías disponibles para comprar.
* **`UserProfileController.java`**: Controlador dedicado al ELO, victorias y qué artículos tiene equipados un jugador.
* **`UsuarioController.java`**: El controlador más grande. Maneja el login manual, cálculos del Ranking ELO global, lógica transaccional de compra en la tienda e inyección de inventarios.
* **`MusGameWebSocketHandler.java`**: El "Router" de las partidas en tiempo real. Maneja el canal de WebSockets, interceptando acciones como `START_GAME`, `BET` o `DISCARD`, derivándolas al Engine de Mus y devolviendo un JSON broadcast (ROOM_STATE) a todos los clientes.

#### El Motor Matemático del Mus (`/backend/src/main/java/com/mus/backend/engine/`)
* **`Card.java`**: Modela una carta de la baraja española, asignándole su palo, su número, y su valor en pares/juego.
* **`Deck.java`**: Modela la baraja de 40 cartas y expone métodos de barajar aleatoriamente y robar (pop).
* **`GameSession.java`**: **El cerebro del Mus.** Una clase colosal que gestiona las variables del tapete: qué cartas tiene quién, quién es el mano, cálculos dinámicos de los lances (Grande, Chica, Pares, Juego), modos de juego (4 vs 8 reyes) y la suma final de piedras/tantos por equipo.
* **`GameSessionManager.java`**: Componente global (Singleton) que guarda en un mapa en memoria todas las partidas (`GameSession`) que están ocurriendo en el servidor al mismo tiempo.

#### Modelos de Base de Datos / Entidades JPA (`/backend/src/main/java/com/mus/backend/model/`)
* **`Usuario.java`**, **`UserGameProfile.java`**: Mapean (representan) a las tablas `user_login` y `user_game_profile` en código Java.
* **`Category.java`**, **`Item.java`**: Representan cosméticos comprables de la tienda.
* **`PlayGame.java`**, **`GameMatch.java`**, **`GameActionLog.java`**: Entidades para persistir auditorías e historiales en MySQL.
* **`LocalMeetupAd.java`**, **`PhysicalTournament.java`**: Clases modelo para torneos y quedadas físicas.

#### Repositorios de Hibernate (`/backend/src/main/java/com/mus/backend/repository/`)
* Archivos como **`UsuarioRepository.java`**, **`UserGameProfileRepository.java`**, **`PlayGameRepository.java`**, etc: Interfaces de Spring Data que permiten hacer peticiones SELECT, UPDATE, INSERT a MySQL sin escribir SQL manualmente (magia de ORM).

#### Configuraciones del Servidor (`/backend/src/main/java/com/mus/backend/config/`)
* **`DataInitializer.java`**: Ejecutado al arrancar el servidor. Modifica programáticamente la base de datos (por ejemplo, insertando los nuevos tapetes de casino e inyectando las filas base si faltan).
* **`WebSocketConfig.java`**: Configura y abre el túnel `/ws/game` para permitir conexiones de sockets puras ignorando los límites de CORS.

### Directorio Frontend React (`/frontend`)
* **`frontend/Dockerfile`** / **`nginx.conf`**: El frontend se compila a puro HTML/JS, por lo que su Dockerfile compila usando Node y luego copia los archivos estáticos a Nginx, que los sirve y además proxy-fica las llamadas `/api/` a Java.
* **`package.json`** / **`vite.config.ts`**: Configuración de dependencias NPM (React, Router, Axios) y del compilador ultrarrápido Vite.

#### Arquitectura React (`/frontend/src/`)
* **`main.tsx`**: El ancla al HTML. Arranca React y renderiza la aplicación principal.
* **`App.tsx`**: El Router central de la app. Si la URL es `/shop` carga `ShopPage`, si es `/game` carga `MusGamePage`.
* **`services/api.ts`**: Fichero que configura Axios (la librería de peticiones HTTP), insertando las cabeceras predeterminadas y apuntando a `/api/`.

#### Componentes de Vistas y Páginas (`/frontend/src/pages/`)
1. **Login y Entrada (`LoginPage/`)**:
   - `LoginPage.tsx`: Orquesta el flujo visual de entrar.
   - `LoginForm.tsx`, `CreateUserForm.tsx`: Componentes controlados para meter credenciales o registrarse.
   - `BackgroundCards.tsx`: Elementos decorativos CSS que rotan de fondo en el portal de entrada.
2. **El Juego (`MusGamePage/`)**:
   - **`MusGamePage.tsx`**: El tapete verde. Contiene el renderizado principal del tablero y llama dinámicamente a las clases CSS del tapete comprado.
   - **`components/LobbyWaitingRoom.tsx`** / **`PremiumLobby.tsx`**: Salas de espera pre-partida y selección de modo (4/8 reyes), añadir bots, o colas públicas de matchmaking.
   - **`components/ActionPanel.tsx`**: El bloque de botones vital (Mus, Cortar, Envido, Órdago).
   - **`components/PlayerHand.tsx`**: Dibuja tus 4 cartas y oculta el reverso de las cartas enemigas, aplicando la skin de la baraja comprada.
   - **`components/GameScoreBoard.tsx`**: Marcador visual de puntos de los Equipos 1 y 2 en el juego.
   - **`hooks/useMusGame.ts` / `useGameApi.ts`**: Ficheros extremadamente técnicos de Hooks de React que abren el `new WebSocket()` contra Java, serializan el estado del juego recibido y reactualizan el tapete visual.
3. **El Perfil (`ProfilePage/`)**:
   - `ProfilePage.tsx` / `ProfileCard.tsx` / `StatsGrid.tsx`: Calculan y renderizan en pantalla tu ELO, Win Rate %, y dibujan tu Avatar y Título equipados mediante llamadas API.
4. **La Tienda (`ShopPage/`)**:
   - **`ShopPage.tsx`**: Renderiza el inventario del usuario y 4 pestañas de cosméticos (Perfiles, Barajas, Alias, Tapetes). Controla los botones asíncronos para deducir monedas y mandar la señal de `/equip/`.
5. **Ranking y Clasificación (`RankingPage/`)**:
   - **`RankingPage.tsx`**: Un podio renderizado de manera premium que obtiene dinámicamente la lista de los mejores jugadores de la base de datos (Top ELO).
6. **Entorno Social Físico (`MeetUp/` y `TournamentPage/`)**:
   - Componentes (`CreateAdPage.tsx`, `PublishForm.tsx`) para introducir datos reales en formularios, los cuales envían un POST REST para guardarlos en base de datos e imprimirlos en modo tarjetas dinámicas.

#### Estilos (CSS)
* El proyecto no utiliza Tailwind, utiliza CSS Vanilla puro segmentado por página.
* **`frontend/src/styles/variables.css`**: Define una tremenda paleta de colores CSS root (dorados, rojos premium, colores de error).
* Archivos como **`mus-game.css`**, **`shop-page.css`**, **`ranking-page.css`** controlan todas las estéticas de sombras profundas, bordes de madera noble de los tapetes de mesa y colores premium adaptativos.
