# System Design

This is about the high-level side of building software — how parts of a system communicate, not how any individual part works internally.

I start by defining boundaries: what each service is actually responsible for, and where the edges between them are. Once that's clear, I look at how data moves — what talks to what, synchronously or through a queue, and why.

I try to keep the number of moving parts honest to the actual load and requirements. A system built for 10 requests a second doesn't need the same topology as one built for 10,000, and pretending otherwise just adds places for things to break.

Queues and workers show up often in what I design — they're a simple way to decouple parts of a system without adding much complexity, and they hold up well under load.

The test I use for a design: could someone else look at the diagram and understand why each piece exists, not just what it does.