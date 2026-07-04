# syntax=docker/dockerfile:1

###############################################################################
# cloudscraper.js — container image
#
# Bundles Node (SDK + MCP server) with Python 3 and the `cloudscraper` library
# (the actual Cloudflare-bypass engine) in one image, so the whole stack —
# daemon, SDK and MCP server — runs with a single command:
#
#   docker build -t cloudscraper-js .
#   docker run -i --rm cloudscraper-js          # boots the MCP server on stdio
#
# Point any MCP client (Claude Desktop, IDEs, …) at that `docker run` command.
# Override the CMD to run the SDK or an example instead, e.g.:
#
#   docker run --rm cloudscraper-js node -e "import('cloudscraper.js').then(...)"
###############################################################################

# --- Stage 1: build the TypeScript SDK ---------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install deps first for better layer caching (build needs devDeps to run tsc).
COPY package.json package-lock.json ./
RUN npm ci

# Compile src/ -> built/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop devDependencies so only runtime deps land in the final image.
RUN npm prune --omit=dev


# --- Stage 2: lean runtime with Node + Python + cloudscraper -----------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH"

# Python 3 + an isolated venv holding `cloudscraper` (no --break-system-packages,
# no system-python pollution). The daemon spawns `python3` from PATH, which now
# resolves to this venv. The final line fails the build fast if the import breaks.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
 && python3 -m venv /opt/venv \
 && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
 && /opt/venv/bin/pip install --no-cache-dir cloudscraper \
 && /opt/venv/bin/python -c "import cloudscraper; print('cloudscraper', cloudscraper.__version__)" \
 && rm -rf /var/lib/apt/lists/*

# App: runtime node_modules + compiled JS + the Python entrypoints.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/built ./built
COPY package.json ./
COPY daemon.py index.py ./

# Run as the unprivileged user shipped with the node image.
USER node

# Default: the MCP server (stdio transport). Override to run the SDK/examples.
CMD ["node", "built/mcp/bin.js"]
