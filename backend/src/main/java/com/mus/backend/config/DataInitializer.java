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
            // Alterar la tabla de manera segura para agregar la columna y clave foránea de tapete
            try {
                jdbcTemplate.execute("ALTER TABLE user_game_profile ADD COLUMN equipped_board_item_id INT NULL");
            } catch (Exception e) {
                // La columna ya existe o la migración falló de forma no crítica
            }
            try {
                jdbcTemplate.execute("ALTER TABLE user_game_profile ADD CONSTRAINT user_game_profile_board_item_FK " +
                        "FOREIGN KEY (equipped_board_item_id) REFERENCES items (item_id) ON DELETE SET NULL");
            } catch (Exception e) {
                // La restricción ya existe o falló
            }

            // Inicializar categorías
            jdbcTemplate.execute("INSERT IGNORE INTO categories (category_id, name, description) VALUES " +
                    "(1, 'profiles', 'Perfiles para el jugador'), " +
                    "(2, 'decks', 'Barajas personalizadas'), " +
                    "(3, 'aliases', 'Alias para mostrar debajo del nombre'), " +
                    "(4, 'boards', 'Tapetes personalizados de juego')");

            // Inicializar objetos de la tienda que el frontend espera
            jdbcTemplate.execute("INSERT IGNORE INTO items (item_id, category_id, name, price) VALUES " +
                    "(1, 1, 'Marco Oro', 500), " +
                    "(2, 1, 'Avatar Pared Verde', 250), " +
                    "(3, 2, 'Baraja Clásica Francesa', 300), " +
                    "(4, 2, 'Reverso Nocturno', 800), " +
                    "(5, 3, 'El Tímido', 150), " +
                    "(6, 3, 'Maestro del Ordago', 1000), " +
                    "(7, 4, 'Tapete Azul Real', 600), " +
                    "(8, 4, 'Tapete Terciopelo Negro', 1200), " +
                    "(9, 4, 'Tapete Casino Dorado', 1500)");
        };
    }
}
