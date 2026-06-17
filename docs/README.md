# UAT Evidence Collector

UAT Evidence Collector is a fully offline browser application that simulates a banking UAT evidence capture workflow used alongside Power Automate Desktop. It runs directly from `index.html` in Microsoft Edge or Google Chrome and does not require internet access, npm, Node.js, installation, admin rights, build tools, CDNs, or external libraries.

## Architecture

The app uses plain HTML5, CSS3, and vanilla JavaScript ES6. Files are split by responsibility:

- `index.html` defines the application shell and script loading order.
- `css/styles.css` contains the responsive enterprise banking UI theme.
- `js/state.js` owns local storage persistence, metadata, test cases, screenshots, run state, summaries, and recent runs.
- `js/execution.js` implements run start/end, test case navigation, PASS/FAIL lifecycle actions, exports, and package download.
- `js/screenshots.js` captures evidence with `navigator.mediaDevices.getDisplayMedia` and automatically falls back to a generated canvas PNG.
- `js/reports.js` creates execution summary and per-test-case HTML/JSON report content.
- `js/zip.js` writes a valid store-only ZIP archive in pure JavaScript.
- `js/crc32.js` calculates CRC32 values required by ZIP readers.
- `js/dashboard.js` renders metrics, tables, galleries, logs, summary, and recent runs.
- `js/logger.js` records the audit log in the required format.
- `js/utilities.js` provides formatting, download, folder naming, dialogs, and toast helpers.

## Folder Structure

```text
UAT-Evidence-Collector/
  index.html
  css/
    styles.css
  js/
    app.js
    state.js
    dashboard.js
    execution.js
    screenshots.js
    reports.js
    zip.js
    crc32.js
    logger.js
    utilities.js
  assets/
    logo.svg
    icons/
      camera.svg
      check.svg
      x.svg
  docs/
    README.md
  sample-data/
    testcases.json
```

## Usage

1. Extract the project ZIP to any folder on a Windows laptop.
2. Open `index.html` in Edge or Chrome.
3. Click `Import Sample Test Cases`.
4. Confirm the execution setup fields.
5. Click `Start Execution`.
6. Use the floating capture widget to capture screenshots, mark PASS/FAIL, move to the next test case, and end the run.
7. Download the execution summary HTML, summary JSON, logs, or the complete evidence package ZIP.

The browser demo displays the production target folder message:

```text
Documents\UAT_EXECUTIONS
```

In a production Power Automate Desktop implementation, the same generated package structure would be saved into that location.

## Browser Requirements

- Microsoft Edge or Google Chrome.
- JavaScript enabled.
- Local storage enabled for refresh recovery and resume support.
- Screen capture permission for real screenshot evidence.

The app can still run if screen capture is denied or unavailable.

## ZIP Implementation

The ZIP writer is implemented in `js/zip.js` without JSZip or dependencies. It creates:

- Local File Headers
- Central Directory records
- End Of Central Directory record
- UTF-8 file names
- Store-only file entries with no compression
- Correct CRC32 values from `js/crc32.js`

The resulting archive is designed to open in Windows Explorer, 7-Zip, and WinRAR.

## Evidence Package Structure

Downloaded evidence packages use this structure:

```text
RUN_YYYYMMDD_HHMMSS/
  Metadata/
    run.json
    metadata.json
  Reports/
    ExecutionSummary.json
    ExecutionSummary.html
  Logs/
    ApplicationLog.txt
  TC01_LoginValidation/
    Screenshots/
    Report/
  TC02_CreateCustomer/
    Screenshots/
    Report/
  TC03_FundTransfer/
    Screenshots/
    Report/
  TC04_AccountStatement/
    Screenshots/
    Report/
  TC05_Logout/
    Screenshots/
    Report/
```

Per-test-case folders use `TC_ID + "_" + PascalCase(TestCaseName)` with spaces, punctuation, and special characters removed.

## Screenshot Capture

The primary capture path calls:

```javascript
navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
```

The captured video frame is drawn to a canvas and saved as a PNG data URL in memory. Screenshot file names use:

```text
TC_ID_SEQ_yyyyMMdd_HHmmss.png
```

The sequence number resets per test case and is zero-padded to three digits.

## Known Browser Limitations

- Some browsers restrict `getDisplayMedia` when opening a page from `file://`.
- Corporate policies may block screen capture.
- Users may deny the screen capture prompt.
- Screen capture can require an explicit user gesture.

When any of these occur, the app automatically creates a realistic banking-style placeholder PNG using Canvas. This keeps the demo workflow, evidence gallery, reports, and ZIP export fully functional.

## Persistence

State is saved in local storage. Refreshing the browser restores:

- Execution metadata
- Imported test cases
- Active run
- Test case statuses
- Screenshot data
- Audit logs
- Summary data
- Recent runs

Use `Reset Demo` to clear the current application state.
