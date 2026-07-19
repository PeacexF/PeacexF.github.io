# Engineering Principles

I optimize for a codebase that feels like one project, not a pile of tools duct-taped together. Every part should have the same "handle" — same conventions, same structure, same way of doing things — so picking up any file feels familiar instead of like switching contexts.

Dependencies are added when they solve a real problem, not by default. I'd rather write twenty lines myself than pull in a library for something trivial. Fewer moving parts means fewer things that can break, and fewer things I have to explain to whoever reads this next.

SQL over ORM, all the time. I want to see the query I'm actually running, not guess what an abstraction generated for me.

Complexity should match the problem. An app doing 10 requests a second doesn't need the same architecture as one doing 10,000 — and building for a scale you don't have yet just adds surface area for bugs, without adding any real value.

A few things that tell me a codebase is in trouble:

* Five different languages doing the job two could do
* Dependency hell — half the tree pinned to versions nobody remembers why
* Architecture clearly copied from a scale the project will never reach
* Everything crammed into one file, or the opposite: split into so many pieces that following one request through the code means opening fifteen files

Good software, to me, is software someone else (or me, in a year) can open, understand, and safely change without having to ask me first.