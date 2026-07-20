# VPS Setup Scripts

A growing collection of Bash scripts for VPS provisioning and hardening — server hardening, mail server setup, TLS, and firewall configuration. Ongoing, not a finished tool.

---

## Overview

A grab-bag of scripts built while setting up and hardening VPS instances repeatedly enough that it made sense to stop retyping the same commands — SSH/UFW/fail2ban hardening, a Postfix/Dovecot mail server setup, certbot automation, and SMTP-specific firewall rules. It's explicitly not a configuration-management framework (no Ansible/Terraform underneath) — just scripts meant to be read before running, not executed blindly.

It's actively growing in two directions at once: a handful of working standalone scripts that do their job, and a newer, more disciplined modular rewrite of the mail server setup specifically, which is still in progress.

---

## Engineering Summary

The standalone scripts are straightforward and honest about their own limits — the mail setup script, for instance, explicitly comments that it doesn't configure SPF/DKIM/DMARC, anti-spam, or a real CA-issued certificate, and generates a self-signed one instead. There are two versions of the hardening script, and the difference between them is the interesting part: the newer one (`safe_secure.sh`) adds a manual checkpoint — pause, open a new terminal, confirm the new user can actually SSH in — before the script proceeds to disable root login and password auth. The earlier version didn't have that check, which is exactly the kind of mistake that locks you out of your own server.

The in-progress `bundle/` rewrite of the mail setup is a step up in structure: preflight checks (port conflicts, conflicting MTA detection, FQDN/DNS validation, disk and memory checks, apt-lock detection) run before anything is touched, with logging and a state directory for tracking what's already been applied. Only the first few modules are actually filled in — everything past hostname/TLS setup, plus the rollback scripts, are scaffolding right now.

---

## Key Features

*(what's working today)*

* SSH/UFW/fail2ban hardening scripts, with a safer iteration that verifies SSH access before locking anything down
* Postfix + Dovecot mail server setup (local delivery, self-signed TLS)
* Certbot automation for real TLS certificates
* SMTP-specific UFW rule script

*(in progress)*

* A modular rewrite of the mail setup with preflight validation, logging, state tracking, and rollback scripts — currently a few modules deep, not complete

---

## Technical Stack

**Language**
Bash

**Targets**
Postfix, Dovecot, UFW, fail2ban, certbot, systemd

**Supported OS**
Debian, Ubuntu

---

## Interesting Engineering Decisions

**A manual checkpoint before disabling password auth.** The first hardening script disables root login and password authentication in one pass. The revised version pauses first — prompting to open a new terminal and confirm key-based SSH actually works — before doing anything irreversible. Small change, but it's the difference between "probably fine" and actually verified.

**Preflight checks before any real change, in the newer bundle.** Rather than assuming the environment is clean, the rewrite explicitly checks for port conflicts, already-running mail services, a valid FQDN, and enough disk/memory before touching anything — failing loudly and early instead of partway through a Postfix config edit.

---

## Status

This one's ongoing rather than finished — the standalone scripts work and get used, and the modular mail-setup rewrite is being built out module by module rather than all at once. Structure and safety checks come first; the actual Postfix/Dovecot configuration modules in the new bundle aren't filled in yet.

---

## Technologies Demonstrated

* Shell scripting for infrastructure automation
* Server hardening (SSH, firewall, intrusion prevention)
* Mail server configuration (Postfix, Dovecot, TLS)
* Idempotent, state-tracked automation design

---

## Suitable Portfolio Categories

Labs · DevOps · Infrastructure · Open Source