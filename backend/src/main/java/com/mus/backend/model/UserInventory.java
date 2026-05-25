package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_inventory")
@Data
@IdClass(UserInventoryId.class)
public class UserInventory {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;
}
