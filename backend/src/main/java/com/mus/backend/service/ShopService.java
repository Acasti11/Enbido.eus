package com.mus.backend.service;

import com.mus.backend.model.Item;
import com.mus.backend.model.PurchaseHistory;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.model.UserInventory;
import com.mus.backend.repository.ItemRepository;
import com.mus.backend.repository.PurchaseHistoryRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.repository.UserInventoryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ShopService {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserInventoryRepository userInventoryRepository;

    @Autowired
    private PurchaseHistoryRepository purchaseHistoryRepository;

    @Autowired
    private UserGameProfileRepository userGameProfileRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getShopItems() {
        List<Item> items = itemRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Item item : items) {
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", item.getItemId());
            map.put("name", item.getName());
            map.put("price", item.getPrice());
            map.put("category", item.getCategory() != null ? item.getCategory().getName() : null);
            result.add(map);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Long> getUserInventory(Long userId) {
        return userInventoryRepository.findByUserId(userId).stream()
                .map(ui -> ui.getItem().getItemId())
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> buyItem(Long userId, Long itemId) {
        if (userInventoryRepository.existsByUserIdAndItemItemId(userId, itemId)) {
            throw new IllegalArgumentException("Ya posees este objeto en tu inventario");
        }

        StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_buy_item");
        query.registerStoredProcedureParameter("p_user_id", Long.class, ParameterMode.IN);
        query.registerStoredProcedureParameter("p_item_id", Long.class, ParameterMode.IN);
        query.registerStoredProcedureParameter("p_status", String.class, ParameterMode.OUT);
        query.registerStoredProcedureParameter("p_new_coins", Integer.class, ParameterMode.OUT);

        query.setParameter("p_user_id", userId);
        query.setParameter("p_item_id", itemId);

        query.execute();

        String status = (String) query.getOutputParameterValue("p_status");
        Integer newCoins = (Integer) query.getOutputParameterValue("p_new_coins");

        if ("ITEM_NOT_FOUND".equals(status)) {
            throw new IllegalArgumentException("Objeto no encontrado en la tienda");
        } else if ("USER_NOT_FOUND".equals(status)) {
            throw new IllegalArgumentException("Perfil de usuario no encontrado");
        } else if ("INSUFFICIENT_FUNDS".equals(status)) {
            throw new IllegalArgumentException("No tienes suficientes monedas (tx) para realizar esta compra");
        } else if ("ERROR".equals(status) || status == null) {
            throw new IllegalArgumentException("Error al procesar la compra en la base de datos");
        }

        return Map.of("message", "Compra realizada con éxito", "newCoins", newCoins);
    }

    @Transactional
    public Map<String, Object> equipItem(Long userId, Long itemId) {
        if (!userInventoryRepository.existsByUserIdAndItemItemId(userId, itemId)) {
            throw new IllegalArgumentException("No puedes equipar un objeto que no posees");
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Objeto no encontrado"));

        String category = item.getCategory() != null ? item.getCategory().getName() : "";

        UserGameProfile profile = userGameProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado"));

        if ("profiles".equals(category)) profile.setEquippedAvatarItemId(itemId.intValue());
        else if ("decks".equals(category)) profile.setEquippedDeckItemId(itemId.intValue());
        else if ("aliases".equals(category)) profile.setEquippedTitleItemId(itemId.intValue());
        //else if ("boards".equals(category)) profile.setEquippedBoardItemId(itemId.intValue());
        else throw new IllegalArgumentException("Categoría no equipable");

        userGameProfileRepository.save(profile);

        return Map.of("message", "Objeto equipado con éxito");
    }

    @Transactional
    public Map<String, Object> unequipItem(Long userId, String category) {
        UserGameProfile profile = userGameProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado"));

        if ("profiles".equals(category)) profile.setEquippedAvatarItemId(null);
        else if ("decks".equals(category)) profile.setEquippedDeckItemId(null);
        else if ("aliases".equals(category)) profile.setEquippedTitleItemId(null);
        //else if ("boards".equals(category)) profile.setEquippedBoardItemId(null);
        else throw new IllegalArgumentException("Categoría no equipable");

        userGameProfileRepository.save(profile);

        return Map.of("message", "Objeto desequipado con éxito");
    }
}
