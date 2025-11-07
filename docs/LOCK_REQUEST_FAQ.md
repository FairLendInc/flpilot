# FAQ: Lock Request Approval Workflow

## General Questions

### Why do I need admin approval to lock a listing?

**Answer**: Admin approval ensures:
- **Quality Control**: Admins verify that requests meet platform standards
- **Fair Access**: Prevents abuse and ensures fair distribution of listings
- **Compliance**: Ensures all legal and business requirements are met
- **Conflict Resolution**: Admins can handle conflicts when multiple investors request the same listing

### How long does the approval process take?

**Answer**: 
- Typical review time: **24-48 hours**
- Admins review requests during business hours
- You'll receive real-time updates when your request is reviewed
- Urgent requests may be reviewed faster

### Can I lock a listing without admin approval?

**Answer**: 
- **No**, all lock requests require admin approval
- This ensures fair access and prevents conflicts
- Admins can directly lock listings, but investors must go through the approval process

### What happens if multiple investors request the same listing?

**Answer**:
- Multiple investors can submit requests for the same listing
- Admins review all requests and choose which one to approve
- Once approved, other requests remain pending and can be rejected
- The first-come-first-served principle may apply, but admins have discretion

## For Investors

### Do I need to provide lawyer information?

**Answer**: 
- **Yes**, lawyer information is required for all lock requests:
  - Lawyer's full name
  - Lawyer's LSO (Law Society of Ontario) number
  - Lawyer's professional email address
- This information is needed for legal compliance and documentation

### Can I cancel my request after submitting?

**Answer**:
- **Yes**, you can cancel requests that are still **pending**
- Once approved or rejected, you cannot cancel
- Go to the listing detail page and click "Cancel Request"

### What if I make a mistake in my request?

**Answer**:
- You cannot edit requests after submission
- **Solution**: Cancel the pending request and submit a new one
- Ensure all information is correct before submitting

### Can I request multiple listings at once?

**Answer**:
- **Yes**, you can submit requests for multiple listings simultaneously
- Each request is independent
- You can have multiple pending requests at the same time

### Will I be notified when my request is approved or rejected?

**Answer**:
- **Yes**, you'll see real-time status updates on the listing detail page
- Status changes automatically without refreshing
- Check the listing page to see your request status

### What does "Locked" mean?

**Answer**:
- A locked listing is **reserved** for a specific investor
- Other investors cannot request locked listings
- Locked listings remain visible in the marketplace but show a "Locked" badge
- The lock gives you exclusive access to complete your investment

## For Admins

### How do I know which request to approve when there are multiple?

**Answer**:
- Review all pending requests for the listing
- Consider:
  - Request order (first-come-first-served)
  - Investor notes and investment intent
  - Completeness of information
  - Business rules and policies
- Use your discretion based on business needs

### What if I accidentally approve the wrong request?

**Answer**:
- Once approved, the listing is locked to that investor
- You cannot undo an approval
- You can reject other pending requests
- Contact support if you need to unlock a listing

### Can I approve a request for an already-locked listing?

**Answer**:
- **No**, the system prevents this
- The Approve button is disabled for locked listings
- You'll see an error if you try to approve a locked listing
- Reject the request instead

### Do I have to provide a rejection reason?

**Answer**:
- **No**, rejection reasons are optional
- **However**, providing reasons is recommended:
  - Helps investors understand why
  - Improves transparency
  - Reduces support inquiries
  - Better user experience

### How do I handle race conditions?

**Answer**:
- The system handles race conditions automatically
- If two admins approve simultaneously, only one succeeds
- The other admin will see an error message
- This prevents double-locking and ensures data integrity

## Technical Questions

### How does real-time updates work?

**Answer**:
- The system uses Convex React hooks (`useQuery`)
- Status updates automatically without page refresh
- Changes appear immediately when admins approve/reject
- No polling or manual refresh needed

### What prevents double-locking?

**Answer**:
- **Atomic transactions** in the approval process
- The system checks listing availability before locking
- If the listing is already locked, the transaction fails
- This prevents race conditions and double-locking

### Can listings be deleted if they have requests?

**Answer**:
- **No**, listings with existing lock requests cannot be deleted
- This prevents data loss and maintains request history
- Delete requests first, then delete the listing

### What happens to pending requests when a listing is locked?

**Answer**:
- Pending requests remain pending
- They are not automatically rejected
- Admins can manually reject them
- This gives admins control over the process

## Best Practices

### For Investors

✅ **Submit Complete Information**
- Fill out all required fields
- Verify email formats
- Double-check LSO numbers

✅ **Be Patient**
- Allow 24-48 hours for review
- Don't submit duplicate requests
- Monitor status updates

✅ **Request Multiple Listings**
- Don't focus on a single listing
- Submit requests for multiple properties
- Increases your chances of approval

### For Admins

✅ **Review Promptly**
- Process requests within 24-48 hours
- Set up notifications if possible
- Maintain consistent review schedule

✅ **Provide Clear Feedback**
- Always include rejection reasons
- Be specific about issues
- Help investors understand requirements

✅ **Check Lock Status**
- Verify availability before approving
- Review all requests for a listing
- Use filters and search effectively

## Related Documentation

- [Investor Guide](./LOCK_REQUEST_INVESTOR_GUIDE.md) - Step-by-step guide for investors
- [Admin Guide](./LOCK_REQUEST_ADMIN_GUIDE.md) - Approval workflow for admins
- [Troubleshooting Guide](./LOCK_REQUEST_TROUBLESHOOTING.md) - Common issues and solutions
- [Lock Request Workflow](../LOCK_REQUEST_WORKFLOW.md) - Technical documentation

