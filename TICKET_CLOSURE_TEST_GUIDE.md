# Ticket Closure - Complete Testing Guide

## Overview
This guide verifies that ticket closure works correctly and updates immediately on all pages.

## Implementation Summary
✅ **Backend**: Properly publishes `TicketStatusChangedEvent` and broadcasts notifications via SSE  
✅ **Frontend**: All relevant query caches are now invalidated on status changes  

---

## Test Scenarios

### Scenario 1: User Closes Resolved Ticket (Primary Flow)

**Setup:**
1. Log in as a regular user (not admin/technician)
2. Navigate to "My Tickets" or ticket detail page
3. Look for a ticket with status = "RESOLVED"

**Step-by-Step:**
1. Open the resolved ticket in detail page
2. You should see a blue box: "Satisfied with the resolution?" with "Close Ticket" button
3. Click "Close Ticket"
4. Confirm the action in the popup
5. You should see toast: "Ticket successfully closed"

**Verification Points:**
- ✅ Ticket detail page shows status "CLOSED"
- ✅ Close button disappears, shows "Ticket Closed" badge instead
- ✅ Go back to "My Tickets" page → ticket still shows "Closed"
- ✅ Open Dashboard → "My campus overview" → ticket count updated
- ✅ Open Profile page (if available) → ticket marked as closed

**Expected Timeline:**
- Optimistic update: Instant (before server response)
- Server response: < 500ms
- Full cache sync: < 1s

---

### Scenario 2: Admin Sees User's Closed Ticket

**Setup:**
1. **Tab A**: Admin user logged in
2. **Tab B**: Regular user logged in

**Step-by-Step:**
1. **Tab B (User)**: Close a ticket following Scenario 1
2. **Tab A (Admin)**: 
   - Refresh Admin Tickets page (or wait for it to auto-update)
   - Find the same ticket

**Verification Points:**
- ✅ Ticket appears with "CLOSED" status in admin list
- ✅ Status shows as "Completed" badge
- ✅ Ticket no longer appears in action queue (no "Assign Tech" button)
- ✅ Technician Performance metrics updated (if applicable)

---

### Scenario 3: Technician Resolves → User Closes

**Setup:**
1. **Tab A**: Technician logged in with an assigned ticket (IN_PROGRESS)
2. **Tab B**: Original user who reported the ticket

**Step-by-Step:**
1. **Tab A (Technician)**:
   - Open Dashboard or ticket detail
   - Click "Mark Resolved" 
   - Add resolution notes
   - Submit

2. **Tab B (User)**:
   - Go to "My Tickets" or Dashboard
   - Find the ticket with status "RESOLVED"
   - Click "Close Ticket"

**Verification Points:**
- ✅ **Tab A**: Dashboard updates showing ticket moved to resolved count
- ✅ **Tab B**: Ticket shows "RESOLVED" → user can close it
- ✅ **Tab B**: After closing, badge shows final "CLOSED" status
- ✅ **Tab A**: If admin also viewing → ticket disappears from active queue

---

### Scenario 4: Error Handling - User Tries Invalid Close

**Setup:**
1. Open a ticket with status "OPEN" or "IN_PROGRESS" (NOT resolved)

**Expected Behavior:**
1. No "Close Ticket" button visible (button only shows for RESOLVED stat)
2. If you somehow trigger close via API:
   - Error toast: "Cannot close ticket. Only tickets with RESOLVED status..."
   - UI reverts to previous state immediately

**Verification Points:**
- ✅ Invalid states cannot be closed
- ✅ Error message is clear and specific
- ✅ No data corruption or stuck UI state

---

### Scenario 5: Idempotent Close (Close Already-Closed Ticket)

**Setup:**
1. Ticket status is already "CLOSED"
2. User accidentally clicks "Close Ticket" again (or makes API call)

**Expected Behavior:**
1. Should succeed (idempotent: same result)
2. Toast: "Ticket successfully closed" (or similar success message)
3. UI remains unchanged

**Verification Points:**
- ✅ Second close works without error
- ✅ `closedAt` timestamp doesn't change (set only on first RESOLVED→CLOSED)
- ✅ No duplicate notifications

---

## Cache Invalidation Verification

### Query Keys Now Synced:
1. `["ticket", {id}]` - Ticket detail page
2. `["tickets", "my"]` - My Tickets page
3. `["dashboard", "myTickets"]` - User dashboard
4. `["dashboard", "assignedTickets"]` - Technician assigned tickets
5. `["admin", "tickets", "list"]` - Admin tickets page
6. `["admin", "technician", "performance"]` - Performance metrics
7. `["profile", "myTickets"]` - Profile page ticket list

### How to Verify Sync:
1. Open Admin Tools → React Query DevTools (if available)
2. Make a change (close/resolve ticket)
3. Watch cache keys update in real-time
4. Verify data across multiple pages automatically refreshes

---

## Real-Time Notification Verification

### SSE Setup:
- Backend broadcasts via `/api/notifications/stream`
- Frontend receives `TicketStatusChangedEvent` notifications

### How to Test:
1. Open browser DevTools → Network tab
2. Look for EventSource connection to `/stream?access_token=...`
3. Perform ticket status change
4. Watch for event payload in Network tab

**Expected Notification Payload:**
```json
{
  "type": "TICKET_OR_ADMIN_ACTION",
  "title": "Ticket status updated",
  "message": "Ticket #299: RESOLVED → CLOSED",
  "referenceId": 299,
  "referenceType": "TICKET",
  "read": false
}
```

---

## Multi-Tab Verification

### Setup:
1. **Tab A**: Admin viewing admin/tickets
2. **Tab B**: User viewing my-tickets  
3. **Tab C**: Same user on dashboard

### Test:
1. **Tab B**: Close a ticket
2. **Tab A**: Should auto-update (if page is fresh within staleTime)
3. **Tab C**: Dashboard count should reflect closure

---

## Performance Checklist

- [ ] Optimistic update appears immediately (< 100ms)
- [ ] Server responds within 500ms
- [ ] All related pages update within 1000ms
- [ ] No UI flickering or loading states on cached pages
- [ ] Error toast appears clearly without state corruption

---

## Mobile/Responsive Test

- [ ] Close button visible on mobile
- [ ] Confirmation dialog displays properly
- [ ] Toast notifications visible on smaller screens
- [ ] Status update propagates on mobile dashboards

---

## Rollback/Error Recovery Test

**To Trigger Error:**
1. Close DevTools Network and disconnect network temporarily
2. Click "Close Ticket"
3. Should show error toast
4. UI should revert to previous state (RESOLVED, not CLOSED)

**Verification Points:**
- ✅ Error message is specific
- ✅ UI recovers cleanly
- ✅ No orphaned/inconsistent state
- ✅ Retry should work after reconnect

---

## Post-Test Checklist

- [ ] All query caches properly invalidated
- [ ] No console errors
- [ ] No unhandled promise rejections
- [ ] All status transitions logged correctly
- [ ] Notifications sent to all recipients
- [ ] Performance is acceptable

---

## Known Behaviors

1. **Optimistic Updates**: UI updates before server confirmation
2. **Cache TTL**: Stale data refetches after 5-10 minutes on pages
3. **Real-Time**: SSE notifications broadcast to all connected clients
4. **Idempotent**: Closing an already-closed ticket succeeds without error
5. **Permissions**: Only reporter can close; technicians cannot close directly

---

## Debugging

If issues occur:

1. **Open Browser DevTools**:
   - Network tab: Check API response status (should be 200)
   - Console: Check for JavaScript errors
   - React Query DevTools: Inspect cache state

2. **Check Backend Logs**:
   ```bash
   tail -f backend/logs/application.log | grep -i "ticket\|close"
   ```

3. **Verify Event Publishing**:
   - Check if `TicketStatusChangedEvent` is published
   - Check if `TicketEventListener` receives event
   - Check if notification created in database

4. **SSE Debugging**:
   - Browser DevTools → Network → Find EventSource connection
   - Should show "connected" event on stream open
   - Should receive "notification" events on status change

---

## Rollback Plan

If issues are found:

1. **Revert Frontend Changes**: Restore TicketDetailPage.jsx from git
2. **Verify Backend**: Backend changes are non-breaking (events still published)
3. **Clear Browser Cache**: `localStorage.clear()` + hard refresh
4. **Test Basic Flow**: Ensure system returns to previous state

