package com.mus.backend.model;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInventoryId implements Serializable {
    private Long userId;
    private Long item; 
}
