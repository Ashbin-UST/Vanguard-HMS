require("dotenv").config();

const { spawn } = require("node:child_process");

const scripts = [
  "src/utils/seedOwner.js"
];

const runScript = (script) =>
  new Promise((resolve, reject) => {
    // Use the absolute path of the running Node binary (process.execPath) and
    // avoid shell:true so the command is not resolved through the PATH env var,
    // which may include writable directories (sonar javascript:S4036).
    const child = spawn(process.execPath, [script], {
      stdio: "inherit"
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with code ${code}`));
      }
    });
  });

(async () => { // NOSONAR - top-level await is unavailable in CommonJS modules
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
