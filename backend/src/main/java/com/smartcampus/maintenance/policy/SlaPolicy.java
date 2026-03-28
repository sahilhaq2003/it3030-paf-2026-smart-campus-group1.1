package com.smartcampus.maintenance.policy;

import com.smartcampus.maintenance.model.enums.Priority;

/**
 * SLA target hours from ticket creation: CRITICAL 2h, HIGH 8h; other priorities use longer windows.
 */
public final class SlaPolicy {

    private SlaPolicy() {}

    public static int hoursFor(Priority priority) {
        if (priority == null) {
            return 72;
        }
        return switch (priority) {
            case CRITICAL -> 2;
            case HIGH -> 8;
            case MEDIUM -> 48;
            case LOW -> 72;
        };
    }
}
