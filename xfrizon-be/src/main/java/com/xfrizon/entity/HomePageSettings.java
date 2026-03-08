package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "homepage_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomePageSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "setting_key", unique = true, nullable = false)
    private String settingKey;
    
    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;
    
    @Column(name = "setting_type")
    private String settingType; // VIDEO_URL, BANNER_TEXTS, BLOCK_ORDER, etc.
    
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
    
    @PreUpdate
    @PrePersist
    public void updateTimestamp() {
        this.updatedAt = java.time.LocalDateTime.now();
    }
}
