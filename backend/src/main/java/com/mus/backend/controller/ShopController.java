package com.mus.backend.controller;

import com.mus.backend.model.Category;
import com.mus.backend.model.Item;
import com.mus.backend.repository.CategoryRepository;
import com.mus.backend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
@CrossOrigin(origins = "*")
public class ShopController {

    @Autowired
    private CategoryRepository categoryRepo;

    @Autowired
    private ItemRepository itemRepo;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        List<Category> categories = categoryRepo.findAll();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/items")
    public ResponseEntity<List<Item>> getItems(
            @RequestParam(required = false) Integer categoryId) {
        List<Item> items;
        if (categoryId != null) {
            items = itemRepo.findByCategoryId(categoryId);
        } else {
            items = itemRepo.findAll();
        }
        return ResponseEntity.ok(items);
    }
}
