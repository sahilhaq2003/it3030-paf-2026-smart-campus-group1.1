import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { getMemoryToken } from "../api/authTokenMemory";

/**
 * Hook to subscribe to real-time ticket updates via SSE notifications.
 * Automatically invalidates ticket-related caches when:
 * - New tickets are submitted
 * - Ticket status changes
 * - Technicians are assigned
 * 
 * This provides instant updates across all pages without waiting for staleTime.
 */
export function useTicketUpdates(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    
    const token = getMemoryToken();
    if (!token) {
      console.debug("useTicketUpdates: No token available, skipping SSE connection");
      return;
    }

    const baseUrl = axiosInstance.defaults.baseURL || "http://localhost:8081/api";
    const streamUrl = `${baseUrl}/notifications/stream?access_token=${encodeURIComponent(token)}`;

    let es;
    
    try {
      es = new EventSource(streamUrl);
      console.debug("useTicketUpdates: SSE connection opened to", baseUrl);

      // Handle connection open
      es.addEventListener("connected", () => {
        console.debug("useTicketUpdates: Connected to notification stream");
      });

      // Listen for ticket-related events
      es.addEventListener("notification", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.debug("useTicketUpdates: Received notification", data);
          
          // Invalidate relevant caches when ticket events occur
          if (data?.type || data?.message?.includes("Ticket") || data?.referenceType === "TICKET") {
            console.debug("useTicketUpdates: Invalidating ticket caches");
            
            // Invalidate all ticket-related caches for instant updates
            queryClient.invalidateQueries({ 
              queryKey: ["tickets", "my"],
              refetchType: 'active'
            });
            queryClient.invalidateQueries({ 
              queryKey: ["admin", "tickets", "list"],
              refetchType: 'active'
            });
            queryClient.invalidateQueries({ 
              queryKey: ["dashboard", "myTickets"],
              refetchType: 'active'
            });
            queryClient.invalidateQueries({ 
              queryKey: ["admin", "technician", "performance"],
              refetchType: 'active'
            });
          }
        } catch (err) {
          console.debug("useTicketUpdates: Error parsing notification:", err);
        }
      });

      // Handle errors
      es.addEventListener("error", (err) => {
        console.error("useTicketUpdates: SSE connection error:", err);
        if (es.readyState === EventSource.CLOSED) {
          console.debug("useTicketUpdates: SSE connection closed");
        }
      });

    } catch (err) {
      console.error("useTicketUpdates: Failed to create EventSource:", err);
    }

    // Cleanup on unmount
    return () => {
      if (es) {
        console.debug("useTicketUpdates: Closing SSE connection");
        es.close();
      }
    };
  }, [enabled, queryClient]);
}

