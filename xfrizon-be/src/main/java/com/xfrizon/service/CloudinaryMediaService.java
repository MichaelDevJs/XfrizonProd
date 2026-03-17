package com.xfrizon.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class CloudinaryMediaService {

    @Value("${cloudinary.enabled:false}")
    private boolean cloudinaryEnabled;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        configureCloudinaryIfAvailable();
    }

    public boolean isActive() {
        return cloudinary != null;
    }

    public boolean isCloudinaryUrl(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.contains("res.cloudinary.com/");
    }

    public void deleteAssetsByUrls(Collection<String> urls) {
        if (!isActive() || urls == null || urls.isEmpty()) {
            return;
        }

        Set<String> uniqueUrls = new LinkedHashSet<>(urls);
        for (String url : uniqueUrls) {
            deleteAssetByUrl(url);
        }
    }

    public void deleteAssetByUrl(String url) {
        if (!isActive() || !isCloudinaryUrl(url)) {
            return;
        }

        String publicId = extractPublicId(url);
        if (publicId == null || publicId.isBlank()) {
            log.warn("Could not extract Cloudinary public_id from URL: {}", url);
            return;
        }

        for (String resourceType : new String[]{"image", "video", "raw"}) {
            try {
                Map<?, ?> result = cloudinary.uploader().destroy(
                        publicId,
                        ObjectUtils.asMap(
                                "resource_type", resourceType,
                                "invalidate", true
                        )
                );

                String outcome = String.valueOf(result.get("result"));
                if ("ok".equalsIgnoreCase(outcome)) {
                    log.info("Deleted Cloudinary asset '{}' as {}", publicId, resourceType);
                    return;
                }
            } catch (Exception ex) {
                log.warn("Failed deleting Cloudinary asset '{}' as {}", publicId, resourceType, ex);
            }
        }

        log.info("Cloudinary asset '{}' was not deleted; likely already missing", publicId);
    }

    private boolean configureCloudinaryIfAvailable() {
        boolean hasExplicitCredentials = !cloudinaryCloudName.isBlank()
                && !cloudinaryApiKey.isBlank()
                && !cloudinaryApiSecret.isBlank();
        boolean hasCloudinaryUrl = cloudinaryUrl != null && !cloudinaryUrl.isBlank();

        if (!cloudinaryEnabled && !hasExplicitCredentials && !hasCloudinaryUrl) {
            return false;
        }

        if (hasExplicitCredentials) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudinaryCloudName,
                    "api_key", cloudinaryApiKey,
                    "api_secret", cloudinaryApiSecret,
                    "secure", true
            ));
            return true;
        }

        if (hasCloudinaryUrl) {
            Map<String, Object> parsedConfig = parseCloudinaryUrl(cloudinaryUrl);
            this.cloudinary = new Cloudinary(parsedConfig);
            return true;
        }

        return false;
    }

    private Map<String, Object> parseCloudinaryUrl(String rawUrl) {
        URI uri = URI.create(rawUrl.trim());
        String userInfo = uri.getUserInfo();
        if (userInfo == null || !userInfo.contains(":")) {
            throw new IllegalArgumentException("CLOUDINARY_URL is missing api_key or api_secret");
        }

        String[] credentials = userInfo.split(":", 2);
        String apiKey = credentials[0];
        String apiSecret = credentials[1];
        String cloudName = uri.getHost();
        if ((cloudName == null || cloudName.isBlank()) && uri.getPath() != null) {
            cloudName = uri.getPath().replaceFirst("^/", "");
        }

        return ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        );
    }

    private String extractPublicId(String url) {
        try {
            URI uri = URI.create(url.trim());
            String path = uri.getPath();
            if (path == null || !path.contains("/upload/")) {
                return null;
            }

            String afterUpload = path.substring(path.indexOf("/upload/") + "/upload/".length());
            String[] segments = afterUpload.split("/");
            StringBuilder publicId = new StringBuilder();

            boolean versionSkipped = false;
            for (String segment : segments) {
                if (segment == null || segment.isBlank()) {
                    continue;
                }
                if (!versionSkipped && segment.matches("v\\d+")) {
                    versionSkipped = true;
                    continue;
                }
                if (publicId.length() > 0) {
                    publicId.append('/');
                }
                publicId.append(segment);
            }

            String result = publicId.toString();
            int extensionIndex = result.lastIndexOf('.');
            if (extensionIndex > 0) {
                result = result.substring(0, extensionIndex);
            }
            return result;
        } catch (Exception ex) {
            log.warn("Failed to parse Cloudinary URL: {}", url, ex);
            return null;
        }
    }
}