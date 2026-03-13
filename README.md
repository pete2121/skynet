# SKYNET QA Automation Helper

<p align="center">
  <img src="/src/assets/eyelogo.png" width="400">
</p>

A lightweight browser automation helper for quick UI testing directly from the browser.

Inspired by the idea of a small autonomous testing system, this tool allows developers and QA engineers to run quick checks without installing heavy frameworks.


## Features

- DOM interaction helpers
- Assertions for text and values
- Checkbox validation
- Table data validation
- Test result tracking
- Visual report generation
- PASS / FAIL charts
- Export results to JSON and CSV
- Terminator-style HUD interface

## Installation

Use as a bookmarklet or paste the script into the browser console.

## Example

```javascript
skynet.get('#email').type('test@test.com')

skynet.get('#terms').shouldBeTrue()

skynet.get('h1').shouldContainText('Dashboard')

skynet.report()

<p align="center">
  <img src="/src/assets/report.png" width="400">
</p>