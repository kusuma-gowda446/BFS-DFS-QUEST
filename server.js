const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 8080;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Fallback to index.html for single page application routing if needed
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
