require("dotenv").config();

const { spawn } = require("child_process");

const scripts = [
  "src/utils/seedNodes.js",
  "src/utils/seedOwner.js"
];

const runScript = (script) =>
  new Promise((resolve, reject) => {
    const child = spawn("node", [script], {
      stdio: "inherit",
      shell: true
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with code ${code}`));
      }
    });
  });

(async () => {
  try {
    for (const script of scripts) {
      await runScript(script);
    }

    console.log("All seeders completed");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();