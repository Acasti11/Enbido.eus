package com.mus.backend.engine;

import lombok.Data;
import java.util.*;

@Data
public class GameSession {

    private String roomId;
    private Long gameDatabaseId; // ID in play_game table
    private List<GamePlayer> players = new ArrayList<>(Arrays.asList(null, null, null, null)); // Chairs 0 to 3
    private boolean isPlaying = false;
    private String phase = "init"; // init, dealing, mus-check, discarding, betting, round-over
    private String stage = "grande"; // grande, chica, pares, juego, punto
    private int scoreUs = 0; // Chairs 0 and 2
    private int scoreThem = 0; // Chairs 1 and 3
    private List<String> logs = new ArrayList<>();
    private List<Card> deck = new ArrayList<>();
    private List<Card> discardPile = new ArrayList<>();
    
    private int dealerIdx = 0;
    private int activeTurnIdx = 0;
    private int musVotesCount = 0;
    
    // Betting details
    private int currentBetPhase = 0; // Index in LANCES: grande, chica, pares, juego/punto
    private int currentBetSize = 0; // Current bet size on table for the active lance
    private int betState = 0; // 0 = not bet yet (Paso is possible), 1 = envidado, 2 = ordago
    private int lastBettedPlayer = -1; // Who envidó or órdagó last
    
    private Map<String, LanceBet> apuestas = new HashMap<>();

    private static final String[] LANCES = {"grande", "chica", "pares", "juego"};

    @Data
    public static class GamePlayer {
        private Long userId; // null if Bot
        private String username;
        private boolean isBot;
        private List<Card> hand = new ArrayList<>();
        private String speechBubble = "";

        public GamePlayer(Long userId, String username, boolean isBot) {
            this.userId = userId;
            this.username = username;
            this.isBot = isBot;
        }
    }

    @Data
    public static class LanceBet {
        private String ganadaPor = null; // us, them, or null
        private int puntos = 0;
        private int deje = 0;
        private boolean apostado = false;
        private boolean esPunto = false;
    }

    public GameSession(String roomId) {
        this.roomId = roomId;
        resetApuestas();
        appendLog("Sala creada: " + roomId);
    }

    private void resetApuestas() {
        apuestas.clear();
        for (String lance : LANCES) {
            apuestas.put(lance, new LanceBet());
        }
    }

    public void appendLog(String msg) {
        logs.add(0, msg); // New logs at index 0
    }

    public boolean addPlayer(int chair, Long userId, String username) {
        if (chair >= 0 && chair < 4 && players.get(chair) == null) {
            players.set(chair, new GamePlayer(userId, username, false));
            appendLog(username + " se ha sentado en la Silla " + (chair + 1));
            return true;
        }
        return false;
    }

    public boolean addBot(int chair) {
        if (chair >= 0 && chair < 4 && players.get(chair) == null) {
            String name = "Bot " + (chair == 1 ? "Oeste" : chair == 2 ? "Norte" : "Este");
            players.set(chair, new GamePlayer(null, name, true));
            appendLog(name + " se ha sentado en la Silla " + (chair + 1));
            return true;
        }
        return false;
    }

    public void removePlayer(int chair) {
        if (chair >= 0 && chair < 4 && players.get(chair) != null) {
            appendLog(players.get(chair).getUsername() + " ha abandonado la silla.");
            players.set(chair, null);
            isPlaying = false;
            phase = "init";
        }
    }

    public int getFreeChair() {
        for (int i = 0; i < 4; i++) {
            if (players.get(i) == null) return i;
        }
        return -1;
    }

    public int getPlayersCount() {
        int c = 0;
        for (GamePlayer p : players) {
            if (p != null) c++;
        }
        return c;
    }

    // --- GAME ENGINE PROCESSES ---

    public void startMatch() {
        if (getPlayersCount() < 4) {
            appendLog("Esperando a 4 jugadores para iniciar la partida.");
            return;
        }
        scoreUs = 0;
        scoreThem = 0;
        isPlaying = true;
        dealerIdx = 0;
        startNewHand();
    }

    public void startNewHand() {
        resetApuestas();
        phase = "dealing";
        appendLog("--- NUEVA MANO ---");

        // Create and shuffle deck
        deck = Deck.shuffle(Deck.createNewDeck());
        discardPile.clear();

        // Clear hands and bubbles
        for (GamePlayer p : players) {
            p.getHand().clear();
            p.setSpeechBubble("");
        }

        // Deal 4 cards to each player starting next to dealer
        for (int c = 0; c < 4; c++) {
            for (int p = 0; p < 4; p++) {
                int targetIdx = (dealerIdx + 1 + p) % 4;
                if (!deck.isEmpty()) {
                    players.get(targetIdx).getHand().add(deck.remove(deck.size() - 1));
                }
            }
        }

        appendLog("Cartas repartidas.");
        startMusPhase();
    }

    private void startMusPhase() {
        phase = "mus-check";
        musVotesCount = 0;
        for (GamePlayer p : players) {
            p.setSpeechBubble("");
        }
        activeTurnIdx = (dealerIdx + 1) % 4;
        appendLog("Ronda de Mus. Turno de: " + players.get(activeTurnIdx).getUsername());
    }

    public void handleMusDecision(int playerIdx, boolean wantsMus) {
        if (playerIdx != activeTurnIdx || !phase.equals("mus-check")) return;

        GamePlayer p = players.get(playerIdx);
        p.setSpeechBubble(wantsMus ? "¡Mus!" : "¡Corto!");
        appendLog(p.getUsername() + " dice: " + (wantsMus ? "Mus" : "Corto"));

        if (!wantsMus) {
            // Cut Mus immediately, proceed to betting
            appendLog("Mus cortado por " + p.getUsername() + ". Comienzan los lances.");
            startLances();
        } else {
            musVotesCount++;
            if (musVotesCount == 4) {
                // All 4 players want Mus, proceed to discard phase
                startDiscardPhase();
            } else {
                activeTurnIdx = (activeTurnIdx + 1) % 4;
            }
        }
    }

    private void startDiscardPhase() {
        phase = "discarding";
        activeTurnIdx = (dealerIdx + 1) % 4;
        appendLog("Fase de descartes. Turno de: " + players.get(activeTurnIdx).getUsername());
    }

    public void handleDiscards(int playerIdx, List<String> cardIds) {
        if (playerIdx != activeTurnIdx || !phase.equals("discarding")) return;

        GamePlayer p = players.get(playerIdx);
        
        // Remove discarded cards from hand
        List<Card> newHand = new ArrayList<>();
        List<Card> discardedList = new ArrayList<>();
        for (Card card : p.getHand()) {
            if (cardIds.contains(card.getId())) {
                discardedList.add(card);
            } else {
                newHand.add(card);
            }
        }
        p.setHand(newHand);
        discardPile.addAll(discardedList);

        int descCount = cardIds.size();
        p.setSpeechBubble(descCount == 0 ? "¡Servido!" : "Me doy " + descCount);
        appendLog(p.getUsername() + " se descarta de " + descCount + " cartas.");

        // Deal replacement cards
        for (int i = 0; i < descCount; i++) {
            if (deck.isEmpty()) {
                // Reshuffle discard pile if deck runs out
                deck.addAll(discardPile);
                Collections.shuffle(deck);
                discardPile.clear();
            }
            if (!deck.isEmpty()) {
                p.getHand().add(deck.remove(deck.size() - 1));
            }
        }

        // Move to next discard turn
        if (playerIdx == dealerIdx) {
            // Everyone finished discarding, go back to mus-check
            startMusPhase();
        } else {
            activeTurnIdx = (activeTurnIdx + 1) % 4;
        }
    }

    // --- LANCES (BETTING PHASE) ---

    private void startLances() {
        currentBetPhase = 0;
        playNextLance();
    }

    private void playNextLance() {
        if (currentBetPhase >= LANCES.length) {
            calculateFinalScores();
            return;
        }

        String lance = LANCES[currentBetPhase];
        stage = lance;
        phase = "betting";
        currentBetSize = 0;
        betState = 0; // 0 = no bets yet, 1 = envidado, 2 = ordago
        lastBettedPlayer = -1;

        for (GamePlayer p : players) {
            p.setSpeechBubble("");
        }

        if (lance.equals("pares")) {
            appendLog("-- Declaración de Pares --");
            boolean equipoUsTiene = false;
            boolean equipoThemTiene = false;

            for (int i = 0; i < 4; i++) {
                boolean hasPares = evaluatePares(players.get(i).getHand()).isHas();
                players.get(i).setSpeechBubble(hasPares ? "¡Pares sí!" : "¡Pares no!");
                if (hasPares) {
                    if (i % 2 == 0) equipoUsTiene = true;
                    else equipoThemTiene = true;
                }
            }

            if (!equipoUsTiene && !equipoThemTiene) {
                appendLog("Nadie tiene pares. Siguiente lance.");
                currentBetPhase++;
                playNextLance();
                return;
            } else if (equipoUsTiene && !equipoThemTiene) {
                appendLog("Solo el Equipo Nosotros tiene Pares.");
                apuestas.get("pares").setGanadaPor("us");
                currentBetPhase++;
                playNextLance();
                return;
            } else if (!equipoUsTiene && equipoThemTiene) {
                appendLog("Solo el Equipo Rivales tiene Pares.");
                apuestas.get("pares").setGanadaPor("them");
                currentBetPhase++;
                playNextLance();
                return;
            }
        }

        if (lance.equals("juego")) {
            appendLog("-- Declaración de Juego --");
            boolean equipoUsTiene = false;
            boolean equipoThemTiene = false;

            for (int i = 0; i < 4; i++) {
                boolean hasJuego = evaluateJuego(players.get(i).getHand()).isHasJuego();
                players.get(i).setSpeechBubble(hasJuego ? "¡Juego sí!" : "¡Juego no!");
                if (hasJuego) {
                    if (i % 2 == 0) equipoUsTiene = true;
                    else equipoThemTiene = true;
                }
            }

            if (!equipoUsTiene && !equipoThemTiene) {
                appendLog("Nadie tiene Juego. ¡Se juega al PUNTO!");
                stage = "punto";
                apuestas.get("juego").setEsPunto(true);
            } else if (equipoUsTiene && !equipoThemTiene) {
                appendLog("Solo el Equipo Nosotros tiene Juego.");
                apuestas.get("juego").setGanadaPor("us");
                currentBetPhase++;
                playNextLance();
                return;
            } else if (!equipoUsTiene && equipoThemTiene) {
                appendLog("Solo el Equipo Rivales tiene Juego.");
                apuestas.get("juego").setGanadaPor("them");
                currentBetPhase++;
                playNextLance();
                return;
            }
        }

        activeTurnIdx = (dealerIdx + 1) % 4;
        appendLog("Apuestas de la " + stage.toUpperCase() + ". Turno de: " + players.get(activeTurnIdx).getUsername());
    }

    public void handleBetAction(int playerIdx, String action) {
        if (playerIdx != activeTurnIdx || !phase.equals("betting")) return;

        GamePlayer p = players.get(playerIdx);
        String lance = LANCES[currentBetPhase];
        
        if (action.equalsIgnoreCase("Paso")) {
            p.setSpeechBubble("¡Paso!");
            appendLog(p.getUsername() + " pasa.");
            
            if (betState == 0) {
                // If it is the last player to act and all passed, go to next lance
                if (playerIdx == dealerIdx) {
                    appendLog("Todos pasan a la " + stage.toUpperCase() + ".");
                    apuestas.get(lance).setPuntos(1); // Se juega por el paso (vale 1 punto al final)
                    currentBetPhase++;
                    playNextLance();
                } else {
                    activeTurnIdx = (activeTurnIdx + 1) % 4;
                }
            } else {
                // Paso while someone bet means NO QUIERO
                handleNoQuiero(playerIdx);
            }
        } 
        else if (action.equalsIgnoreCase("Envido")) {
            p.setSpeechBubble("¡Envido!");
            appendLog(p.getUsername() + " envida 2 a la " + stage.toUpperCase());
            currentBetSize = 2;
            betState = 1;
            lastBettedPlayer = playerIdx;
            
            // Move turn to the other team's next player
            activeTurnIdx = (playerIdx + 1) % 4;
        } 
        else if (action.equalsIgnoreCase("Ordago")) {
            p.setSpeechBubble("¡ÓRDAGO!");
            appendLog(p.getUsername() + " lanza un ÓRDAGO a la " + stage.toUpperCase());
            currentBetSize = 40; // Representing Game Win/Lose
            betState = 2;
            lastBettedPlayer = playerIdx;
            
            activeTurnIdx = (playerIdx + 1) % 4;
        } 
        else if (action.equalsIgnoreCase("Quiero")) {
            p.setSpeechBubble("¡Quiero!");
            appendLog(p.getUsername() + " acepta el envite de " + currentBetSize + " a la " + stage.toUpperCase());
            
            apuestas.get(lance).setApostado(true);
            apuestas.get(lance).setPuntos(currentBetSize);
            
            currentBetPhase++;
            playNextLance();
        } 
        else if (action.equalsIgnoreCase("No Quiero")) {
            handleNoQuiero(playerIdx);
        }
    }

    private void handleNoQuiero(int playerIdx) {
        GamePlayer p = players.get(playerIdx);
        p.setSpeechBubble("¡No quiero!");
        String lance = LANCES[currentBetPhase];
        
        appendLog(p.getUsername() + " rechaza la apuesta. Rival gana 1 punto de deje.");
        
        // The team of the last player who betted wins the deje
        String winners = (lastBettedPlayer % 2 == 0) ? "us" : "them";
        apuestas.get(lance).setGanadaPor(winners);
        apuestas.get(lance).setDeje(1);
        
        if (betState == 2) {
            // Ordago refused
            appendLog("Órdago no aceptado.");
        }

        currentBetPhase++;
        playNextLance();
    }

    // --- RULES EVALUATION & SHOWDOWN ---

    public void calculateFinalScores() {
        phase = "round-over";
        appendLog("--- RECUENTO FINAL DE PUNTOS ---");

        // 1. Evaluate Grande
        CardItemInfo usBestGrande = getBestGrande(0, 2);
        CardItemInfo themBestGrande = getBestGrande(1, 3);
        
        if (apuestas.get("grande").getGanadaPor() == null) {
            apuestas.get("grande").setGanadaPor(compareGrande(usBestGrande, themBestGrande) >= 0 ? "us" : "them");
        }

        // 2. Evaluate Chica
        CardItemInfo usBestChica = getBestChica(0, 2);
        CardItemInfo themBestChica = getBestChica(1, 3);
        
        if (apuestas.get("chica").getGanadaPor() == null) {
            apuestas.get("chica").setGanadaPor(compareChica(usBestChica, themBestChica) >= 0 ? "us" : "them");
        }

        // 3. Evaluate Pares
        ParesResult usBestPares = getBestPares(0, 2);
        ParesResult themBestPares = getBestPares(1, 3);
        
        if (apuestas.get("pares").getGanadaPor() == null) {
            if (usBestPares != null && themBestPares != null) {
                apuestas.get("pares").setGanadaPor(comparePares(usBestPares, themBestPares) >= 0 ? "us" : "them");
            } else if (usBestPares != null) {
                apuestas.get("pares").setGanadaPor("us");
            } else if (themBestPares != null) {
                apuestas.get("pares").setGanadaPor("them");
            }
        }

        // 4. Evaluate Juego or Punto
        JuegoResult usBestJuego = getBestJuego(0, 2);
        JuegoResult themBestJuego = getBestJuego(1, 3);
        
        if (apuestas.get("juego").getGanadaPor() == null) {
            if (apuestas.get("juego").isEsPunto()) {
                // Compares Punto
                apuestas.get("juego").setGanadaPor(compareJuegoPunto(usBestJuego, themBestJuego) >= 0 ? "us" : "them");
            } else {
                // Compares Juego
                if (usBestJuego.isHasJuego() && themBestJuego.isHasJuego()) {
                    apuestas.get("juego").setGanadaPor(compareJuegoPunto(usBestJuego, themBestJuego) >= 0 ? "us" : "them");
                } else if (usBestJuego.isHasJuego()) {
                    apuestas.get("juego").setGanadaPor("us");
                } else if (themBestJuego.isHasJuego()) {
                    apuestas.get("juego").setGanadaPor("them");
                }
            }
        }

        // Payout the points
        int pointsRoundUs = 0;
        int pointsRoundThem = 0;

        for (String lance : LANCES) {
            LanceBet lb = apuestas.get(lance);
            int gain = lb.getDeje() > 0 ? lb.getDeje() : (lb.getPuntos() == 0 ? 1 : lb.getPuntos());
            if ("us".equals(lb.getGanadaPor())) {
                pointsRoundUs += gain;
            } else if ("them".equals(lb.getGanadaPor())) {
                pointsRoundThem += gain;
            }
        }

        // Additional points for having Pares and Juego/Punto
        for (int i = 0; i < 4; i++) {
            List<Card> h = players.get(i).getHand();
            ParesResult pr = evaluatePares(h);
            if (pr.isHas()) {
                if (i % 2 == 0) pointsRoundUs += pr.getValue();
                else pointsRoundThem += pr.getValue();
                appendLog(players.get(i).getUsername() + " suma +" + pr.getValue() + " por sus Pares (" + pr.getType() + ").");
            }

            JuegoResult jr = evaluateJuego(h);
            if (jr.isHasJuego() && !apuestas.get("juego").isEsPunto()) {
                int bonus = jr.getSum() == 31 ? 3 : 2;
                if (i % 2 == 0) pointsRoundUs += bonus;
                else pointsRoundThem += bonus;
                appendLog(players.get(i).getUsername() + " suma +" + bonus + " por su Juego de " + jr.getSum() + ".");
            } else if (apuestas.get("juego").isEsPunto() && "us".equals(apuestas.get("juego").getGanadaPor()) && i == 0) {
                // Winner of Punto gets +1 bonus
                pointsRoundUs += 1;
                appendLog(players.get(0).getUsername() + " suma +1 por ganar el Punto.");
            } else if (apuestas.get("juego").isEsPunto() && "them".equals(apuestas.get("juego").getGanadaPor()) && i == 1) {
                pointsRoundThem += 1;
                appendLog(players.get(1).getUsername() + " suma +1 por ganar el Punto.");
            }
        }

        scoreUs = Math.min(scoreUs + pointsRoundUs, 30);
        scoreThem = Math.min(scoreThem + pointsRoundThem, 30);

        appendLog(String.format("Puntos sumados -> Nosotros: %d | Rivales: %d", pointsRoundUs, pointsRoundThem));
        
        // Check game over
        if (scoreUs >= 30 || scoreThem >= 30) {
            isPlaying = false;
            appendLog("--- FIN DE LA PARTIDA ---");
            if (scoreUs >= 30) {
                appendLog("🏆 ¡NOSOTROS HEMOS GANADO EL ENCUENTRO!");
            } else {
                appendLog("💔 ¡RIVALES GANAN EL ENCUENTRO!");
            }
        }
    }

    // --- CARD DETAILS UTILS ---

    @Data
    public static class CardItemInfo {
        private Card card;
        private int realOrder; // 3=12, 12=12, 11=11, 10=10, 2=1, 1=1...
    }

    public static CardItemInfo getCardDetails(Card c) {
        CardItemInfo info = new CardItemInfo();
        info.setCard(c);
        int r = c.getRank();
        if (r == 3) info.setRealOrder(12); // 3 es Rey
        else if (r == 2) info.setRealOrder(1); // 2 es As
        else if (r == 1) info.setRealOrder(1);
        else info.setRealOrder(r);
        return info;
    }

    public static List<CardItemInfo> getSortedGrande(List<Card> hand) {
        List<CardItemInfo> list = new ArrayList<>();
        for (Card c : hand) {
            list.add(getCardDetails(c));
        }
        list.sort((a, b) -> b.getRealOrder() - a.getRealOrder());
        return list;
    }

    public static List<CardItemInfo> getSortedChica(List<Card> hand) {
        List<CardItemInfo> list = new ArrayList<>();
        for (Card c : hand) {
            list.add(getCardDetails(c));
        }
        list.sort((a, b) -> a.getRealOrder() - b.getRealOrder());
        return list;
    }

    private CardItemInfo getBestGrande(int p1, int p2) {
        List<CardItemInfo> h1 = getSortedGrande(players.get(p1).getHand());
        List<CardItemInfo> h2 = getSortedGrande(players.get(p2).getHand());
        return compareGrande(h1.get(0), h2.get(0)) >= 0 ? h1.get(0) : h2.get(0);
    }

    private int compareGrande(CardItemInfo a, CardItemInfo b) {
        return a.getRealOrder() - b.getRealOrder();
    }

    private CardItemInfo getBestChica(int p1, int p2) {
        List<CardItemInfo> h1 = getSortedChica(players.get(p1).getHand());
        List<CardItemInfo> h2 = getSortedChica(players.get(p2).getHand());
        return compareChica(h1.get(0), h2.get(0)) >= 0 ? h1.get(0) : h2.get(0);
    }

    private int compareChica(CardItemInfo a, CardItemInfo b) {
        return b.getRealOrder() - a.getRealOrder(); // Smaller realOrder is better
    }

    @Data
    public static class ParesResult {
        private boolean has;
        private String type; // Par, Medias, Duples
        private int value; // 1, 2, 3
        private int orderVal;
    }

    public static ParesResult evaluatePares(List<Card> hand) {
        ParesResult pr = new ParesResult();
        Map<Integer, Integer> counts = new HashMap<>();
        for (Card c : hand) {
            int order = getCardDetails(c).getRealOrder();
            counts.put(order, counts.getOrDefault(order, 0) + 1);
        }
        List<Integer> frequencies = new ArrayList<>(counts.values());
        frequencies.sort(Collections.reverseOrder());
        
        List<CardItemInfo> sorted = getSortedGrande(hand);
        int maxVal = sorted.get(0).getCard().getRank();

        if (frequencies.isEmpty()) {
            pr.setHas(false);
            pr.setType("Nada");
            pr.setValue(0);
            return pr;
        }

        if (frequencies.get(0) == 4) {
            pr.setHas(true);
            pr.setType("Duples");
            pr.setValue(3);
            pr.setOrderVal(maxVal);
            return pr;
        }
        if (frequencies.get(0) == 3) {
            pr.setHas(true);
            pr.setType("Medias");
            pr.setValue(2);
            pr.setOrderVal(maxVal);
            return pr;
        }
        if (frequencies.get(0) == 2 && frequencies.size() >= 2 && frequencies.get(1) == 2) {
            pr.setHas(true);
            pr.setType("Duples");
            pr.setValue(3);
            pr.setOrderVal(maxVal);
            return pr;
        }
        if (frequencies.get(0) == 2) {
            int pairRank = 0;
            for (Map.Entry<Integer, Integer> e : counts.entrySet()) {
                if (e.getValue() == 2) {
                    pairRank = e.getKey();
                    break;
                }
            }
            pr.setHas(true);
            pr.setType("Par");
            pr.setValue(1);
            pr.setOrderVal(pairRank);
            return pr;
        }

        pr.setHas(false);
        pr.setType("Nada");
        pr.setValue(0);
        return pr;
    }

    private ParesResult getBestPares(int p1, int p2) {
        ParesResult r1 = evaluatePares(players.get(p1).getHand());
        ParesResult r2 = evaluatePares(players.get(p2).getHand());
        if (r1.isHas() && r2.isHas()) {
            return comparePares(r1, r2) >= 0 ? r1 : r2;
        }
        return r1.isHas() ? r1 : (r2.isHas() ? r2 : null);
    }

    private int comparePares(ParesResult a, ParesResult b) {
        if (a.getValue() != b.getValue()) return a.getValue() - b.getValue();
        return a.getOrderVal() - b.getOrderVal();
    }

    @Data
    public static class JuegoResult {
        private boolean hasJuego;
        private int sum;
        private int strength; // 31=8, 32=7, 40=6, 37=5...
    }

    public static JuegoResult evaluateJuego(List<Card> hand) {
        JuegoResult jr = new JuegoResult();
        int sum = 0;
        for (Card c : hand) {
            sum += getCardDetails(c).getCard().getScoreValue();
        }
        jr.setSum(sum);
        
        if (sum >= 31) {
            jr.setHasJuego(true);
            // Strength ordering: 31 (8) > 32 (7) > 40 (6) > 37 (5) > 36 (4) > 35 (3) > 34 (2) > 33 (1)
            int str = 0;
            if (sum == 31) str = 8;
            else if (sum == 32) str = 7;
            else if (sum == 40) str = 6;
            else str = sum - 30; // 37 -> 7, 36 -> 6... wait, the original formula in frontend was sum - 30.
            // Let's copy frontend exactly: strength = sum === 31 ? 8 : (sum === 32 ? 7 : (sum === 40 ? 6 : sum - 30));
            jr.setStrength(str);
        } else {
            jr.setHasJuego(false);
            jr.setStrength(sum); // for punto, higher sum is better (30 is best)
        }
        return jr;
    }

    private JuegoResult getBestJuego(int p1, int p2) {
        JuegoResult r1 = evaluateJuego(players.get(p1).getHand());
        JuegoResult r2 = evaluateJuego(players.get(p2).getHand());
        return compareJuegoPunto(r1, r2) >= 0 ? r1 : r2;
    }

    private int compareJuegoPunto(JuegoResult a, JuegoResult b) {
        return a.getStrength() - b.getStrength();
    }

    // --- SECURE STATE SERIALIZATION FOR EACH CLIENT ---

    public Map<String, Object> toClientState(int playerIdx) {
        Map<String, Object> state = new HashMap<>();
        state.put("roomId", roomId);
        state.put("isPlaying", isPlaying);
        state.put("phase", phase);
        state.put("stage", stage);
        state.put("logs", logs);
        state.put("activeTurnIdx", activeTurnIdx);
        state.put("dealerIdx", dealerIdx);
        state.put("betState", betState);
        state.put("currentBetSize", currentBetSize);
        
        Map<String, Integer> score = new HashMap<>();
        score.put("us", scoreUs);
        score.put("them", scoreThem);
        state.put("score", score);

        // Speech bubbles
        // [Tú, Oeste, Norte, Este] relative to playerIdx
        List<String> bubbles = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            int relativeIdx = (playerIdx + i) % 4;
            GamePlayer gp = players.get(relativeIdx);
            bubbles.add(gp != null ? gp.getSpeechBubble() : "");
        }
        state.put("speechBubbles", bubbles);

        // Player's actual hand
        GamePlayer self = players.get(playerIdx);
        state.put("playerHand", self != null ? self.getHand() : new ArrayList<>());

        // Hands of the other players
        // In the green felt representation: [Bot Norte, Bot Oeste, Bot Este] (or rather relative Chairs 2, 1, 3 relative to us)
        // Let's build botHands array: [Chair 2 relative, Chair 1 relative, Chair 3 relative]
        List<List<Map<String, Object>>> otherHands = new ArrayList<>();
        int[] relativeChairs = {2, 1, 3}; // North, West, East relative to South (0)
        
        for (int offset : relativeChairs) {
            int targetIdx = (playerIdx + offset) % 4;
            GamePlayer other = players.get(targetIdx);
            List<Map<String, Object>> cardsMasked = new ArrayList<>();
            
            if (other != null) {
                for (Card c : other.getHand()) {
                    Map<String, Object> cMap = new HashMap<>();
                    if (phase.equals("round-over")) {
                        // REVEAL! Send actual cards at showdown
                        cMap.put("id", c.getId());
                        cMap.put("suit", c.getSuit());
                        cMap.put("rank", c.getRank());
                        cMap.put("imagePath", c.getImagePath());
                        cMap.put("scoreValue", c.getScoreValue());
                    } else {
                        // CONCEALED! Hide other players' cards!
                        cMap.put("id", c.getId());
                        cMap.put("imagePath", "/cards/back.png"); // Show card back
                    }
                    cardsMasked.add(cMap);
                }
            }
            otherHands.add(cardsMasked);
        }
        state.put("botHands", otherHands);

        // Seat labels for the frontend
        List<Map<String, Object>> seats = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            int relativeIdx = (playerIdx + i) % 4;
            GamePlayer gp = players.get(relativeIdx);
            Map<String, Object> seatInfo = new HashMap<>();
            seatInfo.put("chair", relativeIdx);
            seatInfo.put("username", gp != null ? gp.getUsername() : "Vacío");
            seatInfo.put("isBot", gp != null && gp.isBot());
            seatInfo.put("userId", gp != null ? gp.getUserId() : null);
            seats.add(seatInfo);
        }
        state.put("seats", seats);
        
        // Is current user's turn?
        state.put("isMyTurn", activeTurnIdx == playerIdx);

        return state;
    }

    // --- SERVER-SIDE BOT AUTOMATION ---

    public boolean runBotTurnIfActive() {
        if (!isPlaying || phase.equals("round-over")) return false;
        
        GamePlayer current = players.get(activeTurnIdx);
        if (current == null || !current.isBot()) return false;

        // Simulate Bot Turn based on active phase
        int botIdx = activeTurnIdx;
        
        if (phase.equals("mus-check")) {
            // Bots want Mus 70% of time
            boolean botWantsMus = Math.random() > 0.3;
            handleMusDecision(botIdx, botWantsMus);
            return true;
        } 
        else if (phase.equals("discarding")) {
            // Bot discards 1 to 3 random cards
            List<String> cardIdsToDiscard = new ArrayList<>();
            List<Card> h = current.getHand();
            int numDiscards = Math.min((int)(Math.random() * 3) + 1, h.size());
            for (int i = 0; i < numDiscards; i++) {
                cardIdsToDiscard.add(h.get(i).getId());
            }
            handleDiscards(botIdx, cardIdsToDiscard);
            return true;
        } 
        else if (phase.equals("betting")) {
            // Bot betting AI
            if (betState > 0) {
                // An active bet is placed. Bot decides Quiero / No Quiero.
                // 60% Quiero, 40% No Quiero
                boolean accepts = Math.random() > 0.4;
                handleBetAction(botIdx, accepts ? "Quiero" : "No Quiero");
            } else {
                // No bets placed. Bot decides Paso / Envido / Ordago.
                // 70% Paso, 25% Envido, 5% Ordago
                double r = Math.random();
                if (r < 0.70) {
                    handleBetAction(botIdx, "Paso");
                } else if (r < 0.95) {
                    handleBetAction(botIdx, "Envido");
                } else {
                    handleBetAction(botIdx, "Ordago");
                }
            }
            return true;
        }
        return false;
    }
}
