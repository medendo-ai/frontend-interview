To get application running:
    - Ran 'npm install'
    - Started dev server 'npx webpack serve'
    - Checked browser console for errors


Observed issues:
Bug 1: "App.tsx:79 Maximum update depth exceeded. This can happen when a component calls setState inside useEffect,
        but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."
        The error above occured after
            - Refreshing page or 
            - 'Start Recording'
            - Changing language
    
    Problem: useEffect has no dependency array, meaning it runs on every render.
        Inside it, we call setCharacterCount, setWordCount, setSentenceCount, and setLastUpdated, all of which trigger another render.
        - Which triggers the same useEffect again
        - Which updates state again
        - Infinite loop
    
    Fix: We only want this effect to run when transcript changes. Add [transcript] dependency.



Sources for backend part:
https://fastapi.tiangolo.com/tutorial/first-steps/
https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference#chat-completions