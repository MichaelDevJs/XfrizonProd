package com.xfrizon.repository;

import com.xfrizon.entity.HomePageSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HomePageSettingsRepository extends JpaRepository<HomePageSettings, Long> {
    Optional<HomePageSettings> findBySettingKey(String settingKey);
}
