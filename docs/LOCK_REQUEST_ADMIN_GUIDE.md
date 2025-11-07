# Admin Guide: How to Approve/Reject Lock Requests

## Overview

As an admin, you can review and manage investor lock requests for marketplace listings. This guide walks you through the approval workflow.

## Accessing the Lock Requests Dashboard

1. Log in to your admin account
2. Navigate to the **Lock Requests** menu item in the admin sidebar
3. You'll see three tabs:
   - **Pending** - Requests awaiting your review
   - **Approved** - Previously approved requests
   - **Rejected** - Previously rejected requests

## Reviewing Pending Requests

### Viewing Request Details

Each request in the table shows:
- **Request ID** - Unique identifier for the request
- **Date** - When the request was submitted
- **Listing Address** - Property address
- **Lock Status** - Whether the listing is already locked
- **Investor** - Name and email of the requesting investor
- **Lawyer** - Lawyer name, LSO number, and email
- **Borrower** - Borrower information
- **Mortgage Details** - Loan amount and LTV
- **Notes** - Optional notes from the investor
- **Status** - Current request status

### Using Filters and Search

- **Search**: Use the search bar to find requests by investor name/email or property address
- **Filter by Lock Status**: In the Pending tab, filter to show only locked or unlocked listings
- **Sort**: Click column headers to sort by date, investor, listing address, or lock status

### Understanding Lock Status

- **Available** (green badge) - Listing is not locked and can be approved
- **Locked** (red badge) - Listing is already locked by another investor
  - ⚠️ **Important**: You cannot approve requests for locked listings. The Approve button will be disabled.

## Approving a Lock Request

### Steps to Approve

1. Navigate to the **Pending** tab
2. Find the request you want to approve
3. Verify the listing is **Available** (not locked)
4. Click the **Approve** button
5. Confirm the approval in the dialog

### What Happens When You Approve

- The request status changes to `approved`
- The listing is immediately locked for that investor
- The listing shows a "Locked" badge on the marketplace
- Other pending requests for the same listing remain pending (they can still be rejected)
- The investor receives real-time notification that their request was approved

### Important Notes

- **Atomic Updates**: The system uses atomic transactions to prevent race conditions. If two admins try to approve the same listing simultaneously, only one will succeed.
- **Race Condition Handling**: If you see an error "Listing was locked by another admin", the listing was already locked by another admin. You'll need to reject the request instead.
- **Multiple Requests**: Multiple investors can have pending requests for the same listing. You choose which one to approve.

## Rejecting a Lock Request

### Steps to Reject

1. Navigate to the **Pending** tab
2. Find the request you want to reject
3. Click the **Reject** button
4. Optionally provide a rejection reason in the text area
5. Click **Reject Request** to confirm

### When to Reject

Common reasons for rejection:
- Listing is already locked by another investor
- Investor information is incomplete or incorrect
- Lawyer information is invalid or missing
- Request violates business rules
- Listing is no longer available

### Providing Rejection Reasons

- **Optional but Recommended**: While rejection reasons are optional, providing them helps investors understand why their request was denied
- **Character Limit**: No limit on rejection reason length
- **Investor Visibility**: Investors will see the rejection reason in their request status

## Best Practices

### Review Process

1. **Check Lock Status First**: Always verify the listing is available before approving
2. **Review Request Notes**: Read investor notes to understand their intent
3. **Verify Lawyer Information**: Ensure lawyer details are complete and valid
4. **Check for Other Requests**: Look for other pending requests for the same listing
5. **Act Promptly**: Review requests in a timely manner to maintain investor satisfaction

### Handling Multiple Requests

- When multiple investors request the same listing:
  - Review all requests before approving any
  - Consider request order (first-come-first-served) or other business criteria
  - Reject other requests after approving one
  - Use the "X other pending requests" indicator to see how many are waiting

### Communication

- **Rejection Reasons**: Always provide clear, helpful rejection reasons
- **Timeliness**: Review requests within 24-48 hours when possible
- **Consistency**: Apply the same approval criteria consistently

## Troubleshooting

### Can't Approve a Request

**Problem**: Approve button is disabled or you get an error

**Solutions**:
- Check if the listing is already locked (red "Locked" badge)
- Refresh the page to see the latest status
- If another admin approved it, reject the request instead

### Request Disappeared

**Problem**: A pending request is no longer visible

**Possible Reasons**:
- Another admin approved or rejected it
- The investor cancelled the request
- The listing was deleted (requests prevent deletion)

### Seeing Duplicate Requests

**Problem**: Multiple requests for the same listing

**This is Normal**: Multiple investors can request the same listing. You choose which one to approve.

## Related Documentation

- [Lock Request Workflow](../LOCK_REQUEST_WORKFLOW.md) - Technical documentation
- [Investor Guide: How to Request Listing Locks](./LOCK_REQUEST_INVESTOR_GUIDE.md) - Guide for investors

