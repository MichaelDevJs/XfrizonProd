package com.xfrizon.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.annotation.PostConstruct;
import java.io.File;

@Configuration
@Slf4j
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            // Create uploads directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                boolean created = uploadDirectory.mkdirs();
                if (created) {
                    log.info("Upload directory created successfully: {}", uploadDirectory.getAbsolutePath());
                } else {
                    log.warn("Failed to create upload directory: {}", uploadDirectory.getAbsolutePath());
                }
            } else {
                log.info("Upload directory already exists: {}", uploadDirectory.getAbsolutePath());
            }
        } catch (Exception e) {
            log.error("Error initializing upload directory", e);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absoluteUploadDir = new File(uploadDir).getAbsolutePath();
        String location = "file:" + (absoluteUploadDir.endsWith(File.separator)
            ? absoluteUploadDir
            : absoluteUploadDir + File.separator);

        registry.addResourceHandler("/uploads/**")
            .addResourceLocations(location);
        registry.addResourceHandler("/api/v1/uploads/**")
            .addResourceLocations(location);

        log.info("Upload directory configured at: {}", absoluteUploadDir);
    }
}
