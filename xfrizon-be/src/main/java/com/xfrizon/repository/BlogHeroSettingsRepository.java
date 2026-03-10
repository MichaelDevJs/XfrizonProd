package com.xfrizon.repository;

import com.xfrizon.entity.BlogHeroSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlogHeroSettingsRepository extends JpaRepository<BlogHeroSettings, Long> {
    Optional<BlogHeroSettings> findBySettingKey(String settingKey);
}
