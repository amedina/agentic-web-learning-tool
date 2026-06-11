# Engine Core

This is the central logic hub for the entire project. It’s responsible for taking a workflow—essentially a series of steps or nodes and making sure they actually run.

### What it does

- **Execution:** It parses the JSON representation of a workflow and manages the flow from one step to the next.
- **Tools & AI:** It includes the actual "brains" for different tools, like connecting to AI APIs for translation and summarization, or finding specific elements on a webpage.
- **Safety:** Uses strict validation to ensure workflows are formatted correctly before they ever start running.
