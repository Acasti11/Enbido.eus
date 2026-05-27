package com.mus.backend.engine;

import lombok.Data;
import java.util.*;

public class RulesEvaluator {

    @Data
    public static class ParesResult {
        private boolean has;
        private String type; // Nada, Par, Medias, Duples
        private int value; // Payout points: Duples=3, Medias=2, Par=1, Nada=0
        private List<Integer> pairRanks; // Pair ranks sorted descending
    }

    @Data
    public static class JuegoResult {
        private boolean hasJuego;
        private int sum;
        private int strength; // 31(8) > 32(7) > 40(6) > 37(5) > 36(4) > 35(3) > 34(2) > 33(1) or sum for Punto
    }

    // Proximidad al repartidor (el jugador Mano tiene prioridad 0, el Postre tiene 3)
    public static int getPlayerPriority(int playerIdx, int dealerIdx) {
        return (playerIdx - dealerIdx + 3) % 4;
    }

    // Obtener rango real del naipe según las reglas de reyes elegidas
    public static int getRealOrder(int rank, String reyesOption) {
        if ("8".equals(reyesOption)) {
            if (rank == 3) return 12; // 3 es Rey
            if (rank == 2) return 1;  // 2 es As
        }
        return rank;
    }

    // Obtener valor de puntuación para Juego/Punto
    public static int getScoreValue(int rank, String reyesOption) {
        if ("8".equals(reyesOption)) {
            if (rank == 1 || rank == 2) return 1;
            if (rank >= 10 || rank == 3) return 10;
            return rank;
        } else {
            // 4 Reyes
            if (rank == 1) return 1;
            if (rank >= 10) return 10;
            return rank; // 2=2, 3=3, etc.
        }
    }

    // --- GRANDE ---
    public static List<Integer> getSortedGrandeRanks(List<Card> hand, String reyesOption) {
        List<Integer> ranks = new ArrayList<>();
        for (Card c : hand) {
            ranks.add(getRealOrder(c.getRank(), reyesOption));
        }
        ranks.sort(Collections.reverseOrder());
        return ranks;
    }

    public static int compareGrande(List<Card> handA, int playerIdxA, List<Card> handB, int playerIdxB, int dealerIdx, String reyesOption) {
        List<Integer> ranksA = getSortedGrandeRanks(handA, reyesOption);
        List<Integer> ranksB = getSortedGrandeRanks(handB, reyesOption);
        for (int i = 0; i < 4; i++) {
            int cmp = ranksA.get(i) - ranksB.get(i);
            if (cmp != 0) return cmp;
        }
        // Desempate por Mano
        int prioA = getPlayerPriority(playerIdxA, dealerIdx);
        int prioB = getPlayerPriority(playerIdxB, dealerIdx);
        return prioB - prioA; // Si prioA es menor, devuelve positivo (gana A por ser Mano)
    }

    // --- CHICA ---
    public static List<Integer> getSortedChicaRanks(List<Card> hand, String reyesOption) {
        List<Integer> ranks = new ArrayList<>();
        for (Card c : hand) {
            ranks.add(getRealOrder(c.getRank(), reyesOption));
        }
        ranks.sort(Comparator.naturalOrder());
        return ranks;
    }

    public static int compareChica(List<Card> handA, int playerIdxA, List<Card> handB, int playerIdxB, int dealerIdx, String reyesOption) {
        List<Integer> ranksA = getSortedChicaRanks(handA, reyesOption);
        List<Integer> ranksB = getSortedChicaRanks(handB, reyesOption);
        for (int i = 0; i < 4; i++) {
            int cmp = ranksB.get(i) - ranksA.get(i); // menor valor es mejor
            if (cmp != 0) return cmp;
        }
        // Desempate por Mano
        int prioA = getPlayerPriority(playerIdxA, dealerIdx);
        int prioB = getPlayerPriority(playerIdxB, dealerIdx);
        return prioB - prioA;
    }

    // --- PARES ---
    public static ParesResult evaluatePares(List<Card> hand, String reyesOption) {
        ParesResult pr = new ParesResult();
        Map<Integer, Integer> counts = new HashMap<>();
        for (Card c : hand) {
            int realRank = getRealOrder(c.getRank(), reyesOption);
            counts.put(realRank, counts.getOrDefault(realRank, 0) + 1);
        }

        List<Integer> pairRanks = new ArrayList<>();
        int threeOfAKindRank = -1;
        int fourOfAKindRank = -1;

        for (Map.Entry<Integer, Integer> entry : counts.entrySet()) {
            int rank = entry.getKey();
            int count = entry.getValue();
            if (count == 4) {
                fourOfAKindRank = rank;
            } else if (count == 3) {
                threeOfAKindRank = rank;
            } else if (count == 2) {
                pairRanks.add(rank);
            }
        }
        pairRanks.sort(Collections.reverseOrder());

        if (fourOfAKindRank != -1) {
            pr.setHas(true);
            pr.setType("Duples");
            pr.setValue(3);
            pr.setPairRanks(Arrays.asList(fourOfAKindRank, fourOfAKindRank));
        } else if (pairRanks.size() == 2) {
            pr.setHas(true);
            pr.setType("Duples");
            pr.setValue(3);
            pr.setPairRanks(pairRanks);
        } else if (threeOfAKindRank != -1) {
            pr.setHas(true);
            pr.setType("Medias");
            pr.setValue(2);
            pr.setPairRanks(Collections.singletonList(threeOfAKindRank));
        } else if (pairRanks.size() == 1) {
            pr.setHas(true);
            pr.setType("Par");
            pr.setValue(1);
            pr.setPairRanks(pairRanks);
        } else {
            pr.setHas(false);
            pr.setType("Nada");
            pr.setValue(0);
            pr.setPairRanks(new ArrayList<>());
        }
        return pr;
    }

    public static int comparePares(ParesResult resA, int playerIdxA, ParesResult resB, int playerIdxB, int dealerIdx) {
        if (resA.getValue() != resB.getValue()) {
            return resA.getValue() - resB.getValue();
        }
        if (resA.getValue() == 0) return 0; // Ninguno tiene pares

        List<Integer> ranksA = resA.getPairRanks();
        List<Integer> ranksB = resB.getPairRanks();
        int minSize = Math.min(ranksA.size(), ranksB.size());
        for (int i = 0; i < minSize; i++) {
            int cmp = ranksA.get(i) - ranksB.get(i);
            if (cmp != 0) return cmp;
        }

        // Desempate por Mano
        int prioA = getPlayerPriority(playerIdxA, dealerIdx);
        int prioB = getPlayerPriority(playerIdxB, dealerIdx);
        return prioB - prioA;
    }

    // --- JUEGO / PUNTO ---
    public static JuegoResult evaluateJuego(List<Card> hand, String reyesOption) {
        JuegoResult jr = new JuegoResult();
        int sum = 0;
        for (Card c : hand) {
            sum += getScoreValue(c.getRank(), reyesOption);
        }
        jr.setSum(sum);

        if (sum >= 31) {
            jr.setHasJuego(true);
            // Fuerza del Juego: 31 (8) > 32 (7) > 40 (6) > 37 (5) > 36 (4) > 35 (3) > 34 (2) > 33 (1)
            int str = 0;
            if (sum == 31) str = 8;
            else if (sum == 32) str = 7;
            else if (sum == 40) str = 6;
            else if (sum == 37) str = 5;
            else if (sum == 36) str = 4;
            else if (sum == 35) str = 3;
            else if (sum == 34) str = 2;
            else if (sum == 33) str = 1;
            jr.setStrength(str);
        } else {
            jr.setHasJuego(false);
            jr.setStrength(sum); // Para Punto, más cercano a 30 es mejor (30 es el máximo posible)
        }
        return jr;
    }

    public static int compareJuegoPunto(JuegoResult resA, int playerIdxA, JuegoResult resB, int playerIdxB, int dealerIdx) {
        int strA = resA.getStrength();
        int strB = resB.getStrength();
        if (strA != strB) {
            return strA - strB;
        }
        // Desempate por Mano
        int prioA = getPlayerPriority(playerIdxA, dealerIdx);
        int prioB = getPlayerPriority(playerIdxB, dealerIdx);
        return prioB - prioA;
    }
}
