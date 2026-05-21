# Incident Response Plan

## Roles and Responsibilities
- **Incident Commander (IC)**: Leads the response, makes critical decisions (e.g., taking system offline).
- **Security Operations (SecOps)**: Investigates the technical root cause, containment, and eradication.
- **Communications Lead**: Handles internal updates and external public relations.
- **Legal/DPO**: Ensures regulatory compliance (e.g., PDPL 72-hour breach notification).

## Severity Levels
- **SEV-1 (Critical)**: Active data breach, system-wide outage, ransomware. (SLA: 15 mins)
- **SEV-2 (High)**: Financial data integrity compromised, localized outage. (SLA: 1 hour)
- **SEV-3 (Medium)**: Single tenant issue, non-critical service disruption. (SLA: 4 hours)
- **SEV-4 (Low)**: Minor bug, UI glitch with no security impact. (SLA: 24 hours)

## Incident Lifecycle
1. **Preparation**: Quarterly tabletop exercises, automated SIEM alerts.
2. **Identification**: SIEM triggers alert. On-call engineer validates the alert.
3. **Containment**: Isolate affected systems. (e.g., Block IPs in WAF, revoke compromised credentials, take specific tenant offline).
4. **Eradication**: Remove the threat (e.g., delete malicious files, patch vulnerability).
5. **Recovery**: Restore data from backups, monitor for re-infection.
6. **Lessons Learned**: Conduct a "5 Whys" post-mortem within 48 hours. Update this playbook.

## Communication Templates
*Internal Slack (SEV-1/2):*
`[SEV-X] <Incident Title>. Impact: <Describe Impact>. Status: Investigating. Lead: @<Name>. Next update: <Time>.`

*PDPL Breach Notification (DPO):*
Must be submitted to SDAIA within 72 hours of becoming aware of a breach involving personal data.
