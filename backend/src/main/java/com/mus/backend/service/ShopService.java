package com.mus.backend.service;

import com.mus.backend.model.Item;
import com.mus.backend.model.PurchaseHistory;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.model.UserInventory;
import com.mus.backend.repository.ItemRepository;
import com.mus.backend.repository.PurchaseHistoryRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.repository.UserInventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ShopService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserInventoryRepository userInventoryRepository;

    @Autowired
    private PurchaseHistoryRepository purchaseHistoryRepository;

    @Autowired
    private UserGameProfileRepository userGameProfileRepository;

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

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Objeto no encontrado en la tienda"));

        int price = item.getPrice() != null ? item.getPrice() : 0;

        UserGameProfile profile = userGameProfileRepository.findById(userId).orElseGet(() -> {
            UserGameProfile newProfile = new UserGameProfile(userId);
            return userGameProfileRepository.save(newProfile);
        });

        int currentCoins = profile.getCoins() != null ? profile.getCoins() : 0;

        if (currentCoins < price) {
            throw new IllegalArgumentException("No tienes suficientes monedas (tx) para realizar esta compra");
        }

        profile.setCoins(currentCoins - price);
        userGameProfileRepository.save(profile);

        UserInventory inventory = new UserInventory();
        inventory.setUserId(userId);
        inventory.setItem(item);
        userInventoryRepository.save(inventory);

        PurchaseHistory history = new PurchaseHistory();
        history.setUserId(userId);
        history.setItem(item);
        history.setCoinsSpent(price);
        purchaseHistoryRepository.save(history);

        return Map.of("message", "Compra realizada con éxito", "newCoins", currentCoins - price);
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
        else if ("boards".equals(category)) profile.setEquippedBoardItemId(itemId.intValue());
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
        else if ("boards".equals(category)) profile.setEquippedBoardItemId(null);
        else throw new IllegalArgumentException("Categoría no equipable");

        userGameProfileRepository.save(profile);

        return Map.of("message", "Objeto desequipado con éxito");
    }
}
