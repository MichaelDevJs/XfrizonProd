package com.xfrizon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.xfrizon.dto.AiChatRequest;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiBlogAssistantService {

    private static final String OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";
    private static final int DEFAULT_MAX_TOKENS = 2000;
    private static final double DEFAULT_TEMPERATURE = 0.72;

    @Value("${openai.api.key}")
    private String openAiApiKey;

    private final ObjectMapper mapper = new ObjectMapper();

    @PostConstruct
    public void logOpenAiKeyStatus() {
        boolean configured = openAiApiKey != null && !openAiApiKey.isBlank();
        log.info("AI assistant OpenAI key configured: {}", configured);
    }

    /**
     * Calls OpenAI with the full message history from the request.
     *
     * @return the assistant reply text
     */
    public String chat(AiChatRequest request) {
        try {
            if (openAiApiKey == null || openAiApiKey.isBlank()) {
                throw new IllegalStateException("OPENAI_API_KEY is not configured on backend");
            }

            // Build messages array — frontend already prepends the system prompt
            List<Map<String, String>> messages = request.getMessages();
            if (messages == null || messages.isEmpty()) {
                throw new IllegalArgumentException("No messages provided");
            }

            // Append the latest user message if not already the last entry
            String userMsg = request.getUserMessage();
            if (userMsg != null && !userMsg.isBlank()) {
                Map<String, String> last = messages.get(messages.size() - 1);
                if (!"user".equals(last.get("role")) || !userMsg.equals(last.get("content"))) {
                    messages.add(Map.of("role", "user", "content", userMsg));
                }
            }

            // Build JSON body
            ObjectNode body = mapper.createObjectNode();
            body.put("model", MODEL);
            body.put("max_tokens", request.getMaxTokens() != null ? request.getMaxTokens() : DEFAULT_MAX_TOKENS);
            body.put("temperature", request.getTemperature() != null ? request.getTemperature() : DEFAULT_TEMPERATURE);

            ArrayNode msgsNode = body.putArray("messages");
            for (Map<String, String> m : messages) {
                ObjectNode node = msgsNode.addObject();
                node.put("role", m.getOrDefault("role", "user"));
                node.put("content", m.getOrDefault("content", ""));
            }

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(OPENAI_ENDPOINT))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                String responseBody = response.body();
                String errorMessage = "OpenAI request failed";
                try {
                    JsonNode errorNode = mapper.readTree(responseBody).path("error");
                    if (errorNode != null && !errorNode.isMissingNode()) {
                        String apiMessage = errorNode.path("message").asText("");
                        if (!apiMessage.isBlank()) {
                            errorMessage = apiMessage;
                        }
                    }
                } catch (Exception ignored) {
                    // Keep fallback error message when response body is not JSON.
                }

                log.error("OpenAI returned status {}: {}", response.statusCode(), responseBody);

                if (response.statusCode() == 401 || response.statusCode() == 403) {
                    throw new IllegalStateException("OpenAI authentication failed. Check OPENAI_API_KEY.");
                }
                if (response.statusCode() == 429) {
                    throw new IllegalStateException("OpenAI rate limit reached. Please try again shortly.");
                }

                throw new RuntimeException("OpenAI error " + response.statusCode() + ": " + errorMessage);
            }

            JsonNode json = mapper.readTree(response.body());
            JsonNode choices = json.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new RuntimeException("OpenAI response did not include choices");
            }
            return choices.get(0).path("message").path("content").asText("");
        } catch (java.lang.InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("AI chat request interrupted", e);
            throw new IllegalStateException("AI request was interrupted. Please retry.", e);
        } catch (java.io.IOException e) {
            String causeType = e.getClass().getSimpleName();
            String rawMessage = e.getMessage();
            String causeMessage =
                    (rawMessage != null && !rawMessage.isBlank())
                            ? rawMessage
                            : (e.getCause() != null && e.getCause().getMessage() != null
                                ? e.getCause().getMessage()
                                : "No additional details");

            log.error("AI chat IO failure ({}): {}", causeType, causeMessage, e);
            throw new RuntimeException(
                    "AI network error contacting OpenAI (" + causeType + "): " + causeMessage,
                    e
            );
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage(), e);
            if (e instanceof IllegalArgumentException || e instanceof IllegalStateException) {
                throw e;
            }
            throw new RuntimeException("AI request failed: " + e.getMessage(), e);
        }
    }
}
