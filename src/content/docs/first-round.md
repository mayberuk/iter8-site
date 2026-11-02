---
title: Your first round
crumb: Docs › Start
intro: Open a page, leave two notes, send them, and watch your agent close them. It takes about two minutes.
toc:
  - { id: 1-open-the-page, label: Open the page }
  - { id: 2-pick-and-write, label: Pick and write }
  - { id: 3-say-what-kind-of-note-it-is, label: Intents }
  - { id: 4-send-the-round, label: Send the round }
  - { id: 5-what-your-agent-does-with-it, label: What the agent does }
prev: { label: Install, href: "#install" }
next: { label: Review over SSH, href: "#ssh" }
---

<div class="callout"><i data-icon="info"></i><p>Today iter8 works with Claude Code 2.1.296 or newer on macOS (Apple silicon) or Linux (x64), and a dev server or a folder of HTML.</p></div>

## 1. Open the page

In the agent session that should own the page, ask for it in plain words, or run the command yourself:

<pre><span class="mu">$</span> <b>iter8 open http://localhost:5173</b>
shop · http://shop.localhost/</pre>

The page opens at its own `*.localhost` address with the dock along the bottom. The ring around the agent’s avatar breathes green while the session is live.

## 2. Pick and write

Press <kbd>C</kbd>, move over the page, and the ring follows the element under your pointer. Use <kbd>↑</kbd> and <kbd>↓</kbd> to climb to its parent and back, then press <kbd>Enter</kbd> or click to write a note. Save with <kbd data-mod>⌘</kbd> <kbd>Enter</kbd>.

## 3. Say what kind of note it is

iter8 guesses the intent from what you type and marks the guess with a sparkle. Pick a card, or press <kbd>1</kbd> to <kbd>4</kbd>, to choose it yourself.

<table class="itable">
  <thead><tr><th>Intent</th><th>Use it when</th><th>Your agent</th></tr></thead>
  <tbody>
    <tr class="i-fix"><td><i data-glyph="fix"></i>Fix</td><td>Something is broken or wrong.</td><td>Fixes it and closes the note.</td></tr>
    <tr class="i-change"><td><i data-glyph="change"></i>Change</td><td>It works, but should become something else.</td><td>Makes the change.</td></tr>
    <tr class="i-question"><td><i data-glyph="question"></i>Question</td><td>You want to know something.</td><td>Answers on the page, pinned to the element.</td></tr>
    <tr class="i-keep"><td><i data-glyph="keep"></i>Keep</td><td>It must stay exactly as it is.</td><td>Leaves it alone while changing what’s around it.</td></tr>
  </tbody>
</table>

## 4. Send the round

The dock counts your notes. Press Send and every note goes to your agent as one round. The dock tells you where it is:

<table class="itable">
  <thead><tr><th>Dock</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td><i data-status="delivered" style="color:var(--cobalt-t)"></i>delivered</td><td>The session has been told a round is waiting.</td></tr>
    <tr><td><i data-status="working" style="color:var(--busy-t)"></i>busy</td><td>The agent is mid-turn. Send reads Queue and the round waits for the next turn.</td></tr>
    <tr><td><i data-status="done" style="color:var(--keep-t)"></i>done</td><td>The agent closed the note. An answered question shows its reply on the pin.</td></tr>
  </tbody>
</table>

<div class="callout warn"><i data-icon="alert"></i><p>If the session ends, the dock strikes the page name through and won’t send. Open the page again from a live session to pair it.</p></div>

## 5. What your agent does with it

A hook hands the session a pointer, never your words. The agent runs `iter8 show` to read the notes, then closes each one:

<pre><b>iter8 show R3</b>
<b>iter8 done N1</b>
<b>iter8 done N2 --reply "Yes. Run iter8 setup my-server once on your laptop."</b></pre>

Everything captured from the page arrives fenced as untrusted, so text on a page can’t pass itself off as your instructions.
