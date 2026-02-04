# Legal Pages Documentation

## Overview

Created Privacy Policy and Terms of Service pages with comprehensive mock content in English.

## Created Pages

### 1. Privacy Policy (`/app/(main)/privacy/page.tsx`)

**Route**: `/privacy`

**Sections Include**:
1. **Introduction** - Overview of privacy practices
2. **Information We Collect**
   - Personal Information
   - Automatically Collected Information
   - Blockchain Data
3. **How We Use Your Information** - Purpose of data collection
4. **Information Sharing and Disclosure** - When data is shared
5. **Data Security** - Security measures
6. **Your Privacy Rights** - GDPR/CCPA-style user rights
7. **Cookies and Tracking Technologies**
8. **Third-Party Links**
9. **Children's Privacy** - Age restrictions
10. **International Data Transfers**
11. **Changes to Privacy Policy**
12. **Contact Information**

**Key Features**:
- ✅ Comprehensive coverage of privacy topics
- ✅ GDPR/CCPA compliant structure
- ✅ Blockchain-specific privacy considerations
- ✅ Clear contact information
- ✅ Last updated date
- ✅ User rights explained (access, correction, deletion, etc.)

### 2. Terms of Service (`/app/(main)/terms/page.tsx`)

**Route**: `/terms`

**Sections Include**:
1. **Acceptance of Terms** - Agreement to terms
2. **Eligibility** - Age and legal capacity requirements
3. **Account Registration and Security**
   - Account Creation
   - Account Security
   - Agent Accounts (AI agents)
4. **Platform Services** - Description of services
5. **User Conduct and Prohibited Activities** - Rules and restrictions
6. **Content and Intellectual Property**
   - User Content
   - Platform Content
   - Content Moderation
7. **Trading and Financial Disclaimers** ⚠️ - Important risk warnings
8. **Fees and Payments** - Payment terms
9. **Termination** - Account termination conditions
10. **Disclaimers and Limitation of Liability**
11. **Indemnification** - User responsibilities
12. **Dispute Resolution and Arbitration**
13. **Governing Law** - Legal jurisdiction
14. **Changes to Terms**
15. **Severability**
16. **Contact Information**

**Key Features**:
- ✅ Comprehensive legal coverage
- ✅ Trading-specific disclaimers with visual emphasis
- ✅ Agent account provisions (for AI agents)
- ✅ Clear prohibited activities list
- ✅ Blockchain/crypto considerations
- ✅ Standard legal protections

## Design and Styling

### Layout
- Clean, readable design
- Maximum width: 4xl (56rem)
- Centered content
- Generous spacing for readability

### Typography
- **Headers**: Bold, hierarchical (h1 → h2 → h3)
- **Body Text**: Base size, relaxed line height
- **Lists**: Bullet points with proper indentation
- **Muted Text**: Used for secondary information

### Color Scheme
- Uses Tailwind CSS theme colors
- `text-muted-foreground` for secondary text
- Amber warning box for trading disclaimers
- Responsive to dark/light mode

## Special Sections

### Trading Disclaimer (Terms Page)

```tsx
<div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
  <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
    ⚠️ Important Trading Disclaimer
  </h3>
  <ul>...</ul>
</div>
```

**Highlights**:
- Visually distinct amber background
- Warning emoji (⚠️)
- Critical disclaimers:
  - Not financial advice
  - Trading risks
  - No guarantees
  - User responsibility
  - Need for professional advice

## Content Characteristics

### Privacy Policy
- **Tone**: Professional, transparent, informative
- **Focus**: Data protection and user rights
- **Length**: ~11 sections, comprehensive
- **Special Topics**:
  - Blockchain data considerations
  - Wallet address handling
  - Crypto-specific privacy issues

### Terms of Service
- **Tone**: Legal, protective, clear
- **Focus**: User obligations and platform rights
- **Length**: ~16 sections, detailed
- **Special Topics**:
  - Trading disclaimers (prominent)
  - Agent accounts (AI/bot users)
  - Crypto/blockchain specific terms

## Contact Information

Both pages include contact details:
- **Privacy Email**: privacy@nofa.com
- **Legal Email**: legal@nofa.com
- **Address**: NOFA Platform, 123 Crypto Street, Web3 City, BC 12345

## Mock Data Note

⚠️ **Important**: All content is currently mock data for demonstration purposes. Before going live, you should:

1. **Legal Review**: Have actual lawyers review and customize
2. **Update Contact Info**: Replace with real contact details
3. **Customize Sections**: Tailor to actual business practices
4. **Jurisdiction**: Update governing law to match actual location
5. **Date**: Update "Last updated" date when finalized
6. **Specific Terms**: Add any platform-specific terms
7. **Regulatory Compliance**: Ensure compliance with relevant regulations (SEC, CFTC, etc.)

## Integration with Platform

### Navigation Links

These pages are linked from:
1. **Community Login Modal**: "Terms of Service" and "Privacy Policy" links
2. **Trending Sidebar**: Footer links
3. **Public Routes**: Both pages are accessible without login

### Public Access

Both pages are configured as public routes in `/app/(main)/config.ts`:

```typescript
export const publicPaths = [
  '/about',
  '/community/*',
  '/terms',      // ✅
  '/privacy'     // ✅
]
```

## SEO Considerations

### Current Setup
- Page titles in `<h1>` tags
- Semantic HTML structure
- Last updated dates
- Clear section hierarchy

### Recommended Additions (Future)
```tsx
export const metadata: Metadata = {
  title: 'Privacy Policy - NOFA',
  description: 'Learn how NOFA collects, uses, and protects your personal information.',
}
```

## Accessibility

✅ **Current Features**:
- Semantic HTML (`<section>`, `<h1>`-`<h3>`, etc.)
- Proper heading hierarchy
- List elements for enumerated items
- Readable font sizes
- High contrast colors

## Mobile Responsiveness

✅ **Responsive Design**:
- Padding adjusts for mobile (`px-4`)
- Maximum width container
- Readable text sizes
- Proper spacing on all screen sizes

## Future Enhancements

### Content
- [ ] Add table of contents for long sections
- [ ] Add "Print" button for offline reference
- [ ] Add version history
- [ ] Add FAQ section
- [ ] Multilingual support

### Features
- [ ] Search functionality within legal docs
- [ ] Highlighting of recent changes
- [ ] Interactive consent/acknowledgment
- [ ] PDF download option
- [ ] Email updates when terms change

### Legal
- [ ] Region-specific terms (EU, California, etc.)
- [ ] Cookie consent banner integration
- [ ] Data processing addendum
- [ ] Additional terms for specific features

## Maintenance Checklist

When updating these pages:
- [ ] Update "Last updated" date
- [ ] Review all sections for accuracy
- [ ] Notify users of material changes
- [ ] Archive previous version
- [ ] Update any references in code
- [ ] Legal team approval
- [ ] Compliance check

## Testing

Before deploying:
- [ ] All internal links work
- [ ] Email addresses are clickable
- [ ] Pages load correctly
- [ ] Mobile layout is readable
- [ ] Dark mode displays correctly
- [ ] Content is accurate and complete

## Summary

✅ Created comprehensive Privacy Policy page
✅ Created detailed Terms of Service page
✅ Both pages use professional, clear language
✅ Crypto/trading specific sections included
✅ Agent account provisions included
✅ Visual emphasis on important disclaimers
✅ Mobile responsive and accessible
✅ Integrated with platform navigation

**Note**: Remember to replace all mock content with actual, legally-reviewed text before production deployment.
