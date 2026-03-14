package com.xfrizon.controller;

import com.xfrizon.repository.BlogRepository;
import com.xfrizon.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@RestController
@RequiredArgsConstructor
public class SeoController {

    private static final DateTimeFormatter SITEMAP_DATE_FORMAT = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final EventRepository eventRepository;
    private final BlogRepository blogRepository;

    @Value("${xfrizon.public-base-url:https://xfrizon.up.railway.app}")
    private String publicBaseUrl;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemap() {
        String baseUrl = normalizeBaseUrl(publicBaseUrl);

        StringBuilder xml = new StringBuilder(16_384);
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        appendUrl(xml, baseUrl + "/", null, "daily", "1.0");
        appendUrl(xml, baseUrl + "/home", null, "daily", "0.9");
        appendUrl(xml, baseUrl + "/blogs", null, "daily", "0.9");
        appendUrl(xml, baseUrl + "/partners", null, "weekly", "0.7");

        for (EventRepository.EventSitemapEntry event : eventRepository.findPublicEventSitemapEntries()) {
            appendUrl(
                xml,
                baseUrl + "/event/" + event.getId(),
                event.getLastModified(),
                "daily",
                "0.8"
            );
        }

        for (BlogRepository.BlogSitemapEntry blog : blogRepository.findPublishedBlogSitemapEntries()) {
            appendUrl(
                xml,
                baseUrl + "/blog/" + blog.getId(),
                blog.getLastModified(),
                "weekly",
                "0.7"
            );
        }

        xml.append("</urlset>");

        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
            .contentType(MediaType.APPLICATION_XML)
            .body(xml.toString());
    }

    private void appendUrl(StringBuilder xml, String loc, LocalDateTime lastModified, String changeFreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(xmlEscape(loc)).append("</loc>\n");
        if (lastModified != null) {
            xml.append("    <lastmod>")
                .append(lastModified.atOffset(ZoneOffset.UTC).format(SITEMAP_DATE_FORMAT))
                .append("</lastmod>\n");
        }
        xml.append("    <changefreq>").append(changeFreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "https://xfrizon.up.railway.app";
        }
        String trimmed = value.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String xmlEscape(String raw) {
        return raw
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }
}
