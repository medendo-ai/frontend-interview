# Daniel Freire's Comments

## Overall Comments

- No tests. This can lead to unatended bugs.
- `window.alert()` is quite "strong/scary" for a user-centric product. A modal notifying the user would be a "nicer" solution.
- Model takes time to load. This can be checked in browser's console.
  - Was not able to fix it.

### ./src/Index.tsx

- Index.tsx -> index.tsx

  - This is problematic because if the filename does not match directory paths in other files, then it won't be loaded

### ./webpack.config.js

- Although `test: /\.css$/` should be enough for most use cases, replacing with `test: /\.s?css$/` may prevent future issues in development if ssomeone decides to implement scss (Sassy Cascading Style Sheets)

### App.tsx

- useEffect() did not have dependency array.

  - Without a dependency array, useEffect() will run at every render. It may, potentially, run an infinite loop.

- `const summarizerRef = useRef<any>(null);`

  - use of `<any>` type should be avoided, because if you don't check for types then the browser can't catch type related errors. which may lead to bugs
    - Was not able to find a solution.

- ctrl + space is not working

  - data-key commands for keyboard keys:
    - Control === data-key="17"
    - Space === data-key="32"
      - source: https://www.toptal.com/developers/keycode/table
  - App should be more explicit about keyboard. A simple tooltip should suffice.

- Should replace `console.log("Saving transcript to local storage...")` with a more visible solution for the user to see. Ideally a Modal to get user's attention

- `const newGeneratingState = true;
setIsGeneratingSummary(newGeneratingState);` is unnecessary. `setIsGeneratingSummary(true);` is more efficient since it doesn't create a new variable.

  - Same fix for the false statement

- Wrote `const [transcript, setTranscript] = useState(localStorage.getItem("savedTranscript") || "",)` because the app was saving transcript when unloading (closing the page), but it wasn't checking for it while loading/re-loading.

- Report was tested on Spanish, and it seems to be planned for English.

- Rewrote `{transcript || <span className="placeholder">Your buggy transcription will appear here...</span>}
{interimText && <span className="interim-text"> {interimText}</span>}
</div>` as `{transcript ? (transcript) : interimText ? (<span className="interim-text">{interimText}</span>) : (<span className="placeholder">Your transcription will appear here...</span>)}` to make sure that the placeholder wouldn't mix with the interim text.

- If you stop speaking for over 2 seconds you loose the interimText effect where words show on screen one by one.

  - Was not able to find a solution on time.

- Generating the Bug Report now stops the recording. This should allow the user to make sure they're not missing important information.

- When you start recording, now deletes former report.

- Show loading modal while making the report.

  - I Did not have time to implement this.

- Moved the catterpillar to the the dashed line so it will look a trail :)
