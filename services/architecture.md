# Architecture

Architecture is usually part of the build - I design the system I'm about to write, because I need that clarity myself before touching code. But it can also stand on its own: if you need a system designed before anyone starts implementing it, that's work I'll take by itself.

Either way, the process is the same: understand the problem, define boundaries, model the data, then design around what the system actually needs to do - not around what might be needed someday.

See [HostIMG](../development/projects/hostimg.md) for an example — storage, metadata and processing kept as separate concerns from the start.