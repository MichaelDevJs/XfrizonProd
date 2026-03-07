package com.xfrizon.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.Locale;

@Configuration
@Slf4j
public class StripeConfig {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        String key = stripeApiKey == null ? "" : stripeApiKey.trim();
        String lowered = key.toLowerCase(Locale.ROOT);

        if (key.isEmpty()
                || lowered.startsWith("replace-")
                || lowered.startsWith("your_")
                || lowered.contains("placeholder")) {
            log.error("Stripe is not configured. Set STRIPE_API_KEY in environment variables.");
            return;
        }

        if (!(key.startsWith("sk_test_") || key.startsWith("sk_live_"))) {
            log.error("Invalid Stripe secret key format. Expected key starting with sk_test_ or sk_live_.");
            return;
        }

        Stripe.apiKey = key;
        log.info("Stripe API initialized");
    }
}
