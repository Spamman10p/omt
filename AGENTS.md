# OMT worker instructions

- This repository is the standalone One More Thing meme site. Entry point: index.html.
- Mac is the project workspace. Follow the user's persistent tmux -> Tailscale SSH -> visible Mac Herdr workflow.
- Run dependency installation, builds and browser tests in Docker. Never install project packages on the Mac host without explicit human authorization.
- Preserve the robot-led visual design, task loop, original artwork fallback, keyboard accessibility and reduced motion.
- Keep work local and unpushed unless the human authorizes a push. Use feature branches for later changes.
- Coordinate one writer per file; inspect existing changes before editing.
- Never commit credentials, caches, node_modules or generated test artifacts.
- No providers, wallets, persistence, public service binds or production deployment without explicit scope.
- Use node tools/qa.js, node --check workshop.js, and relevant browser checks in Docker.
- Actual model integration is pending; fixture-based API tests are not proof of GLB/WebGL behavior.
