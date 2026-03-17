package com.xfrizon.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xfrizon.entity.HomePageSettings;
import com.xfrizon.repository.HomePageSettingsRepository;
import com.xfrizon.service.CloudinaryMediaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/homepage-settings")
@CrossOrigin(origins = "*")
public class HomePageSettingsController {
    private static final Logger logger = LoggerFactory.getLogger(HomePageSettingsController.class);

    @Autowired
    private HomePageSettingsRepository settingsRepository;

    @Autowired
    private CloudinaryMediaService cloudinaryMediaService;

    @Autowired
    private ObjectMapper objectMapper;

    private Set<String> extractCloudinaryUrls(String jsonValue) {
        Set<String> urls = new LinkedHashSet<>();
        if (jsonValue == null || jsonValue.isBlank()) {
            return urls;
        }

        try {
            JsonNode node = objectMapper.readTree(jsonValue);
            collectCloudinaryUrls(node, urls);
        } catch (Exception e) {
            logger.warn("Failed to parse homepage setting JSON for cleanup", e);
        }
        return urls;
    }

    private void collectCloudinaryUrls(JsonNode node, Set<String> urls) {
        if (node == null) {
            return;
        }
        if (node.isTextual()) {
            String value = node.asText();
            if (cloudinaryMediaService.isCloudinaryUrl(value)) {
                urls.add(value);
            }
            return;
        }
        if (node.isArray()) {
            node.forEach(item -> collectCloudinaryUrls(item, urls));
            return;
        }
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> collectCloudinaryUrls(entry.getValue(), urls));
        }
    }

    // Get all homepage settings
    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        Map<String, String> settings = new HashMap<>();
        settingsRepository.findAll().forEach(setting -> {
            settings.put(setting.getSettingKey(), setting.getSettingValue());
        });
        
        // Return defaults if no settings exist
        if (settings.isEmpty()) {
            settings.put("heroSlideshow", "[{\"id\":\"1\",\"type\":\"video\",\"url\":\"/assets/Xfrizon-Hero-Vid.mp4\",\"duration\":10000,\"order\":0}]");
            settings.put("bannerTexts", "[\"Promoting Afrocentric Events\",\"Discover Events Near You\",\"Celebrate Culture Together\"]");
            settings.put("blockOrder", "[\"centeredBanner\",\"heroSection\",\"blogsSection\",\"partnersSection\",\"eventSection\"]");
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
    public ResponseEntity<HomePageSettings> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> payload) {
        
        String value = payload.get("value");
        String type = payload.getOrDefault("type", "TEXT");
        
        HomePageSettings setting = settingsRepository.findBySettingKey(key)
                .orElse(HomePageSettings.builder()
                        .settingKey(key)
                        .build());
        
        setting.setSettingValue(value);
        setting.setSettingType(type);
        
        HomePageSettings saved = settingsRepository.save(setting);
        return ResponseEntity.ok(saved);
    }

    // Admin endpoint to update all settings at once
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> bulkUpdate(@RequestBody Map<String, String> settings) {
        try {
            if (settings == null || settings.isEmpty()) {
                logger.warn("Received empty or null settings for bulk update");
                return ResponseEntity.badRequest().body(Map.of("error", "No settings provided"));
            }
            
                String previousHeroSlideshow = settingsRepository.findBySettingKey("heroSlideshow")
                    .map(HomePageSettings::getSettingValue)
                    .orElse(null);

            settings.forEach((key, value) -> {
                try {
                    logger.debug("Saving setting: {} with value length: {}", key, value != null ? value.length() : 0);
                    
                    HomePageSettings setting = settingsRepository.findBySettingKey(key)
                            .orElse(HomePageSettings.builder()
                                    .settingKey(key)
                                    .settingType("TEXT")
                                    .build());
                    setting.setSettingValue(value);
                    settingsRepository.save(setting);
                    
                    logger.debug("Successfully saved setting: {}", key);
                } catch (Exception e) {
                    logger.error("Error saving setting: {} - {}", key, e.getMessage(), e);
                    throw new RuntimeException("Failed to save setting: " + key, e);
                }
            });

            if (settings.containsKey("heroSlideshow")) {
                Set<String> previousUrls = extractCloudinaryUrls(previousHeroSlideshow);
                Set<String> currentUrls = extractCloudinaryUrls(settings.get("heroSlideshow"));
                previousUrls.removeAll(currentUrls);
                cloudinaryMediaService.deleteAssetsByUrls(previousUrls);
            }
            
            logger.info("Bulk settings update completed successfully for {} settings", settings.size());
            return getAllSettings();
        } catch (Exception e) {
            logger.error("Bulk update failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update settings: " + e.getMessage()));
        }
    }
}

