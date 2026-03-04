package com.xfrizon.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.xfrizon.dto.*;
import com.xfrizon.entity.PaymentRecord;
import com.xfrizon.entity.User;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.repository.UserTicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class OrganizerPayoutService {

    private final UserRepository userRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final UserTicketRepository userTicketRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${xfrizon.stripe.connect.country:NG}")
    private String stripeConnectCountry;

    @Value("${xfrizon.stripe.connect.refresh-url:http://localhost:5173/organizer/settings/payouts}")
    private String stripeConnectRefreshUrl;

    @Value("${xfrizon.stripe.connect.return-url:http://localhost:5173/organizer/settings/payouts?stripe=connected}")
    private String stripeConnectReturnUrl;

    public OrganizerPayoutService(UserRepository userRepository, PaymentRecordRepository paymentRecordRepository, UserTicketRepository userTicketRepository) {
        this.userRepository = userRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.userTicketRepository = userTicketRepository;
    }

    public StripeOnboardingResponse createOrResumeOnboarding(Long organizerId) {
        try {
            Stripe.apiKey = stripeApiKey;

            User organizer = getOrganizerOrThrow(organizerId);
            String stripeAccountId = organizer.getStripeAccountId();
            User.PayoutCadence cadence = organizer.getPayoutCadence() != null
                    ? organizer.getPayoutCadence()
                    : User.PayoutCadence.WEEKLY;

            if (stripeAccountId == null || stripeAccountId.isBlank()) {
                Account stripeAccount = createConnectedAccount(organizer);
                stripeAccountId = stripeAccount.getId();
                organizer.setStripeAccountId(stripeAccountId);
                organizer.setPayoutCadence(cadence);
                userRepository.save(organizer);
            }

            applyPayoutSchedule(stripeAccountId, cadence);

            AccountLink accountLink = createOnboardingLink(stripeAccountId);

            return StripeOnboardingResponse.builder()
                    .stripeAccountId(stripeAccountId)
                    .onboardingUrl(accountLink.getUrl())
                    .build();
        } catch (StripeException e) {
            log.error("Stripe error while creating/resuming onboarding for organizer {}", organizerId, e);
            throw new IllegalStateException("Failed to initialize Stripe onboarding: " + e.getMessage());
        }
    }

    public StripeConnectStatusResponse getConnectStatus(Long organizerId) {
        try {
            Stripe.apiKey = stripeApiKey;

            User organizer = getOrganizerOrThrow(organizerId);
            if (organizer.getStripeAccountId() == null || organizer.getStripeAccountId().isBlank()) {
                return StripeConnectStatusResponse.builder()
                        .stripeAccountId(null)
                        .chargesEnabled(false)
                        .payoutsEnabled(false)
                        .detailsSubmitted(false)
                        .payoutCadence((organizer.getPayoutCadence() != null ? organizer.getPayoutCadence() : User.PayoutCadence.WEEKLY).name())
                        .build();
            }

            Account account = Account.retrieve(organizer.getStripeAccountId());

            return StripeConnectStatusResponse.builder()
                    .stripeAccountId(organizer.getStripeAccountId())
                    .chargesEnabled(Boolean.TRUE.equals(account.getChargesEnabled()))
                    .payoutsEnabled(Boolean.TRUE.equals(account.getPayoutsEnabled()))
                    .detailsSubmitted(Boolean.TRUE.equals(account.getDetailsSubmitted()))
                    .payoutCadence((organizer.getPayoutCadence() != null ? organizer.getPayoutCadence() : User.PayoutCadence.WEEKLY).name())
                    .build();
        } catch (StripeException e) {
            log.error("Stripe error while fetching connect status for organizer {}", organizerId, e);
            throw new IllegalStateException("Failed to fetch Stripe account status: " + e.getMessage());
        }
    }

    public StripeConnectStatusResponse updatePayoutCadence(Long organizerId, String cadence) {
        try {
            Stripe.apiKey = stripeApiKey;

            User organizer = getOrganizerOrThrow(organizerId);
            User.PayoutCadence payoutCadence = parseCadence(cadence);

            if (organizer.getStripeAccountId() == null || organizer.getStripeAccountId().isBlank()) {
                throw new IllegalArgumentException("Organizer has not connected Stripe yet. Complete onboarding first.");
            }

            Account updatedAccount = applyPayoutSchedule(organizer.getStripeAccountId(), payoutCadence);

            organizer.setPayoutCadence(payoutCadence);
            userRepository.save(organizer);

            return StripeConnectStatusResponse.builder()
                    .stripeAccountId(organizer.getStripeAccountId())
                    .chargesEnabled(Boolean.TRUE.equals(updatedAccount.getChargesEnabled()))
                    .payoutsEnabled(Boolean.TRUE.equals(updatedAccount.getPayoutsEnabled()))
                    .detailsSubmitted(Boolean.TRUE.equals(updatedAccount.getDetailsSubmitted()))
                    .payoutCadence(payoutCadence.name())
                    .build();
        } catch (StripeException e) {
            log.error("Stripe error while updating payout cadence for organizer {}", organizerId, e);
            throw new IllegalStateException("Failed to update payout cadence: " + e.getMessage());
        }
    }

    private User getOrganizerOrThrow(Long organizerId) {
        User user = userRepository.findByIdAndIsActiveTrue(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

        if (!User.UserRole.ORGANIZER.equals(user.getRole())) {
            throw new IllegalArgumentException("Only organizers can manage payout settings");
        }

        return user;
    }

    private Account createConnectedAccount(User organizer) throws StripeException {
        Map<String, Object> createParams = new HashMap<>();
        createParams.put("type", "express");
        createParams.put("country", stripeConnectCountry);
        createParams.put("email", organizer.getEmail());

        Map<String, Object> cardPayments = new HashMap<>();
        cardPayments.put("requested", true);
        Map<String, Object> transfers = new HashMap<>();
        transfers.put("requested", true);

        Map<String, Object> capabilities = new HashMap<>();
        capabilities.put("card_payments", cardPayments);
        capabilities.put("transfers", transfers);

        createParams.put("capabilities", capabilities);

        return Account.create(createParams);
    }

    private AccountLink createOnboardingLink(String stripeAccountId) throws StripeException {
        Map<String, Object> linkParams = new HashMap<>();
        linkParams.put("account", stripeAccountId);
        linkParams.put("refresh_url", stripeConnectRefreshUrl);
        linkParams.put("return_url", stripeConnectReturnUrl);
        linkParams.put("type", "account_onboarding");

        return AccountLink.create(linkParams);
    }

    private Account applyPayoutSchedule(String stripeAccountId, User.PayoutCadence payoutCadence) throws StripeException {
        Map<String, Object> schedule = new HashMap<>();
        if (payoutCadence == User.PayoutCadence.MONTHLY) {
            schedule.put("interval", "monthly");
            schedule.put("monthly_anchor", 1);
        } else {
            schedule.put("interval", "weekly");
            schedule.put("weekly_anchor", "friday");
        }

        Map<String, Object> payouts = new HashMap<>();
        payouts.put("schedule", schedule);

        Map<String, Object> settings = new HashMap<>();
        settings.put("payouts", payouts);

        Map<String, Object> updateParams = new HashMap<>();
        updateParams.put("settings", settings);

        Account account = Account.retrieve(stripeAccountId);
        return account.update(updateParams);
    }

    private User.PayoutCadence parseCadence(String cadence) {
        if (cadence == null) {
            throw new IllegalArgumentException("Cadence is required. Use WEEKLY or MONTHLY");
        }

        try {
            return User.PayoutCadence.valueOf(cadence.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid cadence. Use WEEKLY or MONTHLY");
        }
    }

    public PayoutReportResponse getPayoutReport(Long organizerId, LocalDateTime from, LocalDateTime to) {
        User organizer = getOrganizerOrThrow(organizerId);
        
        // Default to WEEKLY if cadence is not set
        User.PayoutCadence cadence = organizer.getPayoutCadence() != null 
            ? organizer.getPayoutCadence() 
            : User.PayoutCadence.WEEKLY;
        
        LocalDateTime startDate = from != null ? from : LocalDateTime.now().minusMonths(3);
        LocalDateTime endDate = to != null ? to : LocalDateTime.now();
        
        // Fetch all payments for organizer in the date range
        List<PaymentRecord> payments = paymentRecordRepository.findPaymentsByOrganizerWithinDateRange(organizerId, startDate, endDate);
        
        // Group payments by payout window (weekly or monthly)
        Map<String, List<PaymentRecord>> payoutWindows = groupPaymentsByWindow(payments, cadence);
        
        // Calculate report for each window
        List<PayoutWindowReport> windowReports = payoutWindows.entrySet().stream()
                .map(entry -> buildWindowReport(entry.getKey(), entry.getValue(), cadence))
                .sorted(Comparator.comparing(PayoutWindowReport::getWindowStart))
                .collect(Collectors.toList());
        
        // Calculate totals
        BigDecimal totalGross = payments.stream()
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalServiceFee = payments.stream()
                .map(PaymentRecord::getServiceFeeAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalNet = payments.stream()
                .map(PaymentRecord::getOrganizerAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Count total tickets from UserTicket records
        Integer totalTickets = 0;
        for (PaymentRecord payment : payments) {
            Integer ticketCount = userTicketRepository.sumQuantityByPaymentIntentId(payment.getStripeIntentId());
            if (ticketCount != null) {
                totalTickets += ticketCount;
            }
        }
        
        PayoutReportResponse.PayoutTotals totals = PayoutReportResponse.PayoutTotals.builder()
                .totalGrossRevenue(totalGross)
                .totalServiceFee(totalServiceFee)
                .totalNetForOrganizer(totalNet)
                .totalPaymentRecords(payments.size())
                .totalTicketsSold(totalTickets > 0 ? totalTickets : payments.size())
                .build();
        
        // Determine currency from first payment (assuming all same currency)
        String currency = !payments.isEmpty() ? payments.get(0).getCurrency() : "NGN";
        
        String organizerName = organizer.getFirstName() + " " + organizer.getLastName();
        return PayoutReportResponse.builder()
                .organizerId(organizerId)
                .organizerName(organizerName)
                .currency(currency)
                .payoutSummary(windowReports)
                .totals(totals)
                .build();
    }

    private Map<String, List<PaymentRecord>> groupPaymentsByWindow(List<PaymentRecord> payments, User.PayoutCadence cadence) {
        Map<String, List<PaymentRecord>> windows = new LinkedHashMap<>();
        
        for (PaymentRecord payment : payments) {
            String windowKey = getPayoutWindowKey(payment.getCreatedAt(), cadence);
            windows.computeIfAbsent(windowKey, k -> new ArrayList<>()).add(payment);
        }
        
        return windows;
    }

    private String getPayoutWindowKey(LocalDateTime dateTime, User.PayoutCadence cadence) {
        if (cadence == User.PayoutCadence.MONTHLY) {
            // Format: "2026-03" for monthly
            return dateTime.getYear() + "-" + String.format("%02d", dateTime.getMonthValue());
        } else {
            // Weekly: Monday to Sunday, use ISO week
            // Format: "2026-W09" for week 9
            return dateTime.getYear() + "-W" + String.format("%02d", getWeekOfYear(dateTime));
        }
    }

    private PayoutWindowReport buildWindowReport(String windowKey, List<PaymentRecord> payments, User.PayoutCadence cadence) {
        LocalDateTime startDate = getWindowStartDate(windowKey, cadence);
        LocalDateTime endDate = getWindowEndDate(windowKey, cadence);
        
        BigDecimal grossRevenue = payments.stream()
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal serviceFeeTotal = payments.stream()
                .map(PaymentRecord::getServiceFeeAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal netForOrganizer = payments.stream()
                .map(PaymentRecord::getOrganizerAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Count actual UserTickets instead of PaymentRecords
        Integer totalTickets = 0;
        for (PaymentRecord payment : payments) {
            Integer ticketCount = userTicketRepository.sumQuantityByPaymentIntentId(payment.getStripeIntentId());
            if (ticketCount != null) {
                totalTickets += ticketCount;
            }
        }
        
        // Calculate average price per ticket (grossRevenue / total tickets)
        BigDecimal avgPricePerTicket = BigDecimal.ZERO;
        if (totalTickets > 0) {
            avgPricePerTicket = grossRevenue.divide(
                    new BigDecimal(totalTickets),
                    2,
                    java.math.RoundingMode.HALF_UP
            );
        }
        
        return PayoutWindowReport.builder()
                .window(formatWindow(windowKey, cadence))
                .cadence(cadence.toString())
                .windowStart(startDate)
                .windowEnd(endDate)
                .totalTicketsSold(totalTickets > 0 ? totalTickets : payments.size())  // Fallback to payment count if no tickets found
                .grossRevenue(grossRevenue)
                .serviceFeeTotal(serviceFeeTotal)
                .netForOrganizer(netForOrganizer)
                .paymentRecordsCount(payments.size())
                .avgPricePerTicket(avgPricePerTicket)
                .build();
    }

    private LocalDateTime getWindowStartDate(String windowKey, User.PayoutCadence cadence) {
        if (cadence == User.PayoutCadence.MONTHLY) {
            String[] parts = windowKey.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            return LocalDateTime.of(year, month, 1, 0, 0, 0);
        } else {
            // Weekly: return Monday of the week
            String[] parts = windowKey.split("-W");
            int year = Integer.parseInt(parts[0]);
            int week = Integer.parseInt(parts[1]);
            return getMonday(getDateFromWeek(year, week));
        }
    }

    private LocalDateTime getWindowEndDate(String windowKey, User.PayoutCadence cadence) {
        if (cadence == User.PayoutCadence.MONTHLY) {
            String[] parts = windowKey.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            LocalDateTime firstDay = LocalDateTime.of(year, month, 1, 0, 0, 0);
            return firstDay.plusMonths(1).minusSeconds(1);
        } else {
            // Weekly: return Sunday of the week
            String[] parts = windowKey.split("-W");
            int year = Integer.parseInt(parts[0]);
            int week = Integer.parseInt(parts[1]);
            LocalDateTime monday = getMonday(getDateFromWeek(year, week));
            return monday.plusDays(6).withHour(23).withMinute(59).withSecond(59);
        }
    }

    private String formatWindow(String windowKey, User.PayoutCadence cadence) {
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("d");
        DateTimeFormatter yearFormatter = DateTimeFormatter.ofPattern("yyyy");
        
        LocalDateTime startDate = getWindowStartDate(windowKey, cadence);
        LocalDateTime endDate = getWindowEndDate(windowKey, cadence);
        
        if (cadence == User.PayoutCadence.MONTHLY) {
            String month = startDate.format(DateTimeFormatter.ofPattern("MMMM"));
            String year = startDate.format(yearFormatter);
            return month + " " + year;
        } else {
            String[] parts = windowKey.split("-W");
            String weekNumber = parts[1];
            String startMonth = startDate.format(monthFormatter);
            String startDay = startDate.format(dayFormatter);
            String endDay = endDate.format(dayFormatter);
            String year = startDate.format(yearFormatter);
            
            // If dates span different months, show both months
            if (startDate.getMonthValue() != endDate.getMonthValue()) {
                String endMonth = endDate.format(monthFormatter);
                return "Week " + weekNumber + ": " + startMonth + " " + startDay + "-" + endMonth + " " + endDay + ", " + year;
            } else {
                return "Week " + weekNumber + ": " + startMonth + " " + startDay + "-" + endDay + ", " + year;
            }
        }
    }

    private int getWeekOfYear(LocalDateTime dateTime) {
        return dateTime.get(java.time.temporal.WeekFields.ISO.weekOfYear());
    }

    private LocalDateTime getDateFromWeek(int year, int week) {
        return LocalDateTime.of(year, 1, 4, 0, 0, 0)
                .with(java.time.temporal.WeekFields.ISO.weekOfYear(), week)
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
    }

    private LocalDateTime getMonday(LocalDateTime date) {
        return date.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .withHour(0).withMinute(0).withSecond(0);
    }
}
