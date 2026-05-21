package com.mus.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initShopData(JdbcTemplate jdbcTemplate) {
        return args -> {
            // Inicializar categorías
            jdbcTemplate.execute("INSERT IGNORE INTO categories (category_id, name, description) VALUES " +
                    "(1, 'profiles', 'Perfiles para el jugador'), " +
                    "(2, 'decks', 'Barajas personalizadas'), " +
                    "(3, 'aliases', 'Alias para mostrar debajo del nombre')");

            // Inicializar objetos de la tienda que el frontend espera
            jdbcTemplate.execute("INSERT IGNORE INTO items (item_id, category_id, name, price) VALUES " +
                    "(1, 1, 'Marco Oro', 500), " +
                    "(2, 1, 'Avatar Pared Verde', 250), " +
                    "(3, 2, 'Baraja Clásica Francesa', 300), " +
                    "(4, 2, 'Reverso Nocturno', 800), " +
                    "(5, 3, 'El Tímido', 150), " +
                    "(6, 3, 'Maestro del Ordago', 1000)");
        };
    }
}
