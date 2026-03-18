package com.xfrizon.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AiChatRequest {

    /** "write" | "research" | "chat" */
    private String mode;

    /** The latest user message */
    private String userMessage;

    /** Full conversation history including system prompt as first entry */
    private List<Map<String, String>> messages;

    private Integer maxTokens;

    private Double temperature;
}
