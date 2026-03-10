package com.xfrizon.controller;

import com.xfrizon.entity.BlogHeroSettings;
import com.xfrizon.repository.BlogHeroSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/blog-hero-settings")
@CrossOrigin(origins = "*")
public class BlogHeroSettingsController {
    private static final Logger logger = LoggerFactory.getLogger(BlogHeroSettingsController.class);

    @Autowired
    private BlogHeroSettingsRepository settingsRepository;

    // Get all blog hero settings
    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        Map<String, String> settings = new HashMap<>();
        settingsRepository.findAll().forEach(setting -> {
            settings.put(setting.getSettingKey(), setting.getSettingValue());
        });
        
        // Return defaults if no settings exist
        if (settings.isEmpty()) {
            settings.put("blogHeroSlideshow", "[]");
        }
        
        return ResponseEntity.ok(settings);
    }

    // Get a specific setting by key
    @GetMapping("/{key}")
    public ResponseEntity<String> getSetting(@PathVariable String key) {
        return settingsRepository.findBySettingKey(key)
                .map(setting -> ResponseEntity.ok(setting.getSettingValue()))
                .orElse(ResponseEntity.notFound().build());
    }

    // Update or create a setting
    @PostMapping("/{key}")
    public ResponseEntity<BlogHeroSettings> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> payload) {
        
        String value = payload.get("value");
        String type = payload.getOrDefault("type", "TEXT");
        
        BlogHeroSettings setting = settingsRepository.findBySettingKey(key)
                .orElse(BlogHeroSettings.builder()
                        .settingKey(key)
                        .build());
        
        setting.setSettingValue(value);
        setting.setSettingType(type);
        
        BlogHeroSettings saved = settingsRepository.save(setting);
        return ResponseEntity.ok(saved);
    }

    // Admin endpoint to update all settings at once
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> bulkUpdate(@RequestBody Map<String, String> settings) {
        try {
            if (settings == null || settings.isEmpty()) {
                logger.warn("Received empty or null settings for blog hero bulk update");
                return ResponseEntity.badRequest().body(Map.of("error", "No settings provided"));
            }
            
            settings.forEach((key, value) -> {
                try {
                    logger.debug("Saving blog hero setting: {} with value length: {}", key, value != null ? value.length() : 0);
                    
                    BlogHeroSettings setting = settingsRepository.findBySettingKey(key)
                            .orElse(BlogHeroSettings.builder()
                                    .settingKey(key)
                                    .settingType("TEXT")
                                    .build());
                    setting.setSettingValue(value);
                    settingsRepository.save(setting);
                    
                    logger.debug("Successfully saved blog hero setting: {}", key);
                } catch (Exception e) {
                    logger.error("Error saving blog hero setting: {} - {}", key, e.getMessage(), e);
                    throw new RuntimeException("Failed to save setting: " + key, e);
                }
            });
            
            logger.info("Blog hero bulk settings update completed successfully for {} settings", settings.size());
            return getAllSettings();
        } catch (Exception e) {
            logger.error("Blog hero bulk update failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update blog hero settings: " + e.getMessage()));
        }
    }
}
