package com.xfrizon.controller;

import com.xfrizon.dto.AiChatRequest;
import com.xfrizon.dto.ApiResponse;
import com.xfrizon.service.AiBlogAssistantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai/blog-assistant")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiBlogAssistantController {

    private final AiBlogAssistantService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(
            @RequestBody AiChatRequest request) {
        try {
            String reply = aiService.chat(request);
            return ResponseEntity.ok(
                    ApiResponse.success(Map.of("reply", reply), "AI response generated")
            );
        } catch (IllegalArgumentException e) {
            log.warn("Bad AI chat request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (IllegalStateException e) {
            log.warn("AI configuration/upstream issue: {}", e.getMessage());
            String message = e.getMessage() == null ? "AI request failed" : e.getMessage();
            HttpStatus status;

            if (message.contains("OPENAI_API_KEY")) {
                status = HttpStatus.SERVICE_UNAVAILABLE;
            } else if (message.toLowerCase().contains("rate limit")) {
                status = HttpStatus.TOO_MANY_REQUESTS;
            } else if (message.toLowerCase().contains("authentication")) {
                status = HttpStatus.BAD_GATEWAY;
            } else {
                status = HttpStatus.BAD_GATEWAY;
            }

            int code = status.value();
            return ResponseEntity.status(status)
                .body(ApiResponse.error(message, code));
        } catch (Exception e) {
            log.error("AI chat error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiResponse.error("AI request failed: " + e.getMessage(), 502));
        }
    }
}
