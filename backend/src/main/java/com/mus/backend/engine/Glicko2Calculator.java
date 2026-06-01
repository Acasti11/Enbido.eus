package com.mus.backend.engine;

public class Glicko2Calculator {

    private static final double TAU = 0.5; // System constant between 0.3 and 1.2
    private static final double MULTIPLIER = 173.7178;

    public static class GlickoResult {
        public double rating;
        public double ratingDeviation;
        public double volatility;

        public GlickoResult(double rating, double ratingDeviation, double volatility) {
            this.rating = rating;
            this.ratingDeviation = ratingDeviation;
            this.volatility = volatility;
        }
    }

    /**
     * Updates a player's Glicko-2 rating components after one game.
     * @param rating current rating (r)
     * @param rd current rating deviation (RD)
     * @param volatility current volatility (sigma)
     * @param opponentRating opponent's rating
     * @param opponentRd opponent's rating deviation
     * @param score 1.0 for a win, 0.0 for a loss
     */
    public static GlickoResult update(double rating, double rd, double volatility,
                                      double opponentRating, double opponentRd, double score) {
        
        // Step 1: Scale parameters
        double mu = (rating - 1500.0) / MULTIPLIER;
        double phi = rd / MULTIPLIER;
        
        double muOpp = (opponentRating - 1500.0) / MULTIPLIER;
        double phiOpp = opponentRd / MULTIPLIER;

        // Step 2: Compute intermediate values
        double gPhiOpp = 1.0 / Math.sqrt(1.0 + 3.0 * phiOpp * phiOpp / (Math.PI * Math.PI));
        double eVal = 1.0 / (1.0 + Math.exp(-gPhiOpp * (mu - muOpp)));
        
        // Variance (v)
        double v = 1.0 / (gPhiOpp * gPhiOpp * eVal * (1.0 - eVal));
        
        // Improvement (delta)
        double delta = v * gPhiOpp * (score - eVal);

        // Step 3: Determine new volatility (sigma') using Illinois/Newton-Raphson approximation
        double a = Math.log(volatility * volatility);
        
        // Step 3 numerical search
        double A = a;
        double B;
        if (delta * delta > phi * phi + v) {
            B = Math.log(delta * delta - phi * phi - v);
        } else {
            int k = 1;
            while (f(a - k * TAU, delta, phi, v, a) < 0) {
                k++;
            }
            B = a - k * TAU;
        }
        
        double fA = f(A, delta, phi, v, a);
        double fB = f(B, delta, phi, v, a);
        
        while (Math.abs(B - A) > 0.000001) {
            double C = A + (A - B) * fA / (fB - fA);
            double fC = f(C, delta, phi, v, a);
            if (fC * fB < 0) {
                A = B;
                fA = fB;
            } else {
                fA = fA / 2.0;
            }
            B = C;
            fB = fC;
        }
        
        double newVol = Math.exp(A / 2.0);

        // Step 4: Update rating deviation and rating
        double phiStar = Math.sqrt(phi * phi + newVol * newVol);
        double phiPrime = 1.0 / Math.sqrt(1.0 / (phiStar * phiStar) + 1.0 / v);
        double muPrime = mu + phiPrime * phiPrime * gPhiOpp * (score - eVal);

        // Step 5: Scale back
        double rPrime = MULTIPLIER * muPrime + 1500.0;
        double rdPrime = MULTIPLIER * phiPrime;

        return new GlickoResult(rPrime, rdPrime, newVol);
    }

    private static double f(double x, double delta, double phi, double v, double a) {
        double ex = Math.exp(x);
        double phiSq = phi * phi;
        double temp1 = phiSq + v + ex;
        double term1 = (delta * delta - phiSq - v - ex) / (2.0 * temp1 * temp1);
        double term2 = (x - a) / (TAU * TAU);
        return term1 - term2;
    }
}
