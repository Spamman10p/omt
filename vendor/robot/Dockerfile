# Reproducible build+test: docker build -t sis-robot . && docker run --rm sis-robot
FROM mcr.microsoft.com/playwright:v1.56.1-noble
WORKDIR /app
COPY . .
RUN npm ci && npx esbuild --version
ENV CHROME=/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell
CMD npm run export-model && npm run build && npm test
