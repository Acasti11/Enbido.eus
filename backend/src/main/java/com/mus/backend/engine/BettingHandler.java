package com.mus.backend.engine;

import java.util.*;

public class BettingHandler {

    private static final String[] LANCES = {"grande", "chica", "pares", "juego"};

    public static void startLances(GameSession session) {
        session.setCurrentBetPhase(0);
        playNextLance(session);
    }

    public static void playNextLance(GameSession session) {
        if (session.getCurrentBetPhase() >= LANCES.length) {
            session.calculateFinalScores();
            return;
        }

        String lance = LANCES[session.getCurrentBetPhase()];
        session.setStage(lance);
        session.setPhase("betting");
        session.setCurrentBetSize(0);
        session.setBetState(0);
        session.setLastBettedPlayer(-1);

        for (GamePlayer p : session.getPlayers()) {
            if (p != null) p.setSpeechBubble("");
        }

        if (lance.equals("pares")) {
            session.appendLog("-- Declaración de Pares --");
            boolean equipoUsTiene = false;
            boolean equipoThemTiene = false;

            for (int i = 0; i < 4; i++) {
                GamePlayer p = session.getPlayers().get(i);
                if (p != null) {
                    boolean hasPares = RulesEvaluator.evaluatePares(p.getHand(), session.getConfig().getReyesOption()).isHas();
                    p.setSpeechBubble(hasPares ? "¡Pares sí!" : "¡Pares no!");
                    if (hasPares) {
                        if (i % 2 == 0) equipoUsTiene = true;
                        else equipoThemTiene = true;
                    }
                }
            }

            if (!equipoUsTiene && !equipoThemTiene) {
                session.appendLog("Nadie tiene pares. Siguiente lance.");
                session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
                playNextLance(session);
                return;
            } else if (equipoUsTiene && !equipoThemTiene) {
                session.appendLog("Solo el Equipo Nosotros tiene Pares.");
                session.getApuestas().get("pares").setGanadaPor("us");
                session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
                playNextLance(session);
                return;
            } else if (!equipoUsTiene && equipoThemTiene) {
                session.appendLog("Solo el Equipo Rivales tiene Pares.");
                session.getApuestas().get("pares").setGanadaPor("them");
                session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
                playNextLance(session);
                return;
            }
        }

        if (lance.equals("juego")) {
            session.appendLog("-- Declaración de Juego --");
            boolean equipoUsTiene = false;
            boolean equipoThemTiene = false;

            for (int i = 0; i < 4; i++) {
                GamePlayer p = session.getPlayers().get(i);
                if (p != null) {
                    boolean hasJuego = RulesEvaluator.evaluateJuego(p.getHand(), session.getConfig().getReyesOption()).isHasJuego();
                    p.setSpeechBubble(hasJuego ? "¡Juego sí!" : "¡Juego no!");
                    if (hasJuego) {
                        if (i % 2 == 0) equipoUsTiene = true;
                        else equipoThemTiene = true;
                    }
                }
            }

            if (!equipoUsTiene && !equipoThemTiene) {
                session.appendLog("Nadie tiene Juego. ¡Se juega al PUNTO!");
                session.setStage("punto");
                session.getApuestas().get("juego").setEsPunto(true);
            } else if (equipoUsTiene && !equipoThemTiene) {
                session.appendLog("Solo el Equipo Nosotros tiene Juego.");
                session.getApuestas().get("juego").setGanadaPor("us");
                session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
                playNextLance(session);
                return;
            } else if (!equipoUsTiene && equipoThemTiene) {
                session.appendLog("Solo el Equipo Rivales tiene Juego.");
                session.getApuestas().get("juego").setGanadaPor("them");
                session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
                playNextLance(session);
                return;
            }
        }

        int activeTurn = (session.getDealerIdx() + 1) % 4;
        session.setActiveTurnIdx(activeTurn);
        session.appendLog("Apuestas de la " + session.getStage().toUpperCase() + ". Turno de: " + (session.getPlayers().get(activeTurn) != null ? session.getPlayers().get(activeTurn).getUsername() : ""));
    }

    public static void handleBetAction(GameSession session, int playerIdx, String action) {
        if (playerIdx != session.getActiveTurnIdx() || !session.getPhase().equals("betting")) return;

        GamePlayer p = session.getPlayers().get(playerIdx);
        if (p == null) return;
        String lance = LANCES[session.getCurrentBetPhase()];
        
        if (action.equalsIgnoreCase("Paso")) {
            p.setSpeechBubble("¡Paso!");
            session.appendLog(p.getUsername() + " pasa.");
            
            if (session.getBetState() == 0) {
                if (playerIdx == session.getDealerIdx()) {
                    session.appendLog("Todos pasan a la " + session.getStage().toUpperCase() + ".");
                    session.getApuestas().get(lance).setPuntos(1);
                    session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
                    playNextLance(session);
                } else {
                    session.setActiveTurnIdx((session.getActiveTurnIdx() + 1) % 4);
                }
            } else {
                handleNoQuiero(session, playerIdx);
            }
        } 
        else if (action.equalsIgnoreCase("Envido")) {
            if (session.getBetState() == 1) {
                session.setCurrentBetSize(session.getCurrentBetSize() + 2);
                p.setSpeechBubble("¡Envido más!");
                session.appendLog(p.getUsername() + " re-envida. Apuesta total: " + session.getCurrentBetSize() + " a la " + session.getStage().toUpperCase());
            } else {
                p.setSpeechBubble("¡Envido!");
                session.appendLog(p.getUsername() + " envida 2 a la " + session.getStage().toUpperCase());
                session.setCurrentBetSize(2);
                session.setBetState(1);
            }
            session.setLastBettedPlayer(playerIdx);
            
            int opp1 = (playerIdx + 1) % 4;
            int opp2 = (playerIdx + 3) % 4;
            if (session.getPlayers().get(opp1) != null && session.getPlayers().get(opp1).isBot() && session.getPlayers().get(opp2) != null && !session.getPlayers().get(opp2).isBot()) {
                session.setActiveTurnIdx(opp2);
            } else {
                session.setActiveTurnIdx(opp1);
            }
        } 
        else if (action.equalsIgnoreCase("Ordago")) {
            p.setSpeechBubble("¡ÓRDAGO!");
            session.appendLog(p.getUsername() + " lanza un ÓRDAGO a la " + session.getStage().toUpperCase());
            session.setCurrentBetSize(40);
            session.setBetState(2);
            session.setLastBettedPlayer(playerIdx);
            
            int opp1 = (playerIdx + 1) % 4;
            int opp2 = (playerIdx + 3) % 4;
            if (session.getPlayers().get(opp1) != null && session.getPlayers().get(opp1).isBot() && session.getPlayers().get(opp2) != null && !session.getPlayers().get(opp2).isBot()) {
                session.setActiveTurnIdx(opp2);
            } else {
                session.setActiveTurnIdx(opp1);
            }
        } 
        else if (action.equalsIgnoreCase("Quiero")) {
            p.setSpeechBubble("¡Quiero!");
            session.appendLog(p.getUsername() + " acepta el envite de " + session.getCurrentBetSize() + " a la " + session.getStage().toUpperCase());
            
            session.getApuestas().get(lance).setApostado(true);
            session.getApuestas().get(lance).setPuntos(session.getCurrentBetSize());
            
            session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
            playNextLance(session);
        } 
        else if (action.equalsIgnoreCase("No Quiero")) {
            handleNoQuiero(session, playerIdx);
        }
    }

    public static void handleNoQuiero(GameSession session, int playerIdx) {
        GamePlayer p = session.getPlayers().get(playerIdx);
        if (p == null) return;
        p.setSpeechBubble("¡No quiero!");
        String lance = LANCES[session.getCurrentBetPhase()];
        
        session.appendLog(p.getUsername() + " rechaza la apuesta. Rival gana 1 punto de deje.");
        
        String winners = (session.getLastBettedPlayer() % 2 == 0) ? "us" : "them";
        session.getApuestas().get(lance).setGanadaPor(winners);
        session.getApuestas().get(lance).setDeje(1);
        
        if (session.getBetState() == 2) {
            session.appendLog("Órdago no aceptado.");
        }

        session.setCurrentBetPhase(session.getCurrentBetPhase() + 1);
        playNextLance(session);
    }
}
