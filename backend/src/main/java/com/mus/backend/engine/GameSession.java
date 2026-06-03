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
    
    // Points in the current Chico/Round (up to 30)
    private int scoreUs = 0; // Chairs 0 and 2
    private int scoreThem = 0; // Chairs 1 and 3
    
    // Chicos (sets) won in the current Match
    private int roundsWonUs = 0;
    private int roundsWonThem = 0;
    private long turnDeadline = 0; // Epoch ms for when the current turn must finish

    private List<String> logs = new ArrayList<>();
    private List<String> chatMessages = new ArrayList<>();
    private List<Card> deck = new ArrayList<>();
    private List<Card> discardPile = new ArrayList<>();
    
    private int dealerIdx = 0;
    private int activeTurnIdx = 0;
    private int musVotesCount = 0;
    
    // Betting details
    private int currentBetPhase = 0; // Index in LANCES
    private int currentBetSize = 0; // Current bet size on table for the active lance
    private int betState = 0; // 0 = Paso/not bet yet, 1 = envidado, 2 = ordago
    private int lastBettedPlayer = -1; // Who envidó or órdagó last
    
    private Map<String, LanceBet> apuestas = new HashMap<>();
    private GameConfig config = new GameConfig(); // Dynamic game settings
    private final Set<Integer> leaveVotes = new HashSet<>();

    public GameSession(String roomId) {
        this.roomId = roomId;
        resetApuestas();
        appendLog("Mesa privada creada: " + roomId);
    }

    public void resetApuestas() {
        apuestas.clear();
        String[] lances = {"grande", "chica", "pares", "juego"};
        for (String lance : lances) {
            apuestas.put(lance, new LanceBet());
        }
    }

    public void appendLog(String msg) {
        logs.add(0, msg); // New logs at index 0
    }

    public void appendChatMessage(String msg) {
        chatMessages.add(msg);
        if (chatMessages.size() > 50) {
            chatMessages.remove(0);
        }
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
            clearLeaveVotes();
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

    public synchronized void addLeaveVote(int chair) {
        leaveVotes.add(chair);
    }

    public synchronized void removeLeaveVote(int chair) {
        leaveVotes.remove(chair);
    }

    public synchronized boolean hasBothTeamsVotedToLeave() {
        boolean team1 = leaveVotes.contains(0) || leaveVotes.contains(2);
        boolean team2 = leaveVotes.contains(1) || leaveVotes.contains(3);
        return team1 && team2;
    }

    public synchronized Set<Integer> getLeaveVotes() {
        return new HashSet<>(leaveVotes);
    }

    public synchronized void clearLeaveVotes() {
        leaveVotes.clear();
    }

    // --- DELEGACIÓN DE ACCIONES ---

    public void handleMusDecision(int playerIdx, boolean wantsMus) {
        DiscardHandler.handleMusDecision(this, playerIdx, wantsMus);
    }

    public void handleDiscards(int playerIdx, List<String> cardIds) {
        DiscardHandler.handleDiscards(this, playerIdx, cardIds);
    }

    public void handleBetAction(int playerIdx, String action) {
        BettingHandler.handleBetAction(this, playerIdx, action);
    }

    // --- GAME ENGINE LOOP ---

    public void startMatch() {
        if (getPlayersCount() < 4) {
            appendLog("Esperando a 4 jugadores para iniciar la partida.");
            return;
        }
        scoreUs = 0;
        scoreThem = 0;
        roundsWonUs = 0;
        roundsWonThem = 0;
        isPlaying = true;
        dealerIdx = 0;
        clearLeaveVotes();
        appendLog("--- COMIENZA LA PARTIDA ---");
        appendLog("Configuración: Mus a " + (config.getReyesOption().equals("8") ? "8 Reyes" : "4 Reyes") + " | Ganar a " + config.getMaxRounds() + " chicos.");
        startNewHand();
    }

    public void startNewHand() {
        if (scoreUs >= 30 || scoreThem >= 30) {
            scoreUs = 0;
            scoreThem = 0;
        }
        resetApuestas();
        phase = "dealing";
        appendLog("--- NUEVA MANO ---");

        // Create and shuffle deck
        deck = Deck.shuffle(Deck.createNewDeck());
        
        // Ensure card score values are up to date with config
        for (Card c : deck) {
            c.updateScoreValue(config.getReyesOption());
        }
        discardPile.clear();

        // Clear hands and bubbles
        for (GamePlayer p : players) {
            if (p != null) {
                p.getHand().clear();
                p.setSpeechBubble("");
            }
        }

        // Deal 4 cards to each player starting next to dealer
        for (int c = 0; c < 4; c++) {
            for (int p = 0; p < 4; p++) {
                int targetIdx = (dealerIdx + 1 + p) % 4;
                if (!deck.isEmpty() && players.get(targetIdx) != null) {
                    Card card = deck.remove(deck.size() - 1);
                    card.updateScoreValue(config.getReyesOption());
                    players.get(targetIdx).getHand().add(card);
                }
            }
        }

        appendLog("Cartas repartidas.");
        DiscardHandler.startMusPhase(this);
    }

    public void calculateFinalScores() {
        phase = "round-over";
        appendLog("--- RECUENTO FINAL DE PUNTOS ---");

        String reyesOpt = config.getReyesOption();

        // 1. Evaluate Grande
        int bestUsGrandeIdx = RulesEvaluator.compareGrande(players.get(0).getHand(), 0, players.get(2).getHand(), 2, dealerIdx, reyesOpt) >= 0 ? 0 : 2;
        int bestThemGrandeIdx = RulesEvaluator.compareGrande(players.get(1).getHand(), 1, players.get(3).getHand(), 3, dealerIdx, reyesOpt) >= 0 ? 1 : 3;
        boolean usWinsGrande = RulesEvaluator.compareGrande(players.get(bestUsGrandeIdx).getHand(), bestUsGrandeIdx, players.get(bestThemGrandeIdx).getHand(), bestThemGrandeIdx, dealerIdx, reyesOpt) >= 0;

        if (apuestas.get("grande").getGanadaPor() == null) {
            apuestas.get("grande").setGanadaPor(usWinsGrande ? "us" : "them");
        }

        // 2. Evaluate Chica
        int bestUsChicaIdx = RulesEvaluator.compareChica(players.get(0).getHand(), 0, players.get(2).getHand(), 2, dealerIdx, reyesOpt) >= 0 ? 0 : 2;
        int bestThemChicaIdx = RulesEvaluator.compareChica(players.get(1).getHand(), 1, players.get(3).getHand(), 3, dealerIdx, reyesOpt) >= 0 ? 1 : 3;
        boolean usWinsChica = RulesEvaluator.compareChica(players.get(bestUsChicaIdx).getHand(), bestUsChicaIdx, players.get(bestThemChicaIdx).getHand(), bestThemChicaIdx, dealerIdx, reyesOpt) >= 0;

        if (apuestas.get("chica").getGanadaPor() == null) {
            apuestas.get("chica").setGanadaPor(usWinsChica ? "us" : "them");
        }

        // 3. Evaluate Pares
        RulesEvaluator.ParesResult[] paresResults = new RulesEvaluator.ParesResult[4];
        for (int i = 0; i < 4; i++) {
            paresResults[i] = RulesEvaluator.evaluatePares(players.get(i).getHand(), reyesOpt);
        }

        if (apuestas.get("pares").getGanadaPor() == null) {
            RulesEvaluator.ParesResult bestUsPares = null;
            int bestUsParesIdx = -1;
            if (paresResults[0].isHas() && paresResults[2].isHas()) {
                int cmp = RulesEvaluator.comparePares(paresResults[0], 0, paresResults[2], 2, dealerIdx);
                bestUsParesIdx = cmp >= 0 ? 0 : 2;
                bestUsPares = paresResults[bestUsParesIdx];
            } else if (paresResults[0].isHas()) {
                bestUsParesIdx = 0;
                bestUsPares = paresResults[0];
            } else if (paresResults[2].isHas()) {
                bestUsParesIdx = 2;
                bestUsPares = paresResults[2];
            }

            RulesEvaluator.ParesResult bestThemPares = null;
            int bestThemParesIdx = -1;
            if (paresResults[1].isHas() && paresResults[3].isHas()) {
                int cmp = RulesEvaluator.comparePares(paresResults[1], 1, paresResults[3], 3, dealerIdx);
                bestThemParesIdx = cmp >= 0 ? 1 : 3;
                bestThemPares = paresResults[bestThemParesIdx];
            } else if (paresResults[1].isHas()) {
                bestThemParesIdx = 1;
                bestThemPares = paresResults[1];
            } else if (paresResults[3].isHas()) {
                bestThemParesIdx = 3;
                bestThemPares = paresResults[3];
            }

            if (bestUsPares != null && bestThemPares != null) {
                boolean usWinsPares = RulesEvaluator.comparePares(bestUsPares, bestUsParesIdx, bestThemPares, bestThemParesIdx, dealerIdx) >= 0;
                apuestas.get("pares").setGanadaPor(usWinsPares ? "us" : "them");
            } else if (bestUsPares != null) {
                apuestas.get("pares").setGanadaPor("us");
            } else if (bestThemPares != null) {
                apuestas.get("pares").setGanadaPor("them");
            }
        }

        // 4. Evaluate Juego or Punto
        RulesEvaluator.JuegoResult[] juegoResults = new RulesEvaluator.JuegoResult[4];
        for (int i = 0; i < 4; i++) {
            juegoResults[i] = RulesEvaluator.evaluateJuego(players.get(i).getHand(), reyesOpt);
        }
        boolean isPunto = apuestas.get("juego").isEsPunto();

        if (apuestas.get("juego").getGanadaPor() == null) {
            RulesEvaluator.JuegoResult bestUsJuego = null;
            int bestUsJuegoIdx = -1;
            if (!isPunto) {
                if (juegoResults[0].isHasJuego() && juegoResults[2].isHasJuego()) {
                    int cmp = RulesEvaluator.compareJuegoPunto(juegoResults[0], 0, juegoResults[2], 2, dealerIdx);
                    bestUsJuegoIdx = cmp >= 0 ? 0 : 2;
                    bestUsJuego = juegoResults[bestUsJuegoIdx];
                } else if (juegoResults[0].isHasJuego()) {
                    bestUsJuegoIdx = 0;
                    bestUsJuego = juegoResults[0];
                } else if (juegoResults[2].isHasJuego()) {
                    bestUsJuegoIdx = 2;
                    bestUsJuego = juegoResults[2];
                }
            } else {
                int cmp = RulesEvaluator.compareJuegoPunto(juegoResults[0], 0, juegoResults[2], 2, dealerIdx);
                bestUsJuegoIdx = cmp >= 0 ? 0 : 2;
                bestUsJuego = juegoResults[bestUsJuegoIdx];
            }

            RulesEvaluator.JuegoResult bestThemJuego = null;
            int bestThemJuegoIdx = -1;
            if (!isPunto) {
                if (juegoResults[1].isHasJuego() && juegoResults[3].isHasJuego()) {
                    int cmp = RulesEvaluator.compareJuegoPunto(juegoResults[1], 1, juegoResults[3], 3, dealerIdx);
                    bestThemJuegoIdx = cmp >= 0 ? 1 : 3;
                    bestThemJuego = juegoResults[bestThemJuegoIdx];
                } else if (juegoResults[1].isHasJuego()) {
                    bestThemJuegoIdx = 1;
                    bestThemJuego = juegoResults[1];
                } else if (juegoResults[3].isHasJuego()) {
                    bestThemJuegoIdx = 3;
                    bestThemJuego = juegoResults[3];
                }
            } else {
                int cmp = RulesEvaluator.compareJuegoPunto(juegoResults[1], 1, juegoResults[3], 3, dealerIdx);
                bestThemJuegoIdx = cmp >= 0 ? 1 : 3;
                bestThemJuego = juegoResults[bestThemJuegoIdx];
            }

            if (bestUsJuego != null && bestThemJuego != null) {
                boolean usWinsJuego = RulesEvaluator.compareJuegoPunto(bestUsJuego, bestUsJuegoIdx, bestThemJuego, bestThemJuegoIdx, dealerIdx) >= 0;
                apuestas.get("juego").setGanadaPor(usWinsJuego ? "us" : "them");
            } else if (bestUsJuego != null) {
                apuestas.get("juego").setGanadaPor("us");
            } else if (bestThemJuego != null) {
                apuestas.get("juego").setGanadaPor("them");
            }
        }

        // Payout the points for bets
        int pointsRoundUs = 0;
        int pointsRoundThem = 0;

        for (String lance : apuestas.keySet()) {
            LanceBet lb = apuestas.get(lance);
            int gain = lb.getDeje() > 0 ? lb.getDeje() : (lb.getPuntos() == 0 ? 1 : lb.getPuntos());
            if ("us".equals(lb.getGanadaPor())) {
                pointsRoundUs += gain;
            } else if ("them".equals(lb.getGanadaPor())) {
                pointsRoundThem += gain;
            }
        }

        // Additional points for having Pares and Juego/Punto (Official Mus Rules: ONLY WINNING TEAM SCORES!)
        String paresWinner = apuestas.get("pares").getGanadaPor();
        if (paresWinner != null) {
            for (int i = 0; i < 4; i++) {
                boolean isUs = (i % 2 == 0);
                boolean isWinnerTeam = (isUs && "us".equals(paresWinner)) || (!isUs && "them".equals(paresWinner));
                if (isWinnerTeam) {
                    RulesEvaluator.ParesResult pr = paresResults[i];
                    if (pr.isHas()) {
                        if (isUs) pointsRoundUs += pr.getValue();
                        else pointsRoundThem += pr.getValue();
                        appendLog(players.get(i).getUsername() + " suma +" + pr.getValue() + " por sus Pares (" + pr.getType() + ").");
                    }
                }
            }
        }

        String juegoWinner = apuestas.get("juego").getGanadaPor();
        if (juegoWinner != null) {
            if (!isPunto) {
                for (int i = 0; i < 4; i++) {
                    boolean isUs = (i % 2 == 0);
                    boolean isWinnerTeam = (isUs && "us".equals(juegoWinner)) || (!isUs && "them".equals(juegoWinner));
                    if (isWinnerTeam) {
                        RulesEvaluator.JuegoResult jr = juegoResults[i];
                        if (jr.isHasJuego()) {
                            int bonus = jr.getSum() == 31 ? 3 : 2;
                            if (isUs) pointsRoundUs += bonus;
                            else pointsRoundThem += bonus;
                            appendLog(players.get(i).getUsername() + " suma +" + bonus + " por su Juego de " + jr.getSum() + ".");
                        }
                    }
                }
            } else {
                // Punto: +1 point to the winning team of Punto
                if ("us".equals(juegoWinner)) {
                    pointsRoundUs += 1;
                    appendLog("Nosotros sumamos +1 por ganar el Punto.");
                } else {
                    pointsRoundThem += 1;
                    appendLog("Rivales sumaron +1 por ganar el Punto.");
                }
            }
        }

        // Update score of the current Chico
        scoreUs = Math.min(scoreUs + pointsRoundUs, 30);
        scoreThem = Math.min(scoreThem + pointsRoundThem, 30);

        appendLog(String.format("Puntos sumados en el chico -> Nosotros: %d | Rivales: %d", pointsRoundUs, pointsRoundThem));
        
        // Check chico over
        if (scoreUs >= 30 || scoreThem >= 30) {
            if (scoreUs >= 30) {
                roundsWonUs++;
                appendLog("🏆 ¡NOSOTROS HEMOS GANADO ESTE CHICO! (" + roundsWonUs + " - " + roundsWonThem + ")");
            } else {
                roundsWonThem++;
                appendLog("💔 ¡RIVALES GANAN ESTE CHICO! (" + roundsWonUs + " - " + roundsWonThem + ")");
            }

            // Check match over
            if (roundsWonUs >= config.getMaxRounds() || roundsWonThem >= config.getMaxRounds()) {
                isPlaying = false;
                appendLog("--- FIN DE LA PARTIDA ---");
                if (roundsWonUs >= config.getMaxRounds()) {
                    appendLog("🏆 🏆 ¡NOSOTROS GANAMOS EL ENCUENTRO!");
                } else {
                    appendLog("💔 💔 ¡RIVALES GANAN EL ENCUENTRO!");
                }
            }
        }

        // Shift dealer for the next hand
        dealerIdx = (dealerIdx + 1) % 4;
    }

    // --- SECURE STATE SERIALIZATION FOR EACH CLIENT ---

    public Map<String, Object> toClientState(int playerIdx) {
        Map<String, Object> state = new HashMap<>();
        state.put("roomId", roomId);
        state.put("isPlaying", isPlaying);
        state.put("phase", phase);
        state.put("stage", stage);
        state.put("logs", logs);
        
        List<String> clientChat = new ArrayList<>();
        for (String rawMsg : chatMessages) {
            if (rawMsg.startsWith("[Chair:")) {
                int firstClose = rawMsg.indexOf("] ");
                if (firstClose > 7) {
                    try {
                        String cleanMsg = rawMsg.substring(firstClose + 2);
                        clientChat.add(cleanMsg);
                    } catch (NumberFormatException e) {
                        clientChat.add(rawMsg);
                    }
                } else {
                    clientChat.add(rawMsg);
                }
            } else {
                clientChat.add(rawMsg);
            }
        }
        state.put("chatMessages", clientChat);
        state.put("activeTurnIdx", activeTurnIdx);
        state.put("dealerIdx", dealerIdx);
        state.put("betState", betState);
        state.put("currentBetSize", currentBetSize);
        state.put("reyesOption", config.getReyesOption());
        state.put("maxRounds", config.getMaxRounds());
        state.put("roundsWonUs", roundsWonUs);
        state.put("roundsWonThem", roundsWonThem);
        state.put("turnDeadline", turnDeadline);
        
        Map<String, Object> score = new HashMap<>();
        score.put("us", scoreUs);
        score.put("them", scoreThem);
        score.put("roundsUs", roundsWonUs);
        score.put("roundsThem", roundsWonThem);
        state.put("score", score);

        // Speech bubbles
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
        List<List<Map<String, Object>>> otherHands = new ArrayList<>();
        int[] relativeChairs = {2, 1, 3}; // North, West, East relative to us (South / 0)
        
        for (int offset : relativeChairs) {
            int targetIdx = (playerIdx + offset) % 4;
            GamePlayer other = players.get(targetIdx);
            List<Map<String, Object>> cardsMasked = new ArrayList<>();
            
            if (other != null) {
                for (Card c : other.getHand()) {
                    Map<String, Object> cMap = new HashMap<>();
                    if (phase.equals("round-over")) {
                        cMap.put("id", c.getId());
                        cMap.put("suit", c.getSuit());
                        cMap.put("rank", c.getRank());
                        cMap.put("imagePath", c.getImagePath());
                        cMap.put("scoreValue", c.getScoreValue());
                    } else {
                        cMap.put("id", c.getId());
                        cMap.put("imagePath", "/cards/back.png");
                    }
                    cardsMasked.add(cMap);
                }
            }
            otherHands.add(cardsMasked);
        }
        state.put("botHands", otherHands);

        // Seat labels
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
        
        state.put("isMyTurn", activeTurnIdx == playerIdx);
        state.put("leaveVotes", new ArrayList<>(getLeaveVotes()));

        return state;
    }

    // --- SERVER-SIDE BOT AUTOMATION ---

    public boolean runBotTurnIfActive() {
        if (!isPlaying || phase.equals("round-over")) return false;
        
        GamePlayer current = players.get(activeTurnIdx);
        if (current == null || !current.isBot()) return false;

        int botIdx = activeTurnIdx;
        
        if (phase.equals("mus-check")) {
            boolean botWantsMus = Math.random() > 0.4;
            handleMusDecision(botIdx, botWantsMus);
            return true;
        } 
        else if (phase.equals("discarding")) {
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
            if (betState > 0) {
                boolean accepts = Math.random() > 0.35;
                handleBetAction(botIdx, accepts ? "Quiero" : "No Quiero");
            } else {
                double r = Math.random();
                if (r < 0.75) {
                    handleBetAction(botIdx, "Paso");
                } else if (r < 0.97) {
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
