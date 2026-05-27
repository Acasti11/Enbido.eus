package com.mus.backend.engine;

import lombok.Data;

@Data
public class LanceBet {
    private String ganadaPor = null; // "us", "them", or null
    private int puntos = 0;
    private int deje = 0;
    private boolean apostado = false;
    private boolean esPunto = false;
}
