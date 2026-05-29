package com.mus.backend.engine;

import java.util.*;

public class DiscardHandler {

    public static void startMusPhase(GameSession session) {
        session.setPhase("mus-check");
        session.setMusVotesCount(0);
        for (GamePlayer p : session.getPlayers()) {
            if (p != null) p.setSpeechBubble("");
        }
        int activeTurn = (session.getDealerIdx() + 1) % 4;
        session.setActiveTurnIdx(activeTurn);
        session.appendLog("Ronda de Mus. Turno de: " + (session.getPlayers().get(activeTurn) != null ? session.getPlayers().get(activeTurn).getUsername() : ""));
    }

    public static void handleMusDecision(GameSession session, int playerIdx, boolean wantsMus) {
        if (playerIdx != session.getActiveTurnIdx() || !session.getPhase().equals("mus-check")) return;

        GamePlayer p = session.getPlayers().get(playerIdx);
        if (p == null) return;
        
        p.setSpeechBubble(wantsMus ? "¡Mus!" : "¡Corto!");
        session.appendLog(p.getUsername() + " dice: " + (wantsMus ? "Mus" : "Corto"));

        if (!wantsMus) {
            session.appendLog("Mus cortado por " + p.getUsername() + ". Comienzan los lances.");
            BettingHandler.startLances(session);
        } else {
            session.setMusVotesCount(session.getMusVotesCount() + 1);
            if (session.getMusVotesCount() == 4) {
                startDiscardPhase(session);
            } else {
                session.setActiveTurnIdx((session.getActiveTurnIdx() + 1) % 4);
            }
        }
    }

    public static void startDiscardPhase(GameSession session) {
        session.setPhase("discarding");
        int activeTurn = (session.getDealerIdx() + 1) % 4;
        session.setActiveTurnIdx(activeTurn);
        session.appendLog("Fase de descartes. Turno de: " + (session.getPlayers().get(activeTurn) != null ? session.getPlayers().get(activeTurn).getUsername() : ""));
    }

    public static void handleDiscards(GameSession session, int playerIdx, List<String> cardIds) {
        if (playerIdx != session.getActiveTurnIdx() || !session.getPhase().equals("discarding")) return;

        GamePlayer p = session.getPlayers().get(playerIdx);
        if (p == null) return;
        
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
        session.getDiscardPile().addAll(discardedList);

        int descCount = cardIds.size();
        p.setSpeechBubble(descCount == 0 ? "¡Servido!" : "Me doy " + descCount);
        session.appendLog(p.getUsername() + " se descarta de " + descCount + " cartas.");

        for (int i = 0; i < descCount; i++) {
            if (session.getDeck().isEmpty()) {
                session.getDeck().addAll(session.getDiscardPile());
                Collections.shuffle(session.getDeck());
                session.getDiscardPile().clear();
            }
            if (!session.getDeck().isEmpty()) {
                Card card = session.getDeck().remove(session.getDeck().size() - 1);
                card.updateScoreValue(session.getConfig().getReyesOption());
                p.getHand().add(card);
            }
        }

        if (playerIdx == session.getDealerIdx()) {
            startMusPhase(session);
        } else {
            session.setActiveTurnIdx((session.getActiveTurnIdx() + 1) % 4);
        }
    }
}
