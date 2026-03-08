package com.xfrizon.controller;

import com.xfrizon.entity.HomePageSettings;
import com.xfrizon.repository.HomePageSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/homepage-settings")
@CrossOrigin(origins = "*")
public class HomePageSettingsController {

    @Autowired
    private HomePageSettingsRepository settingsRepository;

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
            settings.put("blockOrder", "[\"centeredBanner\",\"heroSection\",\"blogsSection\",\"eventSection\"]");
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
        settings.forEach((key, value) -> {
            HomePageSettings setting = settingsRepository.findBySettingKey(key)
                    .orElse(HomePageSettings.builder()
                            .settingKey(key)
                            .settingType("TEXT")
                            .build());
            setting.setSettingValue(value);
            settingsRepository.save(setting);
        });
        
        return getAllSettings();
    }
}

