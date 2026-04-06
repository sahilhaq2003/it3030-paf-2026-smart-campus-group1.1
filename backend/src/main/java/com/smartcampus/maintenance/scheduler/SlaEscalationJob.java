package com.smartcampus.maintenance.scheduler;

import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.policy.SlaPolicy;
import com.smartcampus.maintenance.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class SlaEscalationJob {

    private final TicketRepository ticketRepo;

    // Runs every 30 minutes
    @Scheduled(fixedRate = 30 * 60 * 1000)
    @Transactional
    public void escalateLowPriorityTickets() {
        // Escalate LOW → MEDIUM if open > 48 hours
        var cutoff = LocalDateTime.now().minusHours(48);
        var tickets = ticketRepo.findOpenTicketsBefore(Priority.LOW, cutoff);

        tickets.forEach(t -> {
            t.setPriority(Priority.MEDIUM);
            if (t.getCreatedAt() != null) {
                t.setSlaDeadline(t.getCreatedAt().plusHours(SlaPolicy.hoursFor(Priority.MEDIUM)));
            }
            log.info("SLA Escalation: Ticket #{} escalated LOW → MEDIUM (open since {})",
                t.getId(), t.getCreatedAt());
        });

        ticketRepo.saveAll(tickets);
        log.info("SLA Job: Escalated {} tickets", tickets.size());
    }
}