package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "purchase_history")
@Data
public class PurchaseHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;

    @Column(name = "coins_spent")
    private Integer coinsSpent;
}
